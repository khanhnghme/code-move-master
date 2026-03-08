import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';
import { formatDeadlineShortVN } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Video, VideoOff, Users, CheckCircle, Clock, XCircle,
  StickyNote, Loader2, Maximize, Minimize,
  Link2, Check, ExternalLink
} from 'lucide-react';
import type { GroupMember } from '@/types/database';

const JAAS_APP_ID = 'vpaas-magic-cookie-32897196ce344000a13727f619440fe0';

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
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState(meeting.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto check-in when member opens the room
  useEffect(() => {
    fetchAttendance().then(() => {
      if (user && (meeting.status === 'in_progress' || meeting.status === 'scheduled')) {
        autoCheckIn();
      }
    });
  }, [meeting.id, user]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const autoCheckIn = async () => {
    if (!user) return;
    try {
      const { data: existing } = await (supabase.from('meeting_attendance') as any)
        .select('id, status')
        .eq('meeting_id', meeting.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing && existing.status === 'absent') {
        await (supabase.from('meeting_attendance') as any)
          .update({ status: 'present', joined_at: new Date().toISOString() })
          .eq('id', existing.id);
        fetchAttendance();
      }
    } catch (e) {
      console.error('Auto check-in failed:', e);
    }
  };

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
    } catch (e) { /* silent */ } finally {
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
      .update({ status, marked_by: user!.id, joined_at: status === 'present' ? new Date().toISOString() : null })
      .eq('meeting_id', meeting.id)
      .eq('user_id', userId);
    fetchAttendance();
  };

  const handleStartMeeting = async () => {
    await (supabase.from('meetings') as any).update({ status: 'in_progress' }).eq('id', meeting.id);
    await logActivity({
      userId: user!.id, userName: profile?.full_name || user?.email || 'Unknown',
      action: 'START_MEETING', actionType: 'task',
      description: `Bắt đầu cuộc họp "${meeting.title}"`, groupId,
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
        userId: user!.id, userName: profile?.full_name || user?.email || 'Unknown',
        action: 'END_MEETING', actionType: 'task',
        description: `Kết thúc cuộc họp "${meeting.title}" - ${presentCount}/${members.length} có mặt`, groupId,
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

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleCopyLink = () => {
    const meetingUrl = `${window.location.origin}${window.location.pathname}?tab=meetings&meeting=${meeting.id}`;
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    toast({ title: 'Đã sao chép đường dẫn', description: 'Chia sẻ link này để mời thành viên vào họp' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMeetingLink = () => {
    const link = meeting.external_link;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
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

  const isSidebarOpen = isAttendanceOpen || isNotesOpen;
  const isActive = meeting.status === 'in_progress' || meeting.status === 'scheduled';

  return (
    <div ref={containerRef} className={`flex flex-col bg-background ${isFullscreen ? 'h-screen' : 'h-full'}`}>
      {/* Compact toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-bold truncate">{meeting.title}</h2>
          <Badge variant={meeting.status === 'in_progress' ? 'default' : meeting.status === 'completed' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
            {meeting.status === 'scheduled' ? 'Đã lên lịch' : meeting.status === 'in_progress' ? '🔴 LIVE' : 'Xong'}
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden sm:inline shrink-0">
            {formatDeadlineShortVN(meeting.scheduled_at)} • {meeting.duration_minutes}p
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Copy page link */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyLink} title="Sao chép đường dẫn trang">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
          </Button>

          {/* Toggle attendance */}
          <Button
            variant={isAttendanceOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs px-2"
            onClick={() => { setIsAttendanceOpen(!isAttendanceOpen); if (!isAttendanceOpen) setIsNotesOpen(false); }}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Điểm danh</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 ml-0.5">{presentCount}/{members.length}</Badge>
          </Button>

          {/* Toggle notes */}
          <Button
            variant={isNotesOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-xs px-2"
            onClick={() => { setIsNotesOpen(!isNotesOpen); if (!isNotesOpen) setIsAttendanceOpen(false); }}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ghi chú</span>
            {isSavingNotes && <Loader2 className="w-3 h-3 animate-spin" />}
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleFullscreen} title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </Button>

          {/* Meeting controls */}
          {meeting.status === 'scheduled' && isLeader && (
            <Button size="sm" onClick={handleStartMeeting} className="gap-1 h-7 text-xs px-2.5">
              <Video className="w-3.5 h-3.5" /> Bắt đầu
            </Button>
          )}
          {meeting.status === 'in_progress' && isLeader && (
            <Button variant="destructive" size="sm" onClick={handleEndMeeting} disabled={isEnding} className="gap-1 h-7 text-xs px-2.5">
              <VideoOff className="w-3.5 h-3.5" /> Kết thúc
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main area - embedded Jitsi or meeting info */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isActive ? (
            <JitsiEmbed
              roomName={`${JAAS_APP_ID}/${meeting.jitsi_room_name}`}
              displayName={profile?.full_name || user?.email || 'User'}
              email={user?.email || ''}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <VideoOff className="w-16 h-16 mx-auto text-muted-foreground/40" />
                <div>
                  <p className="font-semibold text-lg">Cuộc họp đã kết thúc</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {presentCount}/{members.length} thành viên đã tham gia
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide-in sidebar panel */}
        {isSidebarOpen && (
          <div className="w-[300px] shrink-0 border-l border-border/50 flex flex-col bg-background overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Attendance panel */}
            {isAttendanceOpen && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4 text-primary" /> Điểm danh
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{presentCount} có mặt</Badge>
                    {lateCount > 0 && (
                      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px] px-1.5 py-0">{lateCount} trễ</Badge>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1">
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
                              {mp?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium truncate flex-1">{mp?.full_name}</span>
                          {isLeader && meeting.status !== 'completed' ? (
                            <Select value={att?.status || 'absent'} onValueChange={(v) => handleUpdateAttendance(member.user_id, v)}>
                              <SelectTrigger className="w-[75px] h-6 text-[10px] px-1.5">
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
              </div>
            )}

            {/* Notes panel */}
            {isNotesOpen && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <StickyNote className="w-4 h-4 text-primary" /> Ghi chú
                  </div>
                  {isSavingNotes && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Lưu...
                    </div>
                  )}
                </div>
                <div className="flex-1 p-2 min-h-0">
                  <Textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder="Ghi chú nội dung cuộc họp, quyết định, action items..."
                    className="h-full resize-none text-sm border-0 focus-visible:ring-0 shadow-none"
                    readOnly={!isLeader && meeting.status === 'completed'}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function JitsiEmbed({ roomName, displayName, email }: { roomName: string; displayName: string; email: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load JaaS external API script
    const scriptId = 'jaas-external-api';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    const initJitsi = () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      if (!containerRef.current) return;

      apiRef.current = new (window as any).JitsiMeetExternalAPI('8x8.vc', {
        roomName,
        parentNode: containerRef.current,
        userInfo: {
          displayName,
          email,
        },
        configOverrides: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: true,
        },
        interfaceConfigOverrides: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        },
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://8x8.vc/${JAAS_APP_ID}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    } else if ((window as any).JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      script.addEventListener('load', initJitsi);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, email]);

  return <div ref={containerRef} className="w-full h-full" />;
}
