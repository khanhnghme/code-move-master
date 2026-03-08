import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDeadlineVN, formatDeadlineShortVN } from '@/lib/datetime';
import { deleteWithUndo } from '@/lib/deleteWithUndo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Video, Plus, Calendar, Clock, Users, ChevronRight, Sparkles, 
  Trash2, MoreVertical, CheckSquare, X, MonitorPlay, CalendarCheck,
  CircleDot, UserCheck
} from 'lucide-react';
import CreateMeetingDialog from '@/components/CreateMeetingDialog';
import MeetingRoom from '@/components/MeetingRoom';
import type { Stage, GroupMember } from '@/types/database';

interface GroupMeetingsProps {
  groupId: string;
  groupName: string;
  stages: Stage[];
  members: GroupMember[];
  isLeader: boolean;
  onRefreshTasks?: () => void;
}

export default function GroupMeetings({ groupId, groupName, stages, members, isLeader, onRefreshTasks }: GroupMeetingsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [filter, setFilter] = useState('all');
  
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchMeetings(); }, [groupId]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    const { data } = await (supabase.from('meetings') as any)
      .select('*')
      .eq('group_id', groupId)
      .order('scheduled_at', { ascending: false });

    if (data) {
      setMeetings(data);
      const meetingIds = data.map((m: any) => m.id);
      if (meetingIds.length > 0) {
        const { data: attData } = await (supabase.from('meeting_attendance') as any)
          .select('*')
          .in('meeting_id', meetingIds);
        if (attData) {
          const grouped: Record<string, any[]> = {};
          attData.forEach((a: any) => {
            if (!grouped[a.meeting_id]) grouped[a.meeting_id] = [];
            grouped[a.meeting_id].push(a);
          });
          setAttendance(grouped);
        }
      }
      const meetingId = searchParams.get('meeting');
      if (meetingId && data) {
        const target = data.find((m: any) => m.id === meetingId);
        if (target) {
          setSelectedMeeting(target);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('meeting');
          setSearchParams(newParams, { replace: true });
        }
      }
    }
    setIsLoading(false);
  };

  const handleDeleteMeeting = useCallback((meeting: any) => {
    deleteWithUndo({
      description: `Đã xóa cuộc họp "${meeting.title}"`,
      onDelete: async () => {
        await (supabase.from('meeting_messages') as any).delete().eq('meeting_id', meeting.id);
        await (supabase.from('meeting_attendance') as any).delete().eq('meeting_id', meeting.id);
        if (meeting.task_id) {
          await supabase.from('task_assignments').delete().eq('task_id', meeting.task_id);
          await supabase.from('task_scores').delete().eq('task_id', meeting.task_id);
          await supabase.from('submission_history').delete().eq('task_id', meeting.task_id);
          await supabase.from('tasks').delete().eq('id', meeting.task_id);
        }
        await (supabase.from('meetings') as any).delete().eq('id', meeting.id);
        if (user) {
          await supabase.from('activity_logs').insert({
            user_id: user.id, user_name: user.email || 'Unknown',
            action: 'DELETE_MEETING', action_type: 'meeting',
            description: `Xóa cuộc họp "${meeting.title}"${meeting.task_id ? ' (kèm task)' : ''}`,
            group_id: groupId, metadata: { meeting_id: meeting.id, meeting_title: meeting.title }
          });
        }
        fetchMeetings(); onRefreshTasks?.();
      },
      onUndo: () => { fetchMeetings(); onRefreshTasks?.(); },
    });
  }, [user, groupId]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const idsToDelete = new Set(selectedIds);
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
    deleteWithUndo({
      description: `Đã xóa ${count} cuộc họp`,
      onDelete: async () => {
        for (const id of idsToDelete) {
          const meeting = meetings.find(m => m.id === id);
          if (!meeting) continue;
          await (supabase.from('meeting_messages') as any).delete().eq('meeting_id', id);
          await (supabase.from('meeting_attendance') as any).delete().eq('meeting_id', id);
          if (meeting.task_id) {
            await supabase.from('task_assignments').delete().eq('task_id', meeting.task_id);
            await supabase.from('task_scores').delete().eq('task_id', meeting.task_id);
            await supabase.from('submission_history').delete().eq('task_id', meeting.task_id);
            await supabase.from('tasks').delete().eq('id', meeting.task_id);
          }
          await (supabase.from('meetings') as any).delete().eq('id', id);
        }
        if (user) {
          await supabase.from('activity_logs').insert({
            user_id: user.id, user_name: user.email || 'Unknown',
            action: 'BULK_DELETE_MEETINGS', action_type: 'meeting',
            description: `Xóa ${count} cuộc họp`, group_id: groupId, metadata: { count }
          });
        }
        fetchMeetings(); onRefreshTasks?.();
      },
      onUndo: () => { fetchMeetings(); onRefreshTasks?.(); },
    });
  }, [selectedIds, meetings, user, groupId]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filteredMeetings.map(m => m.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setIsMultiSelectMode(false); };

  if (selectedMeeting) {
    return (
      <div className="h-[calc(100vh-180px)]">
        <MeetingRoom
          meeting={selectedMeeting} members={members} isLeader={isLeader}
          groupId={groupId} onBack={() => { setSelectedMeeting(null); fetchMeetings(); }}
          onRefresh={fetchMeetings}
        />
      </div>
    );
  }

  const filteredMeetings = meetings.filter(m => filter === 'all' ? true : m.status === filter);
  const liveCount = meetings.filter(m => m.status === 'in_progress').length;
  const scheduledCount = meetings.filter(m => m.status === 'scheduled').length;
  const completedCount = meetings.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Hero header with UEH styling */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/10">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Họp Nhóm</h2>
              <p className="text-sm text-primary-foreground/70 mt-0.5">Video call, điểm danh tự động & ghi chú cuộc họp</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLeader && filteredMeetings.length > 0 && (
              <Button
                variant="ghost" size="sm"
                onClick={() => isMultiSelectMode ? clearSelection() : setIsMultiSelectMode(true)}
                className="gap-1.5 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20"
              >
                {isMultiSelectMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                {isMultiSelectMode ? 'Hủy' : 'Chọn nhiều'}
              </Button>
            )}
            {isLeader && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25">
                <Plus className="w-4 h-4" /> Tạo cuộc họp
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-4 mt-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
            <MonitorPlay className="w-3.5 h-3.5 text-primary-foreground/70" />
            <span className="text-xs font-medium">{meetings.length} cuộc họp</span>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/20 backdrop-blur-sm border border-destructive/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
              <span className="text-xs font-bold">{liveCount} đang diễn ra</span>
            </div>
          )}
          {scheduledCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
              <CalendarCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
              <span className="text-xs font-medium">{scheduledCount} sắp tới</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {isMultiSelectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
          <span className="text-sm font-medium">Đã chọn {selectedIds.size} cuộc họp</span>
          <Button variant="outline" size="sm" onClick={selectAll} className="h-7 text-xs">
            Chọn tất cả ({filteredMeetings.length})
          </Button>
          <div className="flex-1" />
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5 h-7 text-xs">
            <Trash2 className="w-3 h-3" /> Xóa {selectedIds.size} cuộc họp
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Tất cả <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">{meetings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarCheck className="w-3 h-3" /> Sắp tới
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
            <CircleDot className="w-3 h-3" /> Đang diễn ra
            {liveCount > 0 && (
              <span className="ml-1 relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Đã kết thúc
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meeting list */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Đang tải cuộc họp...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Video className="w-8 h-8 text-primary/40" />
            </div>
            <p className="font-semibold text-foreground">Chưa có cuộc họp nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== 'all' ? 'Không có cuộc họp nào trong mục này' : isLeader ? 'Nhấn "Tạo cuộc họp" để bắt đầu lên lịch' : 'Chưa có cuộc họp nào được tạo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredMeetings.map(meeting => {
            const att = attendance[meeting.id] || [];
            const presentCount = att.filter(a => a.status === 'present').length;
            const isLive = meeting.status === 'in_progress';
            const isCompleted = meeting.status === 'completed';
            const isSelected = selectedIds.has(meeting.id);
            const scheduledDate = new Date(meeting.scheduled_at);

            return (
              <Card
                key={meeting.id}
                onClick={() => {
                  if (isMultiSelectMode) { toggleSelect(meeting.id); return; }
                  setSelectedMeeting(meeting);
                }}
                className={`
                  group relative cursor-pointer transition-all duration-200 overflow-hidden
                  ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}
                  ${isLive && !isSelected 
                    ? 'border-primary/50 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/15' 
                    : isCompleted && !isSelected 
                      ? 'border-border/40 bg-muted/20 hover:bg-muted/40' 
                      : !isSelected 
                        ? 'hover:border-primary/30 hover:shadow-md' 
                        : ''
                  }
                `}
              >
                {/* Live indicator stripe */}
                {isLive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-destructive via-accent to-destructive animate-pulse" />
                )}

                <CardContent className="p-0">
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    {/* Multi-select checkbox */}
                    {isMultiSelectMode && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(meeting.id)} />
                      </div>
                    )}

                    {/* Meeting icon */}
                    <div className={`
                      shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors
                      ${isLive 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20' 
                        : isCompleted 
                          ? 'bg-muted text-muted-foreground' 
                          : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                      }
                    `}>
                      <Video className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-semibold text-sm truncate ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {meeting.title}
                        </h3>
                        {isLive && (
                          <Badge className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0 gap-1 animate-pulse shrink-0">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive-foreground" />
                            </span>
                            LIVE
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Đã xong</Badge>
                        )}
                        {!isLive && !isCompleted && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 shrink-0">Sắp tới</Badge>
                        )}
                      </div>
                      {meeting.description && (
                        <p className="text-xs text-muted-foreground truncate">{meeting.description}</p>
                      )}
                      {/* Mobile meta */}
                      <div className="flex items-center gap-3 mt-1.5 sm:hidden">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDeadlineShortVN(meeting.scheduled_at)}
                        </span>
                      </div>
                    </div>

                    {/* Desktop meta columns */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 min-w-[135px]">
                      <Calendar className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                      <span className="truncate">{formatDeadlineShortVN(meeting.scheduled_at)}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 min-w-[65px]">
                      <Clock className="w-3.5 h-3.5 text-accent/60 shrink-0" />
                      <span>{meeting.duration_minutes}p</span>
                    </div>

                    {/* Attendance pill */}
                    <div className={`
                      flex items-center gap-1.5 text-xs shrink-0 px-2.5 py-1 rounded-full
                      ${presentCount > 0 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">{presentCount}/{members.length}</span>
                    </div>

                    {/* Actions */}
                    {!isMultiSelectMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        {isLive ? (
                          <Button size="sm" className="gap-1.5 h-8 text-xs px-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" /> Vào họp
                          </Button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        )}
                        {isLeader && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50 bg-popover min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleDeleteMeeting(meeting)} className="text-destructive text-xs">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa cuộc họp
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateMeetingDialog
        open={isCreateOpen} onOpenChange={setIsCreateOpen}
        groupId={groupId} groupName={groupName} stages={stages} members={members}
        onCreated={() => { fetchMeetings(); onRefreshTasks?.(); }}
      />
    </div>
  );
}
