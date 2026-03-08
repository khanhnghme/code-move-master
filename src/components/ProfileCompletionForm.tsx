import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Hash, User, Users, FileText, Shield } from 'lucide-react';
import { UEHLogo } from '@/components/UEHLogo';
import uehLogoWhite from '@/assets/ueh-logo-new.png';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export function ProfileCompletionForm() {
  const { user, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [policyContent, setPolicyContent] = useState('');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system_policy')
        .maybeSingle();
      if (data?.value) {
        const val = data.value as { content?: string; updated_at?: string };
        setPolicyContent(val.content ?? '');
        setPolicyUpdatedAt(val.updated_at ?? null);
      }
    };
    fetchPolicy();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!studentId.trim()) {
      setErrors({ studentId: 'Vui lòng nhập MSSV' });
      return;
    }
    if (!fullName.trim()) {
      setErrors({ fullName: 'Vui lòng nhập họ tên' });
      return;
    }
    if (!policyAgreed) {
      setErrors({ policy: 'Vui lòng đồng ý với Chính sách hệ thống' });
      return;
    }

    setIsLoading(true);
    try {
      // Check if MSSV already exists
      const { data: existingEmail } = await supabase
        .rpc('get_email_by_student_id', { _student_id: studentId.trim() });

      if (existingEmail) {
        setIsLoading(false);
        toast({
          title: 'MSSV đã tồn tại',
          description: 'Mã số sinh viên này đã được đăng ký. Hãy liên kết Google trong trang cá nhân của tài khoản đó.',
          variant: 'destructive',
        });
        return;
      }

      // Update profile with student_id and full_name
      const { error } = await supabase
        .from('profiles')
        .update({
          student_id: studentId.trim(),
          full_name: fullName.trim(),
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({ title: 'Hoàn tất', description: 'Thông tin đã được cập nhật. Tài khoản đang chờ Admin duyệt.' });
      await refreshProfile();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <UEHLogo width={100} />
          <span className="font-heading font-semibold text-primary flex items-center gap-1">
            <Users className="w-4 h-4" /> Teamworks UEH
          </span>
        </div>
        <Card className="w-full shadow-card-lg border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-heading">Hoàn tất thông tin</CardTitle>
            <CardDescription>
              Bạn đã đăng nhập bằng Google. Vui lòng điền thêm thông tin để hoàn tất tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comp-student-id">Mã số sinh viên (MSSV) *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="comp-student-id"
                    type="text"
                    placeholder="31241234567"
                    className="pl-10"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {errors.studentId && <p className="text-sm text-destructive">{errors.studentId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comp-full-name">Họ và tên *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="comp-full-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              {/* Policy checkbox */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="comp-policy"
                    checked={policyAgreed}
                    onCheckedChange={(v) => setPolicyAgreed(v === true)}
                    className="shrink-0 h-3.5 w-3.5 rounded-full border border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-transparent transition-all duration-200 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-primary"
                  />
                  <label htmlFor="comp-policy" className="text-xs cursor-pointer leading-none flex items-center gap-1 whitespace-nowrap">
                    <span>Tôi đồng ý với</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="text-warning hover:underline font-semibold">
                          Chính sách hệ thống
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] w-[1280px] h-[720px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-0 shadow-2xl">
                        <div className="relative shrink-0 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
                          <div className="relative px-6 py-5 flex items-center gap-4">
                            <div className="p-2 rounded-xl">
                              <img src={uehLogoWhite} alt="UEH Logo" style={{ width: 44, height: 'auto' }} />
                            </div>
                            <div className="text-primary-foreground">
                              <DialogTitle className="text-xl font-bold">Chính sách hệ thống</DialogTitle>
                              <p className="text-sm opacity-80">Teamworks UEH</p>
                            </div>
                            {policyUpdatedAt && (
                              <Badge className="ml-auto bg-white/20 text-primary-foreground border-0 backdrop-blur-sm text-xs">
                                Cập nhật: {format(new Date(policyUpdatedAt), "dd/MM/yyyy", { locale: vi })}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {policyContent ? (
                              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{policyContent}</ReactMarkdown>
                            ) : (
                              <div className="text-center py-16">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground">Chưa có nội dung chính sách.</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="px-6 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            {policyUpdatedAt
                              ? `Cập nhật: ${format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}`
                              : 'Teamworks UEH'}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </label>
                </div>
                {errors.policy && <p className="text-sm text-destructive ml-6">{errors.policy}</p>}
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hoàn tất đăng ký
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Sau khi hoàn tất, tài khoản cần được Admin duyệt trước khi sử dụng.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={async () => {
                  await signOut();
                  window.location.href = '/auth';
                }}
              >
                Đăng xuất
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
