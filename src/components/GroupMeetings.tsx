import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Plus, Calendar, Clock, Users, CheckCircle } from 'lucide-react';
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
      // Fetch attendance for all meetings
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
      <MeetingRoom
        meeting={selectedMeeting}
        members={members}
        isLeader={isLeader}
        groupId={groupId}
        onBack={() => { setSelectedMeeting(null); fetchMeetings(); }}
        onRefresh={fetchMeetings}
      />
    );
  }

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">🔴 Đang họp</Badge>;
      case 'completed': return <Badge variant="secondary">Đã kết thúc</Badge>;
      default: return <Badge variant="outline">Đã lên lịch</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Họp Nhóm
          </h2>
          <p className="text-sm text-muted-foreground">Quản lý cuộc họp nhóm với video call và điểm danh</p>
        </div>
        {isLeader && (
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo cuộc họp
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({meetings.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Sắp tới</TabsTrigger>
          <TabsTrigger value="in_progress">Đang diễn ra</TabsTrigger>
          <TabsTrigger value="completed">Đã kết thúc</TabsTrigger>
        </TabsList>
      </Tabs>

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map(meeting => {
            const att = attendance[meeting.id] || [];
            const presentCount = att.filter(a => a.status === 'present').length;
            const isUpcoming = new Date(meeting.scheduled_at) > new Date();

            return (
              <Card
                key={meeting.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
                onClick={() => setSelectedMeeting(meeting)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                      {meeting.title}
                    </CardTitle>
                    {getStatusBadge(meeting.status)}
                  </div>
                  {meeting.description && (
                    <CardDescription className="line-clamp-2">{meeting.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(meeting.scheduled_at).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{meeting.duration_minutes} phút</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={presentCount > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {presentCount}/{members.length} có mặt
                    </span>
                  </div>
                  {meeting.status === 'in_progress' && (
                    <Button size="sm" className="w-full mt-2 gap-2">
                      <Video className="w-4 h-4" /> Vào phòng họp
                    </Button>
                  )}
                </CardContent>
              </Card>
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
