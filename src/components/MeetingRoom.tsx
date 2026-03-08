import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Video, VideoOff, Users, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, StickyNote, Save, Loader2 } from 'lucide-react';
import type { GroupMember } from '@/types/database';

interface MeetingRoomProps {
  meeting: any;
  members: GroupMember[];
  isLeader: boolean;
  groupId: string;
  onBack: () => void;
  onRefresh: () => void;
}

export default function MeetingRoom({ meeting, members, isLeader, groupId, onBack, onRefresh }: MeetingRoomProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [notes, setNotes] = useState(meeting.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, [meeting.id]);

  // Auto-save notes with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => saveNotes(value), 1500);
  };

  const saveNotes = async (content: string) => {
    setIsSavingNotes(true);
    try {
      await (supabase.from('meetings') as any)
        .update({ notes: content, updated_at: new Date().toISOString() })
        .eq('id', meeting.id);
    } catch (e) {
      // silent
    } finally {
      setIsSavingNotes(false);
    }
  };

  const fetchAttendance = async () => {
    const { data } = await (supabase.from('meeting_attendance') as any)
      .select('*')
      .eq('meeting_id', meeting.id);
    if (data) setAttendance(data);
  };

  const handleUpdateAttendance = async (userId: string, status: string) => {
    await (supabase.from('meeting_attendance') as any)
      .update({
        status,
        marked_by: user!.id,
        joined_at: status === 'present' ? new Date().toISOString() : null
      })
      .eq('meeting_id', meeting.id)
      .eq('user_id', userId);
    fetchAttendance();
  };

  const handleStartMeeting = async () => {
    await (supabase.from('meetings') as any)
      .update({ status: 'in_progress' })
      .eq('id', meeting.id);
    await logActivity({
      userId: user!.id,
      userName: profile?.full_name || user?.email || 'Unknown',
      action: 'START_MEETING', actionType: 'task',
      description: `Bắt đầu cuộc họp "${meeting.title}"`,
      groupId,
    });
    onRefresh();
  };

  const handleEndMeeting = async () => {
    setIsEnding(true);
    try {
      await (supabase.from('meetings') as any)
        .update({ status: 'completed', notes, updated_at: new Date().toISOString() })
        .eq('id', meeting.id);
      if (meeting.task_id) {
        await supabase.from('tasks').update({ status: 'DONE' }).eq('id', meeting.task_id);
      }
      await logActivity({
        userId: user!.id,
        userName: profile?.full_name || user?.email || 'Unknown',
        action: 'END_MEETING', actionType: 'task',
        description: `Kết thúc cuộc họp "${meeting.title}" - ${presentCount}/${members.length} có mặt`,
        groupId,
      });
      toast({ title: 'Đã kết thúc cuộc họp', description: 'Task đã được cập nhật trạng thái DONE' });
      onRefresh();
      onBack();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsEnding(false);
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'late': return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      default: return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0">Có mặt</Badge>;
      case 'late': return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px] px-1.5 py-0">Trễ</Badge>;
      default: return <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] px-1.5 py-0">Vắng</Badge>;
    }
  };

  const jitsiUrl = `https://meet.jit.si/${meeting.jitsi_room_name}#userInfo.displayName="${encodeURIComponent(profile?.full_name || 'User')}"`;

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold leading-tight">{meeting.title}</h2>
            <p className="text-xs text-muted-foreground">
              {new Date(meeting.scheduled_at).toLocaleString('vi-VN')} • {meeting.duration_minutes} phút
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status === 'scheduled' && isLeader && (
            <Button size="sm" onClick={handleStartMeeting} className="gap-1.5 h-8">
              <Video className="w-3.5 h-3.5" /> Bắt đầu
            </Button>
          )}
          {meeting.status === 'in_progress' && isLeader && (
            <Button variant="destructive" size="sm" onClick={handleEndMeeting} disabled={isEnding} className="gap-1.5 h-8">
              <VideoOff className="w-3.5 h-3.5" /> Kết thúc
            </Button>
          )}
          <Badge variant={meeting.status === 'in_progress' ? 'default' : meeting.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
            {meeting.status === 'scheduled' ? 'Đã lên lịch' : meeting.status === 'in_progress' ? '🔴 Đang họp' : 'Đã kết thúc'}
          </Badge>
        </div>
      </div>

      {/* Main content: Video + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-3" style={{ height: 'calc(100vh - 260px)' }}>
        {/* Jitsi iframe - takes most space */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-border/50 bg-muted/30">
          {meeting.status === 'in_progress' || meeting.status === 'scheduled' ? (
            <iframe
              src={jitsiUrl}
              className="w-full h-full min-h-[400px]"
              allow="camera;microphone;display-capture;autoplay;clipboard-write"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <VideoOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Cuộc họp đã kết thúc</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: collapsible attendance + notes */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Attendance - collapsible */}
          <Collapsible open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
            <Card className="flex flex-col">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4 text-primary" />
                    Điểm danh
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                      {presentCount}/{members.length}
                    </Badge>
                    {lateCount > 0 && (
                      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px] px-1.5 py-0">
                        {lateCount} trễ
                      </Badge>
                    )}
                  </div>
                  {isAttendanceOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0 border-t">
                  <ScrollArea className="max-h-[280px]">
                    <div className="space-y-0.5 p-2">
                      {members.map(member => {
                        const att = attendance.find(a => a.user_id === member.user_id);
                        const mp = member.profiles;
                        return (
                          <div key={member.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                            {getStatusIcon(att?.status || 'absent')}
                            {mp?.avatar_url ? (
                              <img src={mp.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                {mp?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs font-medium truncate flex-1">{mp?.full_name}</span>
                            {isLeader && meeting.status !== 'completed' ? (
                              <Select
                                value={att?.status || 'absent'}
                                onValueChange={(v) => handleUpdateAttendance(member.user_id, v)}
                              >
                                <SelectTrigger className="w-[80px] h-6 text-[10px] px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Có mặt</SelectItem>
                                  <SelectItem value="late">Trễ</SelectItem>
                                  <SelectItem value="absent">Vắng</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              getStatusBadge(att?.status || 'absent')
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Meeting Notes */}
          <Card className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <StickyNote className="w-4 h-4 text-primary" />
                Ghi chú buổi họp
              </div>
              {isSavingNotes && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
                </div>
              )}
            </div>
            <CardContent className="flex-1 p-0 px-4 pb-4 min-h-0">
              <Textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Ghi chú nội dung cuộc họp, quyết định, action items..."
                className="h-full min-h-[120px] resize-none text-sm"
                readOnly={!isLeader && meeting.status === 'completed'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
