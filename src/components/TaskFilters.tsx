import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search,
  Filter,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ListTodo,
  CalendarClock,
  User,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Stage, GroupMember } from '@/types/database';

export interface TaskFilters {
  searchText: string;
  status: string;
  assignee: string;
  hasDeadline: string;
  isOverdue: string;
  hasSubmission: string;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  members: GroupMember[];
  tasks: Task[];
  onReset: () => void;
}

// Quick filter definitions
interface QuickFilter {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  filter: Partial<TaskFilters>;
  color: string;
  activeColor: string;
  count?: number;
}

export const defaultTaskFilters: TaskFilters = {
  searchText: '',
  status: 'all',
  assignee: 'all',
  hasDeadline: 'all',
  isOverdue: 'all',
  hasSubmission: 'all',
};

export default function TaskFilters({
  filters,
  onFiltersChange,
  members,
  tasks,
  onReset,
}: TaskFiltersProps) {
  // Calculate counts for quick filters
  const counts = useMemo(() => {
    const now = new Date();
    return {
      overdue: tasks.filter(t => {
        if (!t.deadline || t.status === 'DONE' || t.status === 'VERIFIED') return false;
        return new Date(t.deadline) < now;
      }).length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      noSubmission: tasks.filter(t => !t.submission_link && t.status !== 'VERIFIED').length,
      deadlineToday: tasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline.toDateString() === now.toDateString();
      }).length,
      done: tasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length,
    };
  }, [tasks]);

  // Quick filters - compact
  const quickFilters: QuickFilter[] = [
    {
      id: 'overdue',
      label: 'Trễ hạn',
      shortLabel: 'Trễ',
      icon: <AlertTriangle className="w-3 h-3" />,
      filter: { isOverdue: 'yes', status: 'all' },
      color: 'text-destructive hover:bg-destructive/10',
      activeColor: 'bg-destructive/15 text-destructive border-destructive/40',
      count: counts.overdue,
    },
    {
      id: 'inProgress',
      label: 'Đang làm',
      shortLabel: 'Làm',
      icon: <Loader2 className="w-3 h-3" />,
      filter: { status: 'IN_PROGRESS' },
      color: 'text-warning hover:bg-warning/10',
      activeColor: 'bg-warning/15 text-warning border-warning/40',
      count: counts.inProgress,
    },
    {
      id: 'todo',
      label: 'Chờ xử lý',
      shortLabel: 'Chờ',
      icon: <ListTodo className="w-3 h-3" />,
      filter: { status: 'TODO' },
      color: 'text-muted-foreground hover:bg-muted',
      activeColor: 'bg-muted text-foreground border-border',
      count: counts.todo,
    },
    {
      id: 'noSubmission',
      label: 'Chưa nộp',
      shortLabel: 'C.nộp',
      icon: <Clock className="w-3 h-3" />,
      filter: { hasSubmission: 'no' },
      color: 'text-orange-600 hover:bg-orange-500/10',
      activeColor: 'bg-orange-500/15 text-orange-600 border-orange-500/40',
      count: counts.noSubmission,
    },
    {
      id: 'deadlineToday',
      label: 'Hôm nay',
      shortLabel: 'Nay',
      icon: <CalendarClock className="w-3 h-3" />,
      filter: { hasDeadline: 'today' },
      color: 'text-blue-600 hover:bg-blue-500/10',
      activeColor: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
      count: counts.deadlineToday,
    },
    {
      id: 'done',
      label: 'Hoàn thành',
      shortLabel: 'Xong',
      icon: <CheckCircle2 className="w-3 h-3" />,
      filter: { status: 'DONE_OR_VERIFIED' },
      color: 'text-success hover:bg-success/10',
      activeColor: 'bg-success/15 text-success border-success/40',
      count: counts.done,
    },
  ];

  // Check if a quick filter is active
  const isQuickFilterActive = (qf: QuickFilter) => {
    return Object.entries(qf.filter).every(([key, value]) => {
      return filters[key as keyof TaskFilters] === value;
    });
  };

  // Apply quick filter
  const applyQuickFilter = (qf: QuickFilter) => {
    if (isQuickFilterActive(qf)) {
      onFiltersChange({ ...defaultTaskFilters, searchText: filters.searchText });
    } else {
      onFiltersChange({ ...defaultTaskFilters, searchText: filters.searchText, ...qf.filter });
    }
  };

  // Count active filters (excluding search)
  const activeAdvancedFilters = [
    filters.status !== 'all' ? filters.status : '',
    filters.assignee !== 'all' ? filters.assignee : '',
    filters.hasDeadline !== 'all' ? filters.hasDeadline : '',
    filters.isOverdue !== 'all' ? filters.isOverdue : '',
    filters.hasSubmission !== 'all' ? filters.hasSubmission : '',
  ].filter(Boolean).length;

  const hasAnyFilter = filters.searchText || activeAdvancedFilters > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Search - compact */}
      <div className="relative w-40 sm:w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm task..."
          value={filters.searchText}
          onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
          className="h-8 pl-8 pr-2 text-sm"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

      {/* Quick filters - inline chips */}
      {quickFilters.map((qf) => {
        const isActive = isQuickFilterActive(qf);
        const hasItems = qf.count !== undefined && qf.count > 0;
        
        return (
          <Button
            key={qf.id}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1 text-xs font-medium border border-transparent transition-all",
              isActive ? qf.activeColor : qf.color,
              !hasItems && !isActive && "opacity-50"
            )}
            onClick={() => applyQuickFilter(qf)}
            disabled={!hasItems && !isActive}
          >
            {qf.icon}
            <span className="hidden sm:inline">{qf.label}</span>
            <span className="sm:hidden">{qf.shortLabel}</span>
            {hasItems && (
              <span className={cn(
                "text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full",
                isActive ? "bg-background/60" : "bg-current/10"
              )}>
                {qf.count}
              </span>
            )}
          </Button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

      {/* Advanced filters popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              activeAdvancedFilters > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nâng cao</span>
            {activeAdvancedFilters > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {activeAdvancedFilters}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3 bg-popover">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Lọc nâng cao</div>
            
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Trạng thái</label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="TODO">Chờ xử lý</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                  <SelectItem value="DONE">Hoàn thành</SelectItem>
                  <SelectItem value="VERIFIED">Đã duyệt</SelectItem>
                  <SelectItem value="DONE_OR_VERIFIED">Xong / Duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Người phụ trách</label>
              <Select
                value={filters.assignee}
                onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <User className="w-3 h-3 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="unassigned">Chưa phân công</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profiles?.full_name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline + Overdue row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Deadline</label>
                <Select
                  value={filters.hasDeadline}
                  onValueChange={(value) => onFiltersChange({ ...filters, hasDeadline: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="today">Hôm nay</SelectItem>
                    <SelectItem value="thisWeek">Tuần này</SelectItem>
                    <SelectItem value="yes">Có deadline</SelectItem>
                    <SelectItem value="no">Không có</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Trạng thái trễ</label>
                <Select
                  value={filters.isOverdue}
                  onValueChange={(value) => onFiltersChange({ ...filters, isOverdue: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="yes">Đang trễ</SelectItem>
                    <SelectItem value="no">Không trễ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submission */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nộp bài</label>
              <Select
                value={filters.hasSubmission}
                onValueChange={(value) => onFiltersChange({ ...filters, hasSubmission: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="yes">Đã nộp</SelectItem>
                  <SelectItem value="no">Chưa nộp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Reset button */}
      {hasAnyFilter && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset} 
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
