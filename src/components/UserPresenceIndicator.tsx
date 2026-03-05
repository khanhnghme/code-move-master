import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PresenceStatus } from '@/hooks/useUserPresence';

interface UserPresenceIndicatorProps {
  status: PresenceStatus;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<PresenceStatus, { color: string; label: string }> = {
  online: { 
    color: 'bg-emerald-500', 
    label: 'Online',
  },
  offline: { 
    color: 'bg-muted-foreground/40', 
    label: 'Offline',
  },
};

const sizeConfig = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
};

export default function UserPresenceIndicator({ 
  status, 
  size = 'sm', 
  showLabel = false,
  className 
}: UserPresenceIndicatorProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  const indicator = (
    <span 
      className={cn(
        'rounded-full ring-2 ring-background flex-shrink-0',
        config.color,
        sizeClass,
        status === 'online' && 'animate-pulse',
        className
      )}
    />
  );

  if (showLabel) {
    return (
      <div className="flex items-center gap-1.5">
        {indicator}
        <span className="text-[10px] text-muted-foreground">{config.label}</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
