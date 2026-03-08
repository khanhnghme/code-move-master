import { LayoutDashboard, Layers, Users, Activity, Settings, Award, FolderOpen, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLeaderInGroup: boolean;
  isGroupCreator: boolean;
  membersCount: number;
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showAlways?: boolean;
  description: string;
}

const tabs: NavTab[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, showAlways: true, description: 'Xem tổng quan dự án' },
  { id: 'tasks', label: 'Task', icon: Layers, showAlways: true, description: 'Quản lý công việc' },
  { id: 'meetings', label: 'Họp nhóm', icon: Video, showAlways: true, description: 'Họp video & điểm danh' },
  { id: 'resources', label: 'Tài nguyên', icon: FolderOpen, showAlways: true, description: 'File & tài liệu' },
  { id: 'members', label: 'Thành viên', icon: Users, showAlways: true, description: 'Danh sách thành viên' },
  { id: 'scores', label: 'Điểm', icon: Award, showAlways: true, description: 'Điểm số & đánh giá' },
  { id: 'logs', label: 'Nhật ký', icon: Activity, showAlways: false, description: 'Lịch sử hoạt động' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, showAlways: false, description: 'Cấu hình dự án' },
];

export default function ProjectNavigation({
  activeTab,
  onTabChange,
  isLeaderInGroup,
  isGroupCreator,
  membersCount,
}: ProjectNavigationProps) {
  const showSettings = isLeaderInGroup && isGroupCreator;
  const showLogs = isLeaderInGroup && isGroupCreator;
  const visibleTabs = tabs.filter(tab => 
    tab.showAlways || (tab.id === 'settings' && showSettings) || (tab.id === 'logs' && showLogs)
  );

  return (
    <div className="w-full border-b border-border/40 sticky top-16 z-40 bg-gradient-to-b from-muted/80 to-background backdrop-blur-sm shadow-sm">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8">
        <nav className="flex items-center py-2">
          {/* Left spacer - matches header logo width */}
          <div className="w-[160px] shrink-0 hidden lg:block" />
          
          {/* Center: tabs - scrollable on mobile */}
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-2 px-2">
            <div className="inline-flex items-center bg-background/80 border border-border/50 rounded-full px-1.5 py-1 shadow-sm min-w-max">
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-0.5">
                  {visibleTabs.filter(t => t.id !== 'settings').map((tab) => (
                    <NavTabButton
                      key={tab.id}
                      tab={tab}
                      isActive={activeTab === tab.id}
                      onClick={() => onTabChange(tab.id)}
                      membersCount={tab.id === 'members' ? membersCount : undefined}
                    />
                  ))}
                </div>
                
                {showSettings && (
                  <>
                    <div className="w-px h-6 bg-border/50 mx-1.5" />
                    <NavTabButton
                      tab={tabs.find(t => t.id === 'settings')!}
                      isActive={activeTab === 'settings'}
                      onClick={() => onTabChange('settings')}
                      isSettings
                    />
                  </>
                )}
              </TooltipProvider>
            </div>
          </div>
          
          {/* Right spacer */}
          <div className="w-[160px] shrink-0 hidden lg:block" />
        </nav>
      </div>
    </div>
  );
}

interface NavTabButtonProps {
  tab: NavTab;
  isActive: boolean;
  onClick: () => void;
  membersCount?: number;
  isSettings?: boolean;
}

function NavTabButton({ tab, isActive, onClick, membersCount, isSettings }: NavTabButtonProps) {
  const Icon = tab.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "whitespace-nowrap",
            isActive 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            isSettings && !isActive && "text-muted-foreground/70"
          )}
        >
          <Icon className={cn(
            "w-4 h-4 shrink-0",
            isActive && "text-primary-foreground",
            isSettings && isActive && "text-amber-200"
          )} />
          
          {/* Label - hide on very small screens, show icon only */}
          <span className="hidden xs:inline sm:inline">{tab.label}</span>
          
          {/* Member count badge */}
          {membersCount !== undefined && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-semibold rounded-full",
              isActive 
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              {membersCount}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={10}>
        <p className="font-medium text-sm">{tab.label}</p>
        <p className="text-xs text-muted-foreground">{tab.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}