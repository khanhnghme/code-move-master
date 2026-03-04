import { Users, UserCheck, Lock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface MemberNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    all: number;
    active: number;
    pending: number;
    suspended: number;
  };
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  countKey: keyof MemberNavigationProps['counts'];
  showBadge?: boolean;
}

const tabs: NavTab[] = [
  { id: 'all', label: 'Tất cả', icon: Users, description: 'Tất cả thành viên trong hệ thống', countKey: 'all' },
  { id: 'active', label: 'Hoạt động', icon: Activity, description: 'Thành viên đang hoạt động', countKey: 'active' },
  { id: 'pending', label: 'Chờ duyệt', icon: UserCheck, description: 'Tài khoản chờ phê duyệt', countKey: 'pending', showBadge: true },
  { id: 'suspended', label: 'Bị khóa', icon: Lock, description: 'Tài khoản đang bị khóa', countKey: 'suspended' },
];

export default function MemberNavigation({ activeTab, onTabChange, counts }: MemberNavigationProps) {
  return (
    <div className="w-full border-b border-border/40 sticky top-16 z-40 bg-gradient-to-b from-muted/80 to-background backdrop-blur-sm shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <nav className="flex items-center py-2.5">
          <div className="w-[160px] shrink-0 hidden md:block" />
          
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide">
            <div className="inline-flex items-center bg-background/80 border border-border/50 rounded-full px-2 py-1.5 shadow-sm">
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-1">
                  {tabs.map((tab) => (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onTabChange(tab.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            "whitespace-nowrap",
                            activeTab === tab.id
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                          )}
                        >
                          <tab.icon className={cn(
                            "w-4 h-4 shrink-0",
                            activeTab === tab.id && "text-primary-foreground"
                          )} />
                          <span className="hidden xs:inline sm:inline">{tab.label}</span>
                          
                          {/* Count badge */}
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full",
                            activeTab === tab.id
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : tab.showBadge && counts[tab.countKey] > 0
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted-foreground/20 text-muted-foreground"
                          )}>
                            {counts[tab.countKey]}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={10}>
                        <p className="font-medium text-sm">{tab.label}</p>
                        <p className="text-xs text-muted-foreground">{tab.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="w-[160px] shrink-0 hidden md:block" />
        </nav>
      </div>
    </div>
  );
}
