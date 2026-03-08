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
import {
  FolderKanban,
  ArrowRight,
  Plus,
  Loader2,
  Sparkles,
  Shield,
  Star,
  User,
} from 'lucide-react';
import type { Group } from '@/types/database';

export default function Dashboard() {
  const { user, profile, mustChangePassword, refreshProfile, isLeader, isAdmin } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useUserPresence('system-global');

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

      <div className="space-y-8">
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
        </div>

        {/* My Projects - Simplified without members */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Projects của tôi</CardTitle>
                <CardDescription>Các dự án bạn đang tham gia</CardDescription>
              </div>
              <Link to="/groups">
                <Button variant="outline" className="gap-2">
                  Xem tất cả Project
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Create project CTA */}
            <Link to="/groups" className="block mt-4">
              <div className={`relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition-all duration-300 ${
                (isLeader || isAdmin)
                  ? 'border-primary/40 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01] cursor-pointer group'
                  : 'border-muted-foreground/20 bg-muted/30 cursor-default'
              }`}>
                {(isLeader || isAdmin) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
                <div className="relative flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    (isLeader || isAdmin)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-base ${
                      (isLeader || isAdmin) ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {(isLeader || isAdmin) ? 'Tạo dự án mới' : 'Tạo dự án mới — Bạn không có quyền tạo'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(isLeader || isAdmin)
                        ? 'Đi đến trang Project để tạo và quản lý dự án của bạn'
                        : 'Liên hệ Admin để được nâng cấp quyền Thành viên Nâng cao'}
                    </p>
                  </div>
                  {(isLeader || isAdmin) && (
                    <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
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

