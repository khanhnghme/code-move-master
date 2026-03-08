import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import { Loader2, KeyRound, FolderKanban, Users, Calendar, ArrowLeft, CheckCircle2, Crown, ListTodo } from 'lucide-react';
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
  memberCount: number;
  leaderName: string | null;
  taskCount: number;
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
        .select('id, name, description, class_code, instructor_name, created_at, image_url, created_by')
        .eq('join_code', code)
        .eq('allow_join_by_code', true)
        .single();

      if (groupError || !group) {
        toast({ title: 'Mã không tồn tại', description: 'Mã tham gia không đúng hoặc đã bị tắt', variant: 'destructive' });
        return;
      }

      // Get member count, leader profile, task count in parallel
      const [memberRes, leaderRes, taskRes, existingRes] = await Promise.all([
        supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('profiles').select('full_name').eq('id', group.created_by).single(),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle(),
      ]);

      setAlreadyMember(!!existingRes.data);
      setGroupPreview({
        ...group,
        memberCount: memberRes.count || 0,
        leaderName: leaderRes.data?.full_name || null,
        taskCount: taskRes.count || 0,
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

      if (joinError) throw joinError;

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
          /* Step 1: Enter code */
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
          /* Step 2: Preview & Confirm */
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

                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {groupPreview.memberCount} thành viên
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4" />
                    {groupPreview.taskCount} nhiệm vụ
                  </span>
                  {groupPreview.leaderName && (
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-warning" />
                      {groupPreview.leaderName}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(groupPreview.created_at), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {alreadyMember ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Bạn đã là thành viên của project này</span>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1"
                onClick={resetState}
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              {!alreadyMember && (
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
