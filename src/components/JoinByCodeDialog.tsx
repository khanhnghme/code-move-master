import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import { Loader2, KeyRound, Users, Calendar, ArrowLeft, CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface GroupPreview {
  id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  instructor_name: string | null;
  created_at: string;
  image_url: string | null;
  zalo_link: string | null;
  memberCount: number;
  leaderName: string | null;
  joinMemberLimit: number | null;
}

interface JoinByCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: () => void;
}

export default function JoinByCodeDialog({ open, onOpenChange, onJoined }: JoinByCodeDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const resetState = () => {
    setCode('');
    setGroupPreview(null);
    setAlreadyMember(false);
  };

  const handleLookup = async () => {
    if (!user) return;
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      toast({ title: 'Mã không hợp lệ', description: 'Vui lòng nhập đúng 4 chữ số', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name, description, class_code, instructor_name, created_at, image_url, created_by, zalo_link, join_member_limit')
        .eq('join_code', code)
        .eq('allow_join_by_code', true)
        .single();

      if (groupError || !group) {
        toast({ title: 'Mã không tồn tại', description: 'Mã tham gia không đúng hoặc đã bị tắt', variant: 'destructive' });
        return;
      }

      const [memberRes, leaderRes, existingRes] = await Promise.all([
        supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('profiles').select('full_name').eq('id', group.created_by).single(),
        supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle(),
      ]);

      setAlreadyMember(!!existingRes.data);
      setGroupPreview({
        ...group,
        memberCount: memberRes.count || 0,
        leaderName: leaderRes.data?.full_name || null,
        joinMemberLimit: (group as any).join_member_limit ?? null,
      });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!user || !profile || !groupPreview) return;

    setIsJoining(true);
    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: groupPreview.id, user_id: user.id, role: 'member' });

      if (joinError) {
        if (joinError.message?.includes('giới hạn')) {
          toast({ title: 'Không thể tham gia', description: 'Project đã đạt giới hạn thành viên', variant: 'destructive' });
        } else {
          throw joinError;
        }
        return;
      }

      await logActivity({
        userId: user.id,
        userName: profile.full_name,
        action: 'JOIN_BY_CODE',
        actionType: 'member',
        description: `Tham gia project "${groupPreview.name}" bằng mã`,
        groupId: groupPreview.id,
      });

      toast({ title: 'Tham gia thành công!', description: `Bạn đã tham gia project "${groupPreview.name}"` });
      resetState();
      onOpenChange(false);
      onJoined();
    } catch (error: any) {
      console.error('Join by code error:', error);
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  const isFull = groupPreview?.joinMemberLimit != null && groupPreview.memberCount >= groupPreview.joinMemberLimit;
  const canJoin = groupPreview && !alreadyMember && !isFull;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Nhập mã tham gia Project
          </DialogTitle>
          <DialogDescription>
            Nhập mã 4 chữ số được trưởng nhóm cung cấp để tham gia project
          </DialogDescription>
        </DialogHeader>

        {!groupPreview ? (
          <div className="space-y-4">
            <Input
              placeholder="Nhập mã 4 số (VD: 1234)"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCode(val);
              }}
              maxLength={4}
              className="text-center text-2xl font-bold tracking-[0.5em] h-14"
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              autoFocus
            />
            <Button
              onClick={handleLookup}
              disabled={code.length !== 4 || isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tìm Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="border-2 border-primary/20 overflow-hidden">
              {groupPreview.image_url && (
                <div className="w-full flex justify-center bg-muted/30 py-4">
                  <img
                    src={groupPreview.image_url}
                    alt={groupPreview.name}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-primary/20 shadow-md"
                  />
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <h3 className="font-bold text-xl leading-tight">{groupPreview.name}</h3>
                  {groupPreview.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {groupPreview.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {groupPreview.class_code && (
                    <Badge variant="secondary" className="gap-1">
                      Lớp: {groupPreview.class_code}
                    </Badge>
                  )}
                  {groupPreview.instructor_name && (
                    <Badge variant="outline" className="gap-1">
                      GV: {groupPreview.instructor_name}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trưởng nhóm:</span>
                    <span className="font-medium">{groupPreview.leaderName || 'Không rõ'}</span>
                  </div>

                  {/* Member count with capacity indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Thành viên:
                      </span>
                      <span className="font-medium">
                        {groupPreview.memberCount}
                        {groupPreview.joinMemberLimit != null
                          ? <span className="text-muted-foreground"> / {groupPreview.joinMemberLimit} người</span>
                          : <span className="text-muted-foreground"> người (không giới hạn)</span>
                        }
                      </span>
                    </div>
                    {groupPreview.joinMemberLimit != null && (
                      <div className="space-y-1">
                        <Progress
                          value={(groupPreview.memberCount / groupPreview.joinMemberLimit) * 100}
                          className={`h-2 ${isFull ? '[&>div]:bg-destructive' : ''}`}
                        />
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-medium ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {isFull
                              ? '🚫 Đã đầy — không nhận thêm thành viên'
                              : `✅ Còn nhận ${groupPreview.joinMemberLimit - groupPreview.memberCount} thành viên`
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Ngày tạo:
                    </span>
                    <span className="font-medium">{format(new Date(groupPreview.created_at), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                  {groupPreview.zalo_link && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Nhóm Zalo:</span>
                      <a
                        href={groupPreview.zalo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Tham gia Zalo
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status banner */}
            {isFull && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Không thể tham gia</p>
                  <p className="text-xs text-destructive/80">Project đã đạt giới hạn {groupPreview.joinMemberLimit} thành viên, không nhận thêm thành viên mới.</p>
                </div>
              </div>
            )}

            {!isFull && alreadyMember && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <UserCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">Đã là thành viên</p>
                  <p className="text-xs text-primary/80">Bạn đã tham gia project này rồi.</p>
                </div>
              </div>
            )}

            {canJoin && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Sẵn sàng tham gia</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    {groupPreview.joinMemberLimit != null
                      ? `Còn ${groupPreview.joinMemberLimit - groupPreview.memberCount} chỗ trống`
                      : 'Project không giới hạn số lượng thành viên'
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1"
                onClick={resetState}
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              {canJoin && (
                <Button
                  className="flex-1"
                  onClick={handleConfirmJoin}
                  disabled={isJoining}
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Xác nhận tham gia
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
