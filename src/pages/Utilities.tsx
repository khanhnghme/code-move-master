import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, User, Github, Linkedin, Facebook, Globe, Save, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
  [key: string]: string | undefined;
}

export default function Utilities() {
  const { profile, user } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, bio, skills, social_links')
        .eq('id', user.id)
        .single();
      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setSkills(data.skills || '');
        setSocialLinks((data.social_links as SocialLinks) || {});
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validate username
    if (username && !/^[a-z0-9\-]{3,30}$/.test(username)) {
      toast({ title: 'Username không hợp lệ', description: 'Chỉ chấp nhận chữ thường, số, dấu gạch ngang (3-30 ký tự)', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username || null,
        bio,
        skills,
        social_links: socialLinks,
      })
      .eq('id', user.id);

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast({ title: 'Username đã tồn tại', description: 'Vui lòng chọn username khác', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Đã lưu thành công!' });
    }
    setSaving(false);
  };

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Tiện ích</h1>
          <p className="text-muted-foreground">Các công cụ và tiện ích dành cho quản trị viên</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Trang cá nhân công khai
                </CardTitle>
                <CardDescription>Thiết lập trang cá nhân với URL riêng để chia sẻ thông tin của bạn</CardDescription>
              </div>
              {username && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/u/${username}`} target="_blank">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Xem trang
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username (URL cá nhân)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/u/</span>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''))}
                  placeholder="khanhngh"
                  maxLength={30}
                />
              </div>
              {username && (
                <p className="text-xs text-muted-foreground">
                  Trang của bạn: <span className="font-mono text-foreground">{window.location.origin}/u/{username}</span>
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Giới thiệu bản thân</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Viết vài dòng giới thiệu về bạn..."
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label htmlFor="skills">Kỹ năng</Label>
              <Input
                id="skills"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="React, TypeScript, UI/UX Design..."
              />
              <p className="text-xs text-muted-foreground">Phân tách bằng dấu phẩy</p>
              {skills && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {skills.split(',').map((s, i) => s.trim() && (
                    <Badge key={i} variant="secondary" className="text-xs">{s.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <Label>Liên kết mạng xã hội</Label>
              <div className="grid gap-3">
                {[
                  { key: 'github', icon: Github, label: 'GitHub', placeholder: 'https://github.com/username' },
                  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                  { key: 'facebook', icon: Facebook, label: 'Facebook', placeholder: 'https://facebook.com/username' },
                  { key: 'website', icon: Globe, label: 'Website', placeholder: 'https://yourwebsite.com' },
                ].map(({ key, icon: Icon, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                      value={socialLinks[key] || ''}
                      onChange={e => updateSocialLink(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
