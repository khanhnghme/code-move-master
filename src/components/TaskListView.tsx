import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deleteWithUndo } from '@/lib/deleteWithUndo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  MoreVertical,
  Calendar,
  CalendarPlus,
  Trash2,
  Edit,
  Loader2,
  Layers,
  ChevronDown,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  History,
  Clock,
  Target,
  GripVertical,
  Users,
  Eye,
  EyeOff,
  Award,
  CheckSquare,
  X,
  Video,
  Sparkles,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import type { Task, Stage, GroupMember } from '@/types/database';
import { formatDeadlineVN, isDeadlineOverdue, parseLocalDateTime } from '@/lib/datetime';
import TaskSubmissionDialog from './TaskSubmissionDialog';
import SubmissionHistoryPopup from './SubmissionHistoryPopup';
import SubmissionButton from './SubmissionButton';
import TaskScoringDialog from './scores/TaskScoringDialog';
import TaskFilters, { TaskFilters as TaskFiltersType, defaultTaskFilters } from './TaskFilters';
import type { TaskScore } from '@/types/processScores';

// Stage color helper - returns a consistent color for each stage index
const getStageColor = (index: number) => {
  const colors = [
    { bg: 'bg-stage-1/10', text: 'text-stage-1', border: 'border-stage-1/30', dot: 'bg-stage-1', accent: 'bg-stage-1/20' },
    { bg: 'bg-stage-2/10', text: 'text-stage-2', border: 'border-stage-2/30', dot: 'bg-stage-2', accent: 'bg-stage-2/20' },
    { bg: 'bg-stage-3/10', text: 'text-stage-3', border: 'border-stage-3/30', dot: 'bg-stage-3', accent: 'bg-stage-3/20' },
    { bg: 'bg-stage-4/10', text: 'text-stage-4', border: 'border-stage-4/30', dot: 'bg-stage-4', accent: 'bg-stage-4/20' },
    { bg: 'bg-stage-5/10', text: 'text-stage-5', border: 'border-stage-5/30', dot: 'bg-stage-5', accent: 'bg-stage-5/20' },
    { bg: 'bg-stage-6/10', text: 'text-stage-6', border: 'border-stage-6/30', dot: 'bg-stage-6', accent: 'bg-stage-6/20' },
  ];
  return colors[index % colors.length];
};

// Helper functions
const getStatusColor = (status: string, isOverdue: boolean) => {
  if (isOverdue && status !== 'DONE' && status !== 'VERIFIED') {
    return 'bg-destructive/10 text-destructive border-destructive/30';
  }
  switch (status) {
    case 'TODO':
      return 'bg-muted text-muted-foreground border-muted';
    case 'IN_PROGRESS':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'DONE':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'VERIFIED':
      return 'bg-success/10 text-success border-success/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string, isOverdue: boolean) => {
  if (isOverdue && status !== 'DONE' && status !== 'VERIFIED') {
    return 'Trễ';
  }
  switch (status) {
    case 'TODO':
      return 'Chờ';
    case 'IN_PROGRESS':
      return 'Đang làm';
    case 'DONE':
      return 'Xong';
    case 'VERIFIED':
      return 'Duyệt';
    default:
      return status;
  }
};

const getProgressPercent = (status: string) => {
  switch (status) {
    case 'TODO':
      return 0;
    case 'IN_PROGRESS':
      return 50;
    case 'DONE':
    case 'VERIFIED':
      return 100;
    default:
      return 0;
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateStr: string) => {
  return formatDeadlineVN(dateStr);
};

// Get main assignee name (first assignee)
const getMainAssignee = (task: Task) => {
  if (!task.task_assignments || task.task_assignments.length === 0) return null;
  return task.task_assignments[0].profiles?.full_name || null;
};

// Calculate task code: [stage_order].[task_index_in_displayed_list]
// taskIndexInStage is the 0-based index of the task in the currently displayed order
const getTaskCode = (task: Task, stages: Stage[], stageIndex: number, taskIndexInStage: number) => {
  if (!task.stage_id) return null;
  return `${stageIndex + 1}.${taskIndexInStage + 1}`;
};

const isOverdue = (deadline: string | null) => isDeadlineOverdue(deadline);

// Extended Task type with is_hidden field
type ExtendedTask = Task & { is_hidden?: boolean };
type ExtendedStage = Stage & { is_hidden?: boolean };

// Horizontal TaskRow component with CSS Grid layout
interface TaskRowProps {
  task: ExtendedTask;
  taskCode: string | null;
  stageColor: ReturnType<typeof getStageColor>;
  isLeaderInGroup: boolean;
  isAssignee: boolean;
  groupId: string;
  onEditTask: (task: Task) => void;
  openSubmissionDialog: (task: Task) => void;
  openDetailDialog: (task: Task) => void;
  setTaskToDelete: (task: Task) => void;
  onScoreTask?: (task: Task) => void;
  onToggleHidden?: (task: Task) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  meeting?: any;
  onJoinMeeting?: (meetingId: string) => void;
}

function TaskRow({
  task,
  taskCode,
  stageColor,
  isLeaderInGroup,
  isAssignee,
  groupId,
  onEditTask,
  openSubmissionDialog,
  openDetailDialog,
  setTaskToDelete,
  onScoreTask,
  onToggleHidden,
  dragHandleProps,
  isDragging,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  meeting,
  onJoinMeeting,
}: TaskRowProps) {
  // Handle extended deadline
  const taskWithExtended = task as Task & { extended_deadline?: string };
  const hasExtension = !!taskWithExtended.extended_deadline;
  const effectiveDeadline = hasExtension ? taskWithExtended.extended_deadline : task.deadline;
  
  const overdueStatus = isOverdue(effectiveDeadline);
  const taskIsOverdue = overdueStatus && task.status !== 'DONE' && task.status !== 'VERIFIED';
  const canSubmit = isAssignee || isLeaderInGroup;
  const assignments = task.task_assignments || [];
  const hasMultipleAssignees = assignments.length > 1;
  const isMeetingTask = !!meeting;
  const meetingIsLive = meeting?.status === 'in_progress';
  const meetingIsScheduled = meeting?.status === 'scheduled';
  const meetingIsCompleted = meeting?.status === 'completed';

  // Calculate extension text for display
  const getExtensionText = () => {
    if (!task.deadline || !hasExtension) return '';
    const original = parseLocalDateTime(task.deadline);
    const extended = parseLocalDateTime(taskWithExtended.extended_deadline!);
    if (!original || !extended) return '';
    const diffMs = extended.getTime() - original.getTime();
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    if (hours <= 0) return '';
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    let text = '+';
    if (days > 0) text += `${days}d`;
    if (days > 0 && remainingHours > 0) text += ' ';
    if (remainingHours > 0) text += `${remainingHours}h`;
    return text;
  };

  // Handle row click for drill-down
  // Leader or Assignee → open submission/edit popup
  // Non-assignee (not leader) → open view-only popup
  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rowEl = e.currentTarget as HTMLElement;

    // Don't trigger if clicking on interactive elements inside the row
    if (target.closest('button, a, input, textarea, select, [data-no-drill]')) {
      return;
    }

    const roleButtonEl = target.closest('[role="button"]') as HTMLElement | null;
    if (roleButtonEl && roleButtonEl !== rowEl) {
      return;
    }

    // In multi-select mode, toggle selection instead of opening dialog
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(task.id);
      return;
    }

    if (isLeaderInGroup || isAssignee) {
      openSubmissionDialog(task);
    } else {
      openDetailDialog(task);
    }
  };

  return (
    <div 
      className={`group bg-card rounded-lg border transition-all cursor-pointer
        hover:shadow-md hover:border-primary/40 hover:bg-accent/30
        ${taskIsOverdue ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10' : 'border-border'}
        ${isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''}
        ${task.is_hidden ? 'opacity-50 border-dashed bg-muted/20' : ''}
        ${isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isMultiSelectMode && onToggleSelect) {
            onToggleSelect(task.id);
          } else if (isLeaderInGroup || isAssignee) {
            openSubmissionDialog(task);
          } else {
            openDetailDialog(task);
          }
        }
      }}
    >
      <div className={`grid ${isMultiSelectMode ? 'grid-cols-[28px_32px_1fr] md:grid-cols-[28px_32px_minmax(240px,1fr)_150px_96px_320px]' : 'grid-cols-[32px_1fr] md:grid-cols-[32px_minmax(240px,1fr)_150px_96px_320px]'} gap-2 p-3 items-start md:items-center`}>
        {/* Multi-select checkbox */}
        {isMultiSelectMode && (
          <div className="flex items-center justify-center pt-0.5 md:pt-0" data-no-drill>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(task.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4.5 w-4.5"
            />
          </div>
        )}
        {/* Column 1: Drag handle + Status bar */}
        <div className="flex flex-col items-center gap-1 pt-0.5 md:pt-0">
          {isLeaderInGroup && dragHandleProps && !isMultiSelectMode && (
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded touch-none"
              aria-label="Kéo để đổi thứ tự"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div
            className={`w-1 ${isLeaderInGroup && dragHandleProps ? 'h-6' : 'h-8'} rounded-full ${
              taskIsOverdue ? 'bg-destructive' : 
              task.status === 'VERIFIED' ? 'bg-success' :
              task.status === 'DONE' ? 'bg-primary' :
              task.status === 'IN_PROGRESS' ? 'bg-warning' : 'bg-muted-foreground/30'
            }`}
          />
        </div>
        
        {/* Column 2: Task code + Title + Assignees (flexible) */}
        <div className="flex items-start gap-2 min-w-0 overflow-hidden">
          {taskCode && (
            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0.5 font-mono font-semibold bg-primary/5 border-primary/20 text-primary">
              {taskCode}
            </Badge>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              {taskIsOverdue && (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              )}
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {task.title}
              </h4>
              {/* Drill-down indicator - shows on hover */}
              <Eye className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Assignees */}
            {assignments.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                {hasMultipleAssignees ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5">
                            {assignments.slice(0, 3).map((assignment) => (
                              <UserAvatar 
                                key={assignment.id}
                                src={assignment.profiles?.avatar_url}
                                name={assignment.profiles?.full_name}
                                size="xs"
                                className="border border-background"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {assignments.length} thành viên
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          {assignments.map((a, idx) => (
                            <div key={a.id} className="flex items-center gap-2 text-xs">
                              <span className="font-medium">{idx + 1}.</span>
                              <span>{a.profiles?.full_name || 'Unknown'}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {assignments[0]?.profiles?.full_name || 'Unknown'}
                  </span>
                )}
              </div>
            )}

            {/* Mobile-only: deadline + extension + status + actions in one row (prevents overlap) */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 md:hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Extension Badge for mobile */}
                {hasExtension && (
                  <Badge className="gap-0.5 px-1 py-0 text-[9px] bg-blue-500/15 text-blue-600 border-blue-500/30 shrink-0">
                    <CalendarPlus className="w-2.5 h-2.5" />
                    {getExtensionText()}
                  </Badge>
                )}
                
                {effectiveDeadline ? (
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md whitespace-nowrap ${
                    taskIsOverdue 
                      ? 'bg-destructive/10 text-destructive' 
                      : hasExtension ? 'bg-blue-500/10 text-blue-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="max-w-[140px] truncate">{formatDate(effectiveDeadline)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}

                <Badge 
                  className={`${getStatusColor(task.status, taskIsOverdue)} text-[10px] px-1.5 py-0.5 border whitespace-nowrap`}
                >
                  {getStatusLabel(task.status, taskIsOverdue)}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <SubmissionHistoryPopup 
                  taskId={task.id}
                  groupId={groupId}
                  taskDeadline={task.deadline}
                  currentSubmissionLink={task.submission_link}
                />

                <SubmissionButton 
                  submissionLink={task.submission_link} 
                  variant="compact"
                  onStopPropagation={true}
                  taskId={task.id}
                  groupId={groupId}
                />

                {(isAssignee || isLeaderInGroup) && (
                  <Button
                    variant={task.submission_link ? "outline" : "default"}
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSubmissionDialog(task);
                    }}
                  >
                    {task.submission_link ? (
                      <>
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">Sửa</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span className="hidden sm:inline">Nộp</span>
                      </>
                    )}
                  </Button>
                )}

                {isLeaderInGroup && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50 bg-popover min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="text-xs">
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      {onScoreTask && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScoreTask(task); }} className="text-xs">
                          <Award className="w-3.5 h-3.5 mr-2" />
                          Chấm điểm
                        </DropdownMenuItem>
                      )}
                      {onToggleHidden && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleHidden(task); }} className="text-xs">
                          {task.is_hidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              Hiện task
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 mr-2" />
                              Ẩn task
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }} className="text-destructive text-xs">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop-only columns - Deadline with extension badge */}
        <div className="hidden md:flex items-center justify-end gap-1.5">
          {/* Extension Badge */}
          {hasExtension && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="gap-0.5 px-1 py-0 text-[9px] bg-blue-500/15 text-blue-600 border-blue-500/30 cursor-default shrink-0">
                  <CalendarPlus className="w-2.5 h-2.5" />
                  {getExtensionText()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                <div>Đã gia hạn thêm {getExtensionText()}</div>
              </TooltipContent>
            </Tooltip>
          )}
          
          {effectiveDeadline ? (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md whitespace-nowrap ${
              taskIsOverdue 
                ? 'bg-destructive/10 text-destructive' 
                : hasExtension ? 'bg-blue-500/10 text-blue-700' : 'bg-muted text-muted-foreground'
            }`}>
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate">{formatDate(effectiveDeadline)}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>
        
        <div className="hidden md:flex justify-center min-w-0">
          <Badge 
            className={`${getStatusColor(task.status, taskIsOverdue)} text-[10px] px-1.5 py-0.5 border whitespace-nowrap max-w-full`}
          >
            {getStatusLabel(task.status, taskIsOverdue)}
          </Badge>
        </div>
        
        {/* Desktop actions: keep History + View File pinned in fixed sub-columns */}
        <div className="hidden md:grid grid-cols-[64px_104px_92px_40px] items-center justify-end gap-1 flex-nowrap min-w-0">
          <div className="flex justify-end">
            <SubmissionHistoryPopup 
              taskId={task.id}
              groupId={groupId}
              taskDeadline={task.deadline}
              currentSubmissionLink={task.submission_link}
            />
          </div>

          <div className="flex justify-end">
            <SubmissionButton 
              submissionLink={task.submission_link} 
              variant="compact"
              onStopPropagation={true}
              taskId={task.id}
              groupId={groupId}
            />
          </div>

          <div className="flex justify-end">
            {canSubmit ? (
              <Button
                variant={task.submission_link ? "outline" : "default"}
                size="sm"
                className="h-7 w-[92px] text-xs px-2 gap-1 shrink-0 justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  openSubmissionDialog(task);
                }}
              >
                {task.submission_link ? (
                  <>
                    <Edit className="w-3 h-3" />
                    <span className="hidden lg:inline">Sửa</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span className="hidden lg:inline">Nộp</span>
                  </>
                )}
              </Button>
            ) : (
              <span className="h-7 w-[92px]" aria-hidden />
            )}
          </div>

          <div className="flex justify-end">
            {isLeaderInGroup ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 bg-popover min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="text-xs">
                    <Edit className="w-3.5 h-3.5 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  {onScoreTask && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScoreTask(task); }} className="text-xs">
                      <Award className="w-3.5 h-3.5 mr-2" />
                      Chấm điểm
                    </DropdownMenuItem>
                  )}
                  {onToggleHidden && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleHidden(task); }} className="text-xs">
                      {task.is_hidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Hiện task
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-2" />
                          Ẩn task
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }} className="text-destructive text-xs">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="h-7 w-7" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
interface TaskListViewProps {
  stages: ExtendedStage[];
  tasks: ExtendedTask[];
  members: GroupMember[];
  isLeaderInGroup: boolean;
  groupId: string;
  groupSlug?: string;
  onRefresh: () => void;
  onEditTask: (task: Task) => void;
  onCreateTask: (stageId: string) => void;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stage: Stage) => void;
  onToggleStageHidden?: (stage: Stage) => void;
}

export default function TaskListView({
  stages,
  tasks,
  members,
  isLeaderInGroup,
  groupId,
  groupSlug,
  onRefresh,
  onEditTask,
  onCreateTask,
  onEditStage,
  onDeleteStage,
  onToggleStageHidden,
}: TaskListViewProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(stages.map(s => s.id)));
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [taskFilters, setTaskFilters] = useState<TaskFiltersType>(defaultTaskFilters);
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'status' | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>('TODO');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Submission dialog state
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  
  // Detail view dialog state (view-only for non-assignees)
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Scoring dialog state
  const [scoringTask, setScoringTask] = useState<Task | null>(null);
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [taskScores, setTaskScores] = useState<TaskScore[]>([]);
  
  // Local task order for drag & drop (maps stage_id -> ordered task ids)
  const [localTaskOrder, setLocalTaskOrder] = useState<Record<string, string[]>>({});

  // Sync dialog task with latest data when tasks prop updates
  useEffect(() => {
    if (submissionTask) {
      const updated = tasks.find(t => t.id === submissionTask.id);
      if (updated) setSubmissionTask(updated);
    }
    if (detailTask) {
      const updated = tasks.find(t => t.id === detailTask.id);
      if (updated) setDetailTask(updated);
    }
  }, [tasks]);

  // Toggle task hidden status
  const handleToggleTaskHidden = async (task: ExtendedTask) => {
    try {
      const newHiddenStatus = !task.is_hidden;
      const { error } = await supabase
        .from('tasks')
        .update({ is_hidden: newHiddenStatus })
        .eq('id', task.id);
      
      if (error) throw error;
      
      toast({
        title: newHiddenStatus ? 'Đã ẩn task' : 'Đã hiện task',
        description: `Task "${task.title}" ${newHiddenStatus ? 'đã được ẩn' : 'đã được hiện'}`,
      });
      
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thay đổi trạng thái task',
        variant: 'destructive',
      });
    }
  };

  // Fetch task scores for the scoring dialog
  const fetchTaskScores = useCallback(async () => {
    if (!groupId || tasks.length === 0) return;
    
    const taskIds = tasks.map(t => t.id);
    const { data } = await supabase
      .from('task_scores')
      .select('*')
      .in('task_id', taskIds);
    
    setTaskScores((data || []) as unknown as TaskScore[]);
  }, [groupId, tasks]);

  useEffect(() => {
    if (isLeaderInGroup) {
      fetchTaskScores();
    }
  }, [isLeaderInGroup, fetchTaskScores]);

  const openScoringDialog = (task: Task) => {
    setScoringTask(task);
    setIsScoringOpen(true);
  };

  const getTasksByStage = useCallback((stageId: string | null) => {
    const stageTasks = tasks.filter((task) => task.stage_id === stageId);
    
    // If we have a local order for this stage, use it
    const stageKey = stageId || 'unstaged';
    if (localTaskOrder[stageKey]) {
      const orderedIds = localTaskOrder[stageKey];
      return stageTasks.sort((a, b) => {
        const indexA = orderedIds.indexOf(a.id);
        const indexB = orderedIds.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    // Default sort by created_at
    return stageTasks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [tasks, localTaskOrder]);

  const isUserAssignee = (task: Task) => {
    return task.task_assignments?.some(a => a.user_id === user?.id) || false;
  };

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };
  
  // Handle drag & drop reordering
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const stageId = source.droppableId === 'unstaged' ? null : source.droppableId;
    const stageKey = source.droppableId;
    const stageTasks = getTasksByStage(stageId);
    
    // Reorder the tasks
    const newOrder = [...stageTasks.map(t => t.id)];
    newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, draggableId);
    
    // Update local state immediately for smooth UX
    setLocalTaskOrder(prev => ({
      ...prev,
      [stageKey]: newOrder
    }));
    
    // Log activity
    try {
      const movedTask = tasks.find(t => t.id === draggableId);
      if (movedTask && user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          user_name: user.email || 'Unknown',
          action: 'REORDER_TASK',
          action_type: 'task',
          description: `Sắp xếp lại task "${movedTask.title}"`,
          group_id: groupId,
          metadata: { task_id: draggableId, new_position: destination.index + 1 }
        });
      }
    } catch (error) {
      console.error('Error logging reorder:', error);
    }
  }, [getTasksByStage, tasks, user, groupId]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskRef = taskToDelete;
    setTaskToDelete(null);

    deleteWithUndo({
      description: `Đã xóa task "${taskRef.title}"`,
      onDelete: async () => {
        await supabase.from('task_assignments').delete().eq('task_id', taskRef.id);
        await supabase.from('task_scores').delete().eq('task_id', taskRef.id);
        await supabase.from('submission_history').delete().eq('task_id', taskRef.id);
        const { error } = await supabase.from('tasks').delete().eq('id', taskRef.id);
        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: user!.id,
          user_name: user?.email || 'Unknown',
          action: 'DELETE_TASK',
          action_type: 'task',
          description: `Xóa task "${taskRef.title}"`,
          group_id: groupId,
          metadata: { task_id: taskRef.id, task_title: taskRef.title }
        });

        onRefresh();
      },
      onUndo: () => {
        onRefresh();
      },
    });
  };

  // Multi-select helpers
  const toggleTaskSelect = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAllVisibleTasks = () => {
    setSelectedTaskIds(new Set(visibleTasks.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setIsMultiSelectMode(false);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    const idsToDelete = new Set(selectedTaskIds);
    const count = idsToDelete.size;
    clearSelection();
    setBulkAction(null);

    deleteWithUndo({
      description: `Đã xóa ${count} task`,
      onDelete: async () => {
        for (const taskId of idsToDelete) {
          await supabase.from('task_assignments').delete().eq('task_id', taskId);
          await supabase.from('task_scores').delete().eq('task_id', taskId);
          await supabase.from('submission_history').delete().eq('task_id', taskId);
          await supabase.from('tasks').delete().eq('id', taskId);
        }
        if (user && profile) {
          const deletedTasks = tasks.filter(t => idsToDelete.has(t.id));
          await logActivity({
            userId: user.id, userName: profile.full_name,
            action: 'BATCH_DELETE_TASKS', actionType: 'task',
            description: `Xóa hàng loạt ${count} task: ${deletedTasks.map(t => t.title).join(', ')}`,
            groupId,
          });
        }
        onRefresh();
      },
      onUndo: () => {
        onRefresh();
      },
    });
  };

  // Bulk status change
  const handleBulkStatusChange = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: bulkStatus as any })
        .in('id', Array.from(selectedTaskIds));
      if (error) throw error;
      const statusLabels: Record<string, string> = { TODO: 'Chờ thực hiện', IN_PROGRESS: 'Đang thực hiện', DONE: 'Hoàn thành', VERIFIED: 'Đã duyệt' };
      toast({ title: 'Thành công', description: `Đã cập nhật trạng thái ${selectedTaskIds.size} task` });
      if (user && profile) {
        await logActivity({
          userId: user.id, userName: profile.full_name,
          action: 'BATCH_STATUS_CHANGE', actionType: 'task',
          description: `Đổi trạng thái hàng loạt ${selectedTaskIds.size} task thành "${statusLabels[bulkStatus] || bulkStatus}"`,
          groupId,
        });
      }
      clearSelection();
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsBulkProcessing(false);
      setBulkAction(null);
    }
  };

  const openSubmissionDialog = (task: Task) => {
    setSubmissionTask(task);
    setIsSubmissionOpen(true);
  };

  // Open detail dialog (view-only mode for non-assignees)
  const openDetailDialog = (task: Task) => {
    setDetailTask(task);
    setIsDetailOpen(true);
  };

  // Check if user is assignee for detail dialog
  const isDetailAssignee = detailTask ? isUserAssignee(detailTask) : false;

  // Filter stages and tasks based on visibility settings
  const visibleStages = showHidden || isLeaderInGroup 
    ? stages 
    : stages.filter(s => !s.is_hidden);
    
  const filteredStages = filterStage === 'all' 
    ? visibleStages 
    : visibleStages.filter(s => s.id === filterStage);

  // Filter tasks based on visibility (non-leaders don't see hidden tasks)
  const baseVisibleTasks = showHidden || isLeaderInGroup 
    ? tasks 
    : tasks.filter(t => !t.is_hidden);

  // Apply task filters
  const visibleTasks = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    return baseVisibleTasks.filter(task => {
      // Search text filter
      if (taskFilters.searchText) {
        const searchLower = taskFilters.searchText.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        const assigneeMatch = task.task_assignments?.some(a => 
          a.profiles?.full_name?.toLowerCase().includes(searchLower)
        );
        if (!titleMatch && !descMatch && !assigneeMatch) return false;
      }

      // Status filter
      if (taskFilters.status !== 'all') {
        if (taskFilters.status === 'DONE_OR_VERIFIED') {
          if (task.status !== 'DONE' && task.status !== 'VERIFIED') return false;
        } else if (task.status !== taskFilters.status) {
          return false;
        }
      }

      // Assignee filter
      if (taskFilters.assignee !== 'all') {
        if (taskFilters.assignee === 'unassigned') {
          if (task.task_assignments && task.task_assignments.length > 0) return false;
        } else {
          const hasAssignee = task.task_assignments?.some(a => a.user_id === taskFilters.assignee);
          if (!hasAssignee) return false;
        }
      }

      // Deadline filter
      if (taskFilters.hasDeadline !== 'all') {
        if (taskFilters.hasDeadline === 'yes' && !task.deadline) return false;
        if (taskFilters.hasDeadline === 'no' && task.deadline) return false;
        if (taskFilters.hasDeadline === 'today' && task.deadline) {
          const deadline = new Date(task.deadline);
          if (deadline < startOfToday || deadline >= endOfToday) return false;
        }
        if (taskFilters.hasDeadline === 'thisWeek' && task.deadline) {
          const deadline = new Date(task.deadline);
          if (deadline < startOfToday || deadline >= endOfWeek) return false;
        }
      }

      // Overdue filter
      if (taskFilters.isOverdue !== 'all') {
        const isTaskOverdue = task.deadline && new Date(task.deadline) < now && 
          task.status !== 'DONE' && task.status !== 'VERIFIED';
        if (taskFilters.isOverdue === 'yes' && !isTaskOverdue) return false;
        if (taskFilters.isOverdue === 'no' && isTaskOverdue) return false;
      }

      // Submission filter
      if (taskFilters.hasSubmission !== 'all') {
        if (taskFilters.hasSubmission === 'yes' && !task.submission_link) return false;
        if (taskFilters.hasSubmission === 'no' && task.submission_link) return false;
      }

      return true;
    });
  }, [baseVisibleTasks, taskFilters]);

  const unstagedTasks = getTasksByStage(null).filter(t => 
    showHidden || isLeaderInGroup ? true : !t.is_hidden
  ).filter(t => visibleTasks.some(vt => vt.id === t.id));

  // Count hidden items
  const hiddenTasksCount = tasks.filter(t => t.is_hidden).length;
  const hiddenStagesCount = stages.filter(s => s.is_hidden).length;

  // Calculate stats (based on visible tasks only for non-leaders)
  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length;
  const overdueTasks = visibleTasks.filter(t => isOverdue(t.deadline) && t.status !== 'DONE' && t.status !== 'VERIFIED').length;
  const inProgressTasks = visibleTasks.filter(t => t.status === 'IN_PROGRESS').length;

  // Check if any filters are active
  const hasActiveFilters = taskFilters.searchText || 
    taskFilters.status !== 'all' || 
    taskFilters.assignee !== 'all' || 
    taskFilters.hasDeadline !== 'all' || 
    taskFilters.isOverdue !== 'all' || 
    taskFilters.hasSubmission !== 'all';

  return (
    <>
      {/* Header with stats - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Task & Giai đoạn</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{totalTasks} task{hasActiveFilters ? ' (đã lọc)' : ''}</span>
              <span className="text-success">• {completedTasks} xong</span>
              {inProgressTasks > 0 && <span className="text-warning">• {inProgressTasks} đang làm</span>}
              {overdueTasks > 0 && <span className="text-destructive">• {overdueTasks} trễ</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Multi-select toggle for leaders */}
          {isLeaderInGroup && (
            <Button
              variant={isMultiSelectMode ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => {
                if (isMultiSelectMode) {
                  clearSelection();
                } else {
                  setIsMultiSelectMode(true);
                }
              }}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isMultiSelectMode ? 'Hủy chọn' : 'Chọn nhiều'}</span>
            </Button>
          )}

          {isLeaderInGroup && (hiddenTasksCount > 0 || hiddenStagesCount > 0) && (
            <Button
              variant={showHidden ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHidden ? 'Đang hiện ẩn' : `${hiddenTasksCount + hiddenStagesCount} ẩn`}
            </Button>
          )}
          
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-44 h-8 text-xs bg-background">
              <SelectValue placeholder="Lọc giai đoạn" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all" className="text-xs">Tất cả giai đoạn</SelectItem>
              {visibleStages.map((stage, index) => {
                const color = getStageColor(index);
                return (
                  <SelectItem key={stage.id} value={stage.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                      {stage.name}
                      {stage.is_hidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Multi-select bulk action bar */}
      {isMultiSelectMode && (
        <div className="mb-3 flex flex-wrap items-center gap-2 p-2.5 rounded-lg border bg-muted/50">
          <Checkbox
            checked={selectedTaskIds.size === visibleTasks.length && visibleTasks.length > 0}
            onCheckedChange={(checked) => {
              if (checked) selectAllVisibleTasks();
              else setSelectedTaskIds(new Set());
            }}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {selectedTaskIds.size > 0 ? `Đã chọn ${selectedTaskIds.size} task` : 'Chọn tất cả'}
          </span>
          
          {selectedTaskIds.size > 0 && (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="TODO">Chờ xử lý</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                  <SelectItem value="DONE">Hoàn thành</SelectItem>
                  <SelectItem value="VERIFIED">Đã duyệt</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setBulkAction('status')} disabled={isBulkProcessing}>
                <CheckCircle2 className="w-3 h-3" />
                Đổi trạng thái
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => setBulkAction('delete')} disabled={isBulkProcessing}>
                <Trash2 className="w-3 h-3" />
                Xóa
              </Button>
            </>
          )}
          
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto" onClick={clearSelection}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Task Filters */}
      <div className="mb-4">
        <TaskFilters
          filters={taskFilters}
          onFiltersChange={setTaskFilters}
          members={members}
          tasks={baseVisibleTasks}
          onReset={() => setTaskFilters(defaultTaskFilters)}
        />
      </div>

      {/* Stage Sections with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {filteredStages.map((stage, stageIndex) => {
            // Filter stage tasks to only include visible (filtered) tasks
            const allStageTasks = getTasksByStage(stage.id).filter(t => 
              showHidden || isLeaderInGroup ? true : !t.is_hidden
            );
            const stageTasks = allStageTasks.filter(t => visibleTasks.some(vt => vt.id === t.id));
            const completedCount = stageTasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length;
            const overdueCount = stageTasks.filter(t => isOverdue(t.deadline) && t.status !== 'DONE' && t.status !== 'VERIFIED').length;
            const isExpanded = expandedStages.has(stage.id);
            const stageColor = getStageColor(stageIndex);
            const progressPercent = stageTasks.length > 0 ? (completedCount / stageTasks.length) * 100 : 0;
            const hiddenTasksInStage = getTasksByStage(stage.id).filter(t => t.is_hidden).length;
            
            // Skip stages with no visible tasks when filters are active
            if (hasActiveFilters && stageTasks.length === 0) return null;

            return (
              <Card 
                key={stage.id} 
                className={`overflow-hidden border-l-4 ${stageColor.border} shadow-sm ${stage.is_hidden ? 'opacity-60 border-dashed' : ''}`}
              >
                {/* Stage Header */}
                <CardHeader 
                  className={`py-2.5 px-4 cursor-pointer transition-colors ${stageColor.bg} hover:opacity-90`}
                  onClick={() => toggleStage(stage.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 p-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <div className={`w-2.5 h-2.5 rounded-full ${stageColor.dot} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`text-sm font-bold ${stageColor.text} truncate`}>
                          {stage.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-medium">
                          {completedCount}/{stageTasks.length}
                        </Badge>
                        {overdueCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                            {overdueCount} trễ
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Progress bar */}
                      <div className="hidden sm:flex items-center gap-1.5 w-24">
                        <Progress value={progressPercent} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-7 text-right">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      
                      {isLeaderInGroup && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover min-w-[140px]">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditStage(stage); }} className="text-xs">
                              <Edit className="w-3.5 h-3.5 mr-2" />
                              Đổi tên
                            </DropdownMenuItem>
                            {onToggleStageHidden && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStageHidden(stage); }} className="text-xs">
                                {stage.is_hidden ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 mr-2" />
                                    Hiện giai đoạn
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 mr-2" />
                                    Ẩn giai đoạn
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteStage(stage); }} className="text-destructive text-xs">
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {/* Tasks List with Drag & Drop */}
                {isExpanded && (
                  <CardContent className="p-3">
                    {stageTasks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg bg-muted/10">
                        <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                        Chưa có task
                      </div>
                    ) : (
                      <Droppable droppableId={stage.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2"
                          >
                            {stageTasks.map((task, index) => (
                              <Draggable 
                                key={task.id} 
                                draggableId={task.id} 
                                index={index}
                                isDragDisabled={!isLeaderInGroup}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                  >
                                    <TaskRow
                                      task={task}
                                      taskCode={getTaskCode(task, stages, stageIndex, index)}
                                      stageColor={stageColor}
                                      isLeaderInGroup={isLeaderInGroup}
                                      isAssignee={isUserAssignee(task)}
                                      groupId={groupId}
                                      onEditTask={onEditTask}
                                      openSubmissionDialog={openSubmissionDialog}
                                      openDetailDialog={openDetailDialog}
                                      setTaskToDelete={setTaskToDelete}
                                      onScoreTask={isLeaderInGroup ? openScoringDialog : undefined}
                                      onToggleHidden={isLeaderInGroup ? handleToggleTaskHidden : undefined}
                                      dragHandleProps={provided.dragHandleProps}
                                      isDragging={snapshot.isDragging}
                                      isMultiSelectMode={isMultiSelectMode}
                                      isSelected={selectedTaskIds.has(task.id)}
                                      onToggleSelect={toggleTaskSelect}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                    {isLeaderInGroup && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-muted-foreground hover:text-foreground border-dashed border mt-2.5 h-8 text-xs"
                        onClick={() => onCreateTask(stage.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Thêm task
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Unstaged Tasks with Drag & Drop */}
          {filterStage === 'all' && unstagedTasks.length > 0 && (
            <Card className="overflow-hidden border-dashed border-l-4 border-l-muted-foreground/30">
              <CardHeader className="py-2.5 px-4 bg-muted/20">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                  Chưa phân giai đoạn
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                    {unstagedTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Droppable droppableId="unstaged">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {unstagedTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                          isDragDisabled={!isLeaderInGroup}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <TaskRow
                                task={task}
                                taskCode={null}
                                stageColor={{ bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted', dot: 'bg-muted-foreground/50', accent: 'bg-muted/50' }}
                                isLeaderInGroup={isLeaderInGroup}
                                isAssignee={isUserAssignee(task)}
                                groupId={groupId}
                                onEditTask={onEditTask}
                                openSubmissionDialog={openSubmissionDialog}
                                openDetailDialog={openDetailDialog}
                                setTaskToDelete={setTaskToDelete}
                                onScoreTask={isLeaderInGroup ? openScoringDialog : undefined}
                                dragHandleProps={provided.dragHandleProps}
                                isDragging={snapshot.isDragging}
                                isMultiSelectMode={isMultiSelectMode}
                                isSelected={selectedTaskIds.has(task.id)}
                                onToggleSelect={toggleTaskSelect}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {stages.length === 0 && unstagedTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/10">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">Chưa có giai đoạn nào</p>
              <p className="text-sm">Tạo giai đoạn đầu tiên để bắt đầu</p>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa task</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Bạn có chắc muốn xóa task <span className="font-semibold">"{taskToDelete?.title}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkAction === 'delete'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <span className="font-semibold">{selectedTaskIds.size} task</span> đã chọn? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Xóa ${selectedTaskIds.size} task`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change Confirmation */}
      <AlertDialog open={bulkAction === 'status'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Đổi trạng thái hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn đổi trạng thái <span className="font-semibold">{selectedTaskIds.size} task</span> thành <span className="font-semibold">{getStatusLabel(bulkStatus, false)}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusChange} disabled={isBulkProcessing}>
              {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Dialog */}
      <TaskSubmissionDialog
        task={submissionTask}
        isOpen={isSubmissionOpen}
        onClose={() => {
          setIsSubmissionOpen(false);
          setSubmissionTask(null);
        }}
        onSave={onRefresh}
        isAssignee={submissionTask ? isUserAssignee(submissionTask) : false}
        isLeaderInGroup={isLeaderInGroup}
      />

      {/* Detail Dialog (view-only for non-assignees) */}
      <TaskSubmissionDialog
        task={detailTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTask(null);
        }}
        onSave={onRefresh}
        isAssignee={isDetailAssignee}
        isLeaderInGroup={isLeaderInGroup}
        viewOnly={!isDetailAssignee && !isLeaderInGroup}
      />

      {/* Scoring Dialog for Leader */}
      {isLeaderInGroup && (
        <TaskScoringDialog
          isOpen={isScoringOpen}
          onClose={() => {
            setIsScoringOpen(false);
            setScoringTask(null);
          }}
          task={scoringTask}
          members={members}
          taskScores={taskScores}
          onScoreUpdated={() => {
            fetchTaskScores();
            onRefresh();
          }}
        />
      )}
    </>
  );
}
