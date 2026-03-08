import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import DashboardProjectCard from '@/components/dashboard/DashboardProjectCard';
import { supabase } from '@/integrations/supabase/client';
import { useUserPresence } from '@/hooks/useUserPresence';
import UserPresenceIndicator from '@/components/UserPresenceIndicator';
import FirstTimeOnboarding from '@/components/FirstTimeOnboarding';
import { getSystemRoleLabel } from '@/lib/roleLabels';
import JoinByCodeDialog from '@/components/JoinByCodeDialog';
import {
  FolderKanban,
  ArrowRight,
  Plus,
  Loader2,
  Sparkles,
  Shield,
  Star,
  User,
  KeyRound,
} from 'lucide-react';
import type { Group } from '@/types/database';

export default function Dashboard() {
  const { user, profile, mustChangePassword, refreshProfile, isLeader, isAdmin } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const { isConnected } = useUserPresence('system-global');
  // Fetch video background settings from system_settings
  useEffect(() => {
    const fetchVideoSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'dashboard_video_bg')
        .maybeSingle();
      if (data?.value) {
        const val = data.value as { enabled?: boolean; dashboard_opacity?: number; opacity?: number; url?: string };
        setVideoEnabled(val.enabled ?? false);
        setVideoOpacity(val.dashboard_opacity ?? val.opacity ?? 0.2);
        setVideoUrl(val.url ?? '');
      }
    };
    fetchVideoSettings();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (memberError) throw memberError;

      const groupIds = memberData?.map((m) => m.group_id) || [];

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
        <Shield className="w-3 h-3" />
        Quản trị viên
      </Badge>
    );
    if (isLeader) return (
      <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
        <Star className="w-3 h-3" />
        Thành viên Nâng cao
      </Badge>
    );
    return (
      <Badge variant="secondary" className="gap-1">
        <User className="w-3 h-3" />
        Thành viên
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Video Background */}
      {videoEnabled && videoUrl && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="fixed inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: videoOpacity, zIndex: 0 }}
            src={videoUrl}
          />
          {/* Multi-layer overlay: gradient + blur + vignette */}
          <div
            className="fixed inset-0 pointer-events-none video-blur-overlay"
            style={{ zIndex: 1 }}
          />
          <div
            className="fixed inset-0 pointer-events-none video-gradient-overlay"
            style={{ zIndex: 2 }}
          />
          <div
            className="fixed inset-0 pointer-events-none vignette-overlay"
            style={{ zIndex: 2 }}
          />
          <VideoParticles />
        </>
      )}

      {/* First-time onboarding: Password change + Avatar upload */}
      {user && profile && mustChangePassword && (
        <FirstTimeOnboarding
          open={mustChangePassword}
          userId={user.id}
          userFullName={profile.full_name}
          userEmail={profile.email}
          userStudentId={profile.student_id}
          onComplete={refreshProfile}
        />
      )}

      <div className="relative space-y-8" style={{ zIndex: 2 }}>
        {/* Welcome Section - More Prominent */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center gap-6">
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size="xl"
                className="border-4 border-white/20 shadow-xl"
                showPresence={isConnected}
                presenceStatus="online"
              />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-accent" />
                <span className="text-white/80">Xin chào,</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{profile?.full_name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-white/70">MSSV: {profile?.student_id}</span>
                {getRoleBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview - Minimal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{groups.length}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20 cursor-pointer hover:border-accent/40 transition-colors"
            onClick={() => setShowJoinDialog(true)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent">Nhập mã</p>
                  <p className="text-sm text-muted-foreground">Tham gia Project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <JoinByCodeDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          onJoined={fetchDashboardData}
        />

        {/* My Projects - Simplified without members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl">Projects của tôi</CardTitle>
              <CardDescription>Các dự án bạn đang tham gia</CardDescription>
            </div>
            <Link to="/groups">
              <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <FolderKanban className="w-4 h-4" />
                <span className="hidden md:inline">Xem & Tạo Project</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-1">Bạn chưa tham gia project nào</p>
                <p className="text-sm">Liên hệ Leader để được thêm vào project</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {groups.map((group) => (
                  <DashboardProjectCard
                    key={group.id}
                    group={group}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
