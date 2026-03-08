import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import { Loader2, KeyRound } from 'lucide-react';

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

  const handleJoin = async () => {
    if (!user || !profile) return;
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      toast({ title: 'Mã không hợp lệ', description: 'Vui lòng nhập đúng 4 chữ số', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Find group with matching join code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('join_code', code)
        .eq('allow_join_by_code', true)
        .single();

      if (groupError || !group) {
        toast({ title: 'Mã không tồn tại', description: 'Mã tham gia không đúng hoặc đã bị tắt', variant: 'destructive' });
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Đã là thành viên', description: `Bạn đã là thành viên của "${group.name}"`, variant: 'destructive' });
        return;
      }

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });

      if (joinError) throw joinError;

      await logActivity({
        userId: user.id,
        userName: profile.full_name,
        action: 'JOIN_BY_CODE',
        actionType: 'member',
        description: `Tham gia project "${group.name}" bằng mã`,
        groupId: group.id,
      });

      toast({ title: 'Tham gia thành công!', description: `Bạn đã tham gia project "${group.name}"` });
      setCode('');
      onOpenChange(false);
      onJoined();
    } catch (error: any) {
      console.error('Join by code error:', error);
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Nhập mã tham gia Project
          </DialogTitle>
          <DialogDescription>
            Nhập mã 4 chữ số được trưởng nhóm cung cấp để tham gia project
          </DialogDescription>
        </DialogHeader>
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
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <Button
            onClick={handleJoin}
            disabled={code.length !== 4 || isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Tham gia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
