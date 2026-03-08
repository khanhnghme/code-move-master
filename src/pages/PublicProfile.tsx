import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserAvatar from '@/components/UserAvatar';
import {
  Github, Linkedin, Facebook, Globe, Mail, GraduationCap, BookOpen, Calendar,
  ArrowLeft, Loader2, FolderKanban, ExternalLink, Trophy, Video, VideoOff, Share2
} from 'lucide-react';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
  [key: string]: string | undefined;
}

interface ProfileData {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string | null;
  major: string | null;
  year_batch: string | null;
  social_links: SocialLinks;
}

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  link_url: string | null;
  category: string;
}

interface PublicGroup {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github, linkedin: Linkedin, facebook: Facebook, website: Globe,
};
const socialLabels: Record<string, string> = {
  github: 'GitHub', linkedin: 'LinkedIn', facebook: 'Facebook', website: 'Website',
};
const categoryLabels: Record<string, string> = {
  academic: 'Học tập', activity: 'Hoạt động', skill: 'Kỹ năng & Chứng chỉ', award: 'Giải thưởng', general: 'Khác',
};
const categoryEmoji: Record<string, string> = {
  academic: '📚', activity: '🎯', skill: '🏅', award: '🏆', general: '📌',
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideo, setShowVideo] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch video settings
    const fetchVideo = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'dashboard_video_bg')
        .maybeSingle();
      if (data?.value) {
        const val = data.value as { enabled?: boolean; url?: string; landing_opacity?: number };
        setVideoEnabled(val.enabled ?? false);
        setVideoUrl(val.url ?? '');
      }
    };
    fetchVideo();
  }, []);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, student_id, email, avatar_url, bio, skills, major, year_batch, social_links')
        .eq('username', username)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setProfile({ ...data, social_links: (data.social_links as SocialLinks) || {} });

      const [achievementsRes, membersRes] = await Promise.all([
        supabase.from('profile_achievements').select('id, title, description, image_path, link_url, category')
          .eq('user_id', data.id).order('display_order'),
        supabase.from('group_members').select('group_id, groups!inner(id, name, slug, description, is_public)')
          .eq('user_id', data.id),
      ]);

      setAchievements((achievementsRes.data as Achievement[]) || []);
      if (membersRes.data) {
        setGroups(membersRes.data.filter((m: any) => m.groups?.is_public).map((m: any) => m.groups as PublicGroup));
      }
      setLoading(false);
    };
    load();
  }, [username]);

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('profile-achievements').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Simple feedback
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Đang tải trang cá nhân...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Không tìm thấy trang cá nhân</h1>
        <p className="text-muted-foreground">Username "<span className="font-mono">{username}</span>" không tồn tại.</p>
        <Button variant="outline" asChild><Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Về trang chủ</Link></Button>
      </div>
    );
  }

  const activeSocialLinks = Object.entries(profile.social_links).filter(([_, v]) => v && v.trim());
  const skillList = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const achievementGroups = Object.entries(categoryLabels)
    .map(([value, label]) => ({ value, label, items: achievements.filter(a => a.category === value) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Video Background */}
      {videoEnabled && videoUrl && showVideo && (
        <>
          <video
            autoPlay loop muted playsInline
            className="fixed inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000"
            style={{ opacity: 0.15, zIndex: 0 }}
            src={videoUrl}
          />
          <div className="fixed inset-0 bg-background/70 pointer-events-none" style={{ zIndex: 1 }} />
        </>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ zIndex: 2 }}>
        <div className="h-56 md:h-72 bg-gradient-to-br from-primary via-primary/85 to-primary/60 relative">
          {/* Decorative patterns */}
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px, 80px 80px, 100px 100px'
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" />Trang chủ</Link>
            </Button>
            <div className="flex items-center gap-2">
              {videoEnabled && videoUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm h-9 w-9"
                        onClick={() => setShowVideo(!showVideo)}
                      >
                        {showVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showVideo ? 'Tắt video nền' : 'Bật video nền'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon"
                      className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm h-9 w-9"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sao chép liên kết</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative pb-16" style={{ zIndex: 3 }}>
        {/* Profile Header Card */}
        <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="shrink-0 flex flex-col items-center md:items-start">
                <div className="relative">
                  <UserAvatar
                    src={profile.avatar_url}
                    name={profile.full_name}
                    size="xl"
                    className="w-32 h-32 border-4 border-background shadow-2xl text-3xl ring-4 ring-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-card" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                <p className="text-muted-foreground font-medium mt-0.5">@{username}</p>
                
                {profile.bio && (
                  <p className="text-foreground/80 leading-relaxed mt-3 max-w-xl">{profile.bio}</p>
                )}

                {/* Quick Info Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 mt-4 text-sm">
                  {profile.student_id && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{profile.student_id}</span>
                    </div>
                  )}
                  {profile.major && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{profile.major}</span>
                    </div>
                  )}
                  {profile.year_batch && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Khóa {profile.year_batch}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                {/* Social Links inline */}
                {activeSocialLinks.length > 0 && (
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                    {activeSocialLinks.map(([key, url]) => {
                      const Icon = socialIcons[key] || Globe;
                      return (
                        <TooltipProvider key={key}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg"
                              >
                                <Icon className="w-4.5 h-4.5" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>{socialLabels[key] || key}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Left Column: Skills + Groups */}
          <div className="space-y-6">
            {/* Skills */}
            {skillList.length > 0 && (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skillList.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Public Groups */}
            {groups.length > 0 && (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dự án</h3>
                  <div className="space-y-2">
                    {groups.map(g => (
                      <div key={g.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/60 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Achievements - spans 2 cols */}
          <div className="md:col-span-2">
            {achievementGroups.length > 0 ? (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />Thành tích & Chứng chỉ
                  </h3>
                  <div className="space-y-6">
                    {achievementGroups.map(group => (
                      <div key={group.value}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">{categoryEmoji[group.value]}</span>
                          <h4 className="text-sm font-semibold">{group.label}</h4>
                          <Badge variant="outline" className="text-xs ml-auto">{group.items.length}</Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.items.map(a => (
                            <div
                              key={a.id}
                              className="group rounded-xl border bg-card hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                              {a.image_path && (
                                <div
                                  className="h-36 bg-muted overflow-hidden cursor-pointer"
                                  onClick={() => setSelectedImage(getImageUrl(a.image_path!))}
                                >
                                  <img
                                    src={getImageUrl(a.image_path)}
                                    alt={a.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-3">
                                <h5 className="font-medium text-sm leading-snug">{a.title}</h5>
                                {a.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                                )}
                                {a.link_url && (
                                  <a
                                    href={a.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium"
                                  >
                                    <ExternalLink className="w-3 h-3" />Xem chi tiết
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Chưa có thành tích nào được chia sẻ</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          style={{ zIndex: 100 }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Achievement"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
