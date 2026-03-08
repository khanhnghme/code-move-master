import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Plus, Calendar, Clock, Users, ChevronRight, Sparkles } from 'lucide-react';
import CreateMeetingDialog from '@/components/CreateMeetingDialog';
import MeetingRoom from '@/components/MeetingRoom';
import type { Stage, GroupMember } from '@/types/database';

interface GroupMeetingsProps {
  groupId: string;
  groupName: string;
  stages: Stage[];
  members: GroupMember[];
  isLeader: boolean;
}

export default function GroupMeetings({ groupId, groupName, stages, members, isLeader }: GroupMeetingsProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [filter, setFilter] = useState('all');

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
    }
    setIsLoading(false);
  };

  if (selectedMeeting) {
    return (
      <div className="h-[calc(100vh-180px)]">
        <MeetingRoom
          meeting={selectedMeeting}
          members={members}
          isLeader={isLeader}
          groupId={groupId}
          onBack={() => { setSelectedMeeting(null); fetchMeetings(); }}
          onRefresh={fetchMeetings}
        />
      </div>
    );
  }

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const liveCount = meetings.filter(m => m.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Họp Nhóm
          </h2>
          <p className="text-sm text-muted-foreground">Quản lý cuộc họp nhóm với video call và điểm danh tự động</p>
        </div>
        {isLeader && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo cuộc họp
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({meetings.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Sắp tới</TabsTrigger>
          <TabsTrigger value="in_progress" className="relative">
            Đang diễn ra
            {liveCount > 0 && (
              <span className="ml-1.5 relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Đã kết thúc</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meeting list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Chưa có cuộc họp nào</p>
            {isLeader && <p className="text-sm text-muted-foreground mt-1">Nhấn "Tạo cuộc họp" để bắt đầu</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMeetings.map(meeting => {
            const att = attendance[meeting.id] || [];
            const presentCount = att.filter(a => a.status === 'present').length;
            const isLive = meeting.status === 'in_progress';
            const isCompleted = meeting.status === 'completed';
            const scheduledDate = new Date(meeting.scheduled_at);

            return (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting)}
                className={`
                  group relative flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all
                  ${isLive
                    ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/15 hover:border-primary/60'
                    : isCompleted
                      ? 'border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-border'
                      : 'border-border hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm'
                  }
                `}
              >
                {/* Live pulse indicator */}
                {isLive && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                  ${isLive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  }
                `}>
                  <Video className="w-4.5 h-4.5" />
                </div>

                {/* Title + Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm truncate ${isLive ? 'text-primary' : isCompleted ? 'text-muted-foreground' : ''}`}>
                      {meeting.title}
                    </h3>
                    {isLive && (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] px-1.5 py-0 shrink-0 animate-pulse">
                        LIVE
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Xong</Badge>
                    )}
                    {!isLive && !isCompleted && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">Sắp tới</Badge>
                    )}
                  </div>
                  {meeting.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{meeting.description}</p>
                  )}
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-[140px]">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{scheduledDate.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Duration */}
                <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-[70px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{meeting.duration_minutes} phút</span>
                </div>

                {/* Attendance */}
                <div className="flex items-center gap-1.5 text-xs shrink-0 w-[80px]">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className={presentCount > 0 ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                    {presentCount}/{members.length}
                  </span>
                </div>

                {/* Action */}
                {isLive ? (
                  <Button size="sm" className="shrink-0 gap-1.5 h-7 text-xs px-3">
                    <Sparkles className="w-3 h-3" /> Vào họp
                  </Button>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateMeetingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        groupId={groupId}
        groupName={groupName}
        stages={stages}
        members={members}
        onCreated={fetchMeetings}
      />
    </div>
  );
}
