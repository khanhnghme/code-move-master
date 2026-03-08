import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Video, VideoOff, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchAttendance();
  }, [meeting.id]);

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
      // Update meeting status
      await (supabase.from('meetings') as any)
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', meeting.id);

      // Mark present members' task as DONE
      if (meeting.task_id) {
        const presentMembers = attendance.filter(a => a.status === 'present');
        // Update task to DONE
        await supabase.from('tasks').update({ status: 'DONE' }).eq('id', meeting.task_id);
      }

      await logActivity({
        userId: user!.id,
        userName: profile?.full_name || user?.email || 'Unknown',
        action: 'END_MEETING', actionType: 'task',
        description: `Kết thúc cuộc họp "${meeting.title}" - ${attendance.filter(a => a.status === 'present').length}/${members.length} có mặt`,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Có mặt</Badge>;
      case 'late': return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">Trễ</Badge>;
      default: return <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30">Vắng</Badge>;
    }
  };

  const jitsiUrl = `https://meet.jit.si/${meeting.jitsi_room_name}#userInfo.displayName="${encodeURIComponent(profile?.full_name || 'User')}"`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
          <div>
            <h2 className="text-xl font-bold">{meeting.title}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(meeting.scheduled_at).toLocaleString('vi-VN')} • {meeting.duration_minutes} phút
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status === 'scheduled' && isLeader && (
            <Button onClick={handleStartMeeting} className="gap-2">
              <Video className="w-4 h-4" /> Bắt đầu họp
            </Button>
          )}
          {meeting.status === 'in_progress' && isLeader && (
            <Button variant="destructive" onClick={handleEndMeeting} disabled={isEnding} className="gap-2">
              <VideoOff className="w-4 h-4" /> Kết thúc họp
            </Button>
          )}
          <Badge variant={meeting.status === 'in_progress' ? 'default' : meeting.status === 'completed' ? 'secondary' : 'outline'}>
            {meeting.status === 'scheduled' ? 'Đã lên lịch' : meeting.status === 'in_progress' ? '🔴 Đang họp' : 'Đã kết thúc'}
          </Badge>
        </div>
      </div>

      {meeting.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{meeting.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 320px)' }}>
        {/* Jitsi iframe */}
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

        {/* Attendance panel */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Điểm danh ({attendance.filter(a => a.status === 'present').length}/{members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full max-h-[calc(100vh-440px)]">
              <div className="space-y-1 px-4 pb-4">
                {members.map(member => {
                  const att = attendance.find(a => a.user_id === member.user_id);
                  const memberProfile = member.profiles;
                  return (
                    <div key={member.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      {getStatusIcon(att?.status || 'absent')}
                      {memberProfile?.avatar_url ? (
                        <img src={memberProfile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {memberProfile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{memberProfile?.full_name}</p>
                        {att?.joined_at && (
                          <p className="text-[11px] text-muted-foreground">
                            Vào lúc {new Date(att.joined_at).toLocaleTimeString('vi-VN')}
                          </p>
                        )}
                      </div>
                      {isLeader && meeting.status !== 'completed' ? (
                        <Select
                          value={att?.status || 'absent'}
                          onValueChange={(v) => handleUpdateAttendance(member.user_id, v)}
                        >
                          <SelectTrigger className="w-[100px] h-8 text-xs">
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
        </Card>
      </div>
    </div>
  );
}
