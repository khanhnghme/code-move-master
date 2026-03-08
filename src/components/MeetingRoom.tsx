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
  Link2, Check, ExternalLink, UserCheck, AlertCircle
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

  useEffect(() => {
    fetchAttendance().then(() => {
      if (user && (meeting.status === 'in_progress' || meeting.status === 'scheduled')) {
        autoCheckIn();
      }
    });
  }, [meeting.id, user]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const autoCheckIn = async () => {
    if (!user) return;
    try {
      const { data: existing } = await (supabase.from('meeting_attendance') as any)
        .select('id, status').eq('meeting_id', meeting.id).eq('user_id', user.id).maybeSingle();
      if (existing && existing.status === 'absent') {
        await (supabase.from('meeting_attendance') as any)
          .update({ status: 'present', joined_at: new Date().toISOString() }).eq('id', existing.id);
        fetchAttendance();
      }
    } catch (e) { console.error('Auto check-in failed:', e); }
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
        .update({ notes: content, updated_at: new Date().toISOString() }).eq('id', meeting.id);
    } catch (e) { /* silent */ } finally { setIsSavingNotes(false); }
  };

  const fetchAttendance = async () => {
    const { data } = await (supabase.from('meeting_attendance') as any).select('*').eq('meeting_id', meeting.id);
    if (data) setAttendance(data);
  };

  const handleUpdateAttendance = async (userId: string, status: string) => {
    await (supabase.from('meeting_attendance') as any)
      .update({ status, marked_by: user!.id, joined_at: status === 'present' ? new Date().toISOString() : null })
      .eq('meeting_id', meeting.id).eq('user_id', userId);
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
        .update({ status: 'completed', notes, updated_at: new Date().toISOString() }).eq('id', meeting.id);
      if (meeting.task_id) {
        await supabase.from('tasks').update({ status: 'DONE' }).eq('id', meeting.task_id);
      }
      await logActivity({
        userId: user!.id, userName: profile?.full_name || user?.email || 'Unknown',
        action: 'END_MEETING', actionType: 'task',
        description: `Kết thúc cuộc họp "${meeting.title}" - ${presentCount}/${members.length} có mặt`, groupId,
      });
      toast({ title: 'Đã kết thúc cuộc họp', description: 'Task đã được cập nhật trạng thái DONE' });
      onRefresh(); onBack();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally { setIsEnding(false); }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }, []);

  const handleCopyLink = () => {
    const meetingUrl = `${window.location.origin}${window.location.pathname}?tab=meetings&meeting=${meeting.id}`;
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    toast({ title: 'Đã sao chép đường dẫn', description: 'Chia sẻ link này để mời thành viên vào họp' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMeetingLink = () => {
    if (meeting.external_link) window.open(meeting.external_link, '_blank', 'noopener,noreferrer');
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = members.length - presentCount - lateCount;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case 'late': return <Clock className="w-3.5 h-3.5 text-warning" />;
      default: return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-success/15 text-success border-success/30 text-[10px] px-1.5 py-0">Có mặt</Badge>;
      case 'late': return <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] px-1.5 py-0">Trễ</Badge>;
      default: return <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] px-1.5 py-0">Vắng</Badge>;
    }
  };

  const isSidebarOpen = isAttendanceOpen || isNotesOpen;
  const isActive = meeting.status === 'in_progress' || meeting.status === 'scheduled';

  return (
    <div ref={containerRef} className={`flex flex-col bg-background ${isFullscreen ? 'h-screen' : 'h-full'} rounded-xl overflow-hidden border border-border/50`}>
      {/* Toolbar - UEH styled */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-primary/5 via-background to-background border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/10" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              meeting.status === 'in_progress' 
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                : meeting.status === 'completed' 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-primary/10 text-primary'
            }`}>
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{meeting.title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatDeadlineShortVN(meeting.scheduled_at)}</span>
                <span>•</span>
                <span>{meeting.duration_minutes} phút</span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          {meeting.status === 'in_progress' ? (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 gap-1 animate-pulse shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive-foreground" />
              </span>
              LIVE
            </Badge>
          ) : meeting.status === 'completed' ? (
            <Badge variant="secondary" className="text-[10px] shrink-0">Đã xong</Badge>
          ) : (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">Đã lên lịch</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy link */}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleCopyLink} title="Sao chép đường dẫn">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5" />}
          </Button>

          {/* External link */}
          {meeting.external_link && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={handleOpenMeetingLink} title="Mở link cuộc họp">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {/* Attendance toggle */}
          <Button
            variant={isAttendanceOpen ? 'default' : 'outline'}
            size="sm"
            className={`h-8 gap-1.5 text-xs px-3 ${isAttendanceOpen ? '' : 'hover:bg-primary/5 hover:border-primary/30'}`}
            onClick={() => { setIsAttendanceOpen(!isAttendanceOpen); if (!isAttendanceOpen) setIsNotesOpen(false); }}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Điểm danh</span>
            <Badge variant={isAttendanceOpen ? 'secondary' : 'outline'} className="text-[9px] px-1.5 py-0 ml-0.5">
              {presentCount}/{members.length}
            </Badge>
          </Button>

          {/* Notes toggle */}
          <Button
            variant={isNotesOpen ? 'default' : 'outline'}
            size="sm"
            className={`h-8 gap-1.5 text-xs px-3 ${isNotesOpen ? '' : 'hover:bg-primary/5 hover:border-primary/30'}`}
            onClick={() => { setIsNotesOpen(!isNotesOpen); if (!isNotesOpen) setIsAttendanceOpen(false); }}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ghi chú</span>
            {isSavingNotes && <Loader2 className="w-3 h-3 animate-spin" />}
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </Button>

          {/* Meeting controls */}
          {meeting.status === 'scheduled' && isLeader && (
            <Button size="sm" onClick={handleStartMeeting} className="gap-1.5 h-8 text-xs px-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
              <Video className="w-3.5 h-3.5" /> Bắt đầu
            </Button>
          )}
          {meeting.status === 'in_progress' && isLeader && (
            <Button variant="destructive" size="sm" onClick={handleEndMeeting} disabled={isEnding} className="gap-1.5 h-8 text-xs px-3">
              <VideoOff className="w-3.5 h-3.5" /> Kết thúc
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Video / Info area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isActive ? (
            <JitsiEmbed
              roomName={`${JAAS_APP_ID}/${meeting.jitsi_room_name}`}
              displayName={profile?.full_name || user?.email || 'User'}
              email={user?.email || ''}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
              <div className="text-center space-y-5">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground">Cuộc họp đã kết thúc</p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {presentCount}/{members.length} thành viên đã tham gia
                  </p>
                </div>
                {/* Summary stats */}
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> {presentCount} có mặt
                  </div>
                  {lateCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" /> {lateCount} trễ
                    </div>
                  )}
                  {absentCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {absentCount} vắng
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        {isSidebarOpen && (
          <div className="w-[300px] shrink-0 border-l flex flex-col bg-background overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Attendance panel */}
            {isAttendanceOpen && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <UserCheck className="w-4 h-4" /> Điểm danh
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-2 py-0.5">{presentCount} có mặt</Badge>
                    {lateCount > 0 && (
                      <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] px-2 py-0.5">{lateCount} trễ</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{absentCount} vắng</Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-0.5 p-2">
                    {members.map(member => {
                      const att = attendance.find(a => a.user_id === member.user_id);
                      const mp = member.profiles;
                      const status = att?.status || 'absent';
                      return (
                        <div key={member.user_id} className={`
                          flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors
                          ${status === 'present' ? 'bg-success/5' : status === 'late' ? 'bg-warning/5' : 'hover:bg-muted/50'}
                        `}>
                          {getStatusIcon(status)}
                          {mp?.avatar_url ? (
                            <img src={mp.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {mp?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium truncate flex-1">{mp?.full_name}</span>
                          {isLeader && meeting.status !== 'completed' ? (
                            <Select value={status} onValueChange={(v) => handleUpdateAttendance(member.user_id, v)}>
                              <SelectTrigger className="w-[78px] h-6 text-[10px] px-1.5 border-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Có mặt</SelectItem>
                                <SelectItem value="late">Trễ</SelectItem>
                                <SelectItem value="absent">Vắng</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge(status)
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
                <div className="px-4 py-3 border-b bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-accent">
                      <StickyNote className="w-4 h-4" /> Ghi chú cuộc họp
                    </div>
                    {isSavingNotes && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Tự động lưu khi bạn ngừng gõ</p>
                </div>
                <div className="flex-1 p-3 min-h-0">
                  <Textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder="Ghi chú nội dung cuộc họp, quyết định, action items..."
                    className="h-full resize-none text-sm border-border/30 focus-visible:ring-primary/30 bg-muted/20"
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
    const scriptId = 'jaas-external-api';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    const initJitsi = () => {
      if (apiRef.current) apiRef.current.dispose();
      if (!containerRef.current) return;
      apiRef.current = new (window as any).JitsiMeetExternalAPI('8x8.vc', {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName, email },
        configOverrides: {
          startWithAudioMuted: true, startWithVideoMuted: false,
          disableDeepLinking: true, prejoinPageEnabled: true,
        },
        interfaceConfigOverrides: {
          SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false, MOBILE_APP_PROMO: false,
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
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [roomName, displayName, email]);

  return <div ref={containerRef} className="w-full h-full" />;
}
