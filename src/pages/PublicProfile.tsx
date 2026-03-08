import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { Github, Linkedin, Facebook, Globe, Mail, GraduationCap, BookOpen, Calendar, ArrowLeft, Loader2, FolderKanban, ExternalLink, Trophy } from 'lucide-react';

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

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

      // Load achievements and groups in parallel
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Không tìm thấy trang cá nhân</h1>
        <p className="text-muted-foreground">Username "{username}" không tồn tại.</p>
        <Button variant="outline" asChild><Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Về trang chủ</Link></Button>
      </div>
    );
  }

  const activeSocialLinks = Object.entries(profile.social_links).filter(([_, v]) => v && v.trim());
  const skillList = profile.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

  // Group achievements by category
  const achievementGroups = Object.entries(categoryLabels)
    .map(([value, label]) => ({ value, label, items: achievements.filter(a => a.category === value) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary via-primary/80 to-primary/60 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" />Trang chủ</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-12">
        {/* Avatar + Name */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-8">
          <UserAvatar src={profile.avatar_url} name={profile.full_name} size="xl" className="w-28 h-28 border-4 border-background shadow-xl text-2xl" />
          <div className="text-center sm:text-left pb-1">
            <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name}</h1>
            <p className="text-muted-foreground">@{username}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {profile.bio && <p className="text-foreground/90 leading-relaxed">{profile.bio}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {profile.student_id && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>MSSV: <span className="text-foreground font-medium">{profile.student_id}</span></span>
                  </div>
                )}
                {profile.major && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="text-foreground font-medium">{profile.major}</span>
                  </div>
                )}
                {profile.year_batch && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Khóa <span className="text-foreground font-medium">{profile.year_batch}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-foreground font-medium">{profile.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          {skillList.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kỹ năng</h3>
                <div className="flex flex-wrap gap-2">
                  {skillList.map((skill, i) => <Badge key={i} variant="secondary" className="px-3 py-1">{skill}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {achievementGroups.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />Thành tích & Chứng chỉ
                </h3>
                <div className="space-y-5">
                  {achievementGroups.map(group => (
                    <div key={group.value}>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
                      <div className="grid gap-3">
                        {group.items.map(a => (
                          <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                            {a.image_path && (
                              <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                <img src={getImageUrl(a.image_path)} alt={a.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm">{a.title}</h4>
                              {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                              {a.link_url && (
                                <a href={a.link_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
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
          )}

          {/* Social Links */}
          {activeSocialLinks.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Liên kết</h3>
                <div className="grid gap-2">
                  {activeSocialLinks.map(([key, url]) => {
                    const Icon = socialIcons[key] || Globe;
                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-sm font-medium">{socialLabels[key] || key}</span>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public Groups */}
          {groups.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dự án công khai</h3>
                <div className="grid gap-2">
                  {groups.map(g => (
                    <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50">
                      <FolderKanban className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{g.name}</p>
                        {g.description && <p className="text-xs text-muted-foreground line-clamp-1">{g.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
