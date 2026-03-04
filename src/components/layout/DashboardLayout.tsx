import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  ChevronDown,
  Key,
  Menu,
  X,
  Users,
  Lightbulb,
  FolderArchive,
  MessageSquare,
  UserCircle,
} from 'lucide-react';
import uehLogo from '@/assets/ueh-logo-new.png';
import UserChangePasswordDialog from '@/components/UserChangePasswordDialog';
import NotificationBell from '@/components/NotificationBell';
import AvatarUpload from '@/components/AvatarUpload';
import AIAssistantButton from '@/components/ai/AIAssistantButton';

interface DashboardLayoutProps {
  children: ReactNode;
  projectId?: string;
  projectName?: string;
  zaloLink?: string | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
  description: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Tổng quan các dự án' },
  { name: 'Dự án', href: '/groups', icon: FolderKanban, description: 'Quản lý dự án nhóm' },
  { name: 'Trao đổi', href: '/communication', icon: MessageSquare, description: 'Tin nhắn & thảo luận' },
  { name: 'Cá nhân', href: '/personal-info', icon: UserCircle, description: 'Thông tin tài khoản' },
  { name: 'Góp ý', href: '/feedback', icon: Lightbulb, description: 'Gửi ý kiến phản hồi' },
  { name: 'Thành viên', href: '/members', icon: Users, requiresAdmin: true, description: 'Quản lý người dùng' },
  { name: 'Sao lưu', href: '/admin/backup', icon: FolderArchive, requiresAdmin: true, description: 'Backup dữ liệu' },
];

export default function DashboardLayout({ children, projectId, projectName, zaloLink }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, isLeader, signOut } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-destructive/20 text-destructive text-xs font-medium">Admin</Badge>;
    if (isLeader) return <Badge className="bg-warning/20 text-warning text-xs font-medium">Leader</Badge>;
    return <Badge variant="secondary" className="text-xs font-medium">Member</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary shadow-lg">
        <div className="h-full max-w-[1600px] mx-auto px-6 flex items-center">
          {/* Left: Logo & Brand - fixed width */}
          <div className="w-[160px] shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <img src={uehLogo} alt="UEH Logo" className="h-9 w-auto drop-shadow-md group-hover:scale-105 transition-transform" />
              <span className="font-bold text-base text-primary-foreground hidden sm:block">Teamworks</span>
            </Link>
          </div>

          {/* Center: Navigation Menu - flex-1 to fill space and center content */}
          <nav className="flex-1 hidden md:flex items-center justify-center">
            <div className="inline-flex items-center bg-white/10 rounded-full px-1.5 py-1">
              <TooltipProvider delayDuration={300}>
                {navigation
                  .filter(item => !item.requiresAdmin || isAdmin)
                  .map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href === '/groups' && (location.pathname.startsWith('/groups/') || location.pathname.startsWith('/p/')));
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              isActive 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-white/80 hover:bg-white/15 hover:text-white'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="hidden lg:block">{item.name}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={8}>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
              </TooltipProvider>
            </div>
          </nav>

          {/* Right: User area - fixed width to balance with left */}
          <div className="w-[160px] shrink-0 flex items-center justify-end gap-3">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-white/10 text-white"
                >
                  <UserAvatar 
                    src={profile?.avatar_url} 
                    name={profile?.full_name}
                    size="md"
                    className="border-2 border-white/30"
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                      {profile?.full_name || 'Đang tải...'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge()}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/70 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground">MSSV: {profile?.student_id}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Cập nhật ảnh đại diện
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-primary border-t border-white/10 shadow-lg z-50">
            <nav className="p-5 space-y-2">
              {navigation
                .filter(item => !item.requiresAdmin || isAdmin)
                .map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
                })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content - with top padding for fixed header */}
      <main className="flex-1 pt-16">
        <div className="max-w-[1600px] mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Change Password Dialog */}
      <UserChangePasswordDialog 
        open={isChangePasswordOpen} 
        onOpenChange={setIsChangePasswordOpen} 
      />

      {/* Avatar Upload Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
            <DialogDescription>
              Nhấn vào ảnh để tải lên ảnh mới (tối đa 5MB)
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <AvatarUpload 
              currentAvatarUrl={profile?.avatar_url}
              fullName={profile?.full_name || ''}
              size="lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant - Available on all pages */}
      <AIAssistantButton projectId={projectId} projectName={projectName} zaloLink={zaloLink} />
    </div>
  );
}
