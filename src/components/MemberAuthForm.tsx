import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Hash, Lock, Users, Mail, User, UserPlus, LogIn } from 'lucide-react';
import { UEHLogo } from '@/components/UEHLogo';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập Mã số sinh viên'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const registerSchema = z.object({
  studentId: z.string().min(1, 'Vui lòng nhập MSSV').max(20, 'MSSV tối đa 20 ký tự'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  email: z.string().email('Email không hợp lệ').max(255, 'Email tối đa 255 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu tối thiểu 6 ký tự'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

function PolicyCheckbox({
  checked,
  onCheckedChange,
  policyContent,
  policyUpdatedAt,
  error,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  policyContent: string;
  policyUpdatedAt: string | null;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id="policy-agree"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="shrink-0"
        />
        <label htmlFor="policy-agree" className="text-sm cursor-pointer leading-none flex items-center gap-1 flex-wrap">
          <span>Tôi đồng ý với</span>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="text-primary hover:underline font-medium">
                Chính sách hệ thống
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1280px] h-[720px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
              <DialogHeader className="px-5 py-3 border-b bg-primary/5 shrink-0">
                <div className="flex items-center gap-3">
                  <UEHLogo width={40} />
                  <div>
                    <DialogTitle className="text-lg font-bold">Chính sách hệ thống - Teamworks UEH</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Vui lòng đọc kỹ các điều khoản trước khi sử dụng hệ thống
                      {policyUpdatedAt && (
                        <> · Cập nhật lần cuối: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}</span></>
                      )}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {policyContent ? (
                    <ReactMarkdown>{policyContent}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">Chưa có nội dung chính sách.</p>
                  )}
                </div>
              </div>
              {policyUpdatedAt && (
                <div className="px-5 py-3 border-t bg-muted/30 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    Cập nhật lần cuối: {format(new Date(policyUpdatedAt), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
          {policyUpdatedAt && (
            <span className="text-[11px] text-muted-foreground">(Cập nhật: {format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })})</span>
          )}
        </label>
      </div>
      {error && <p className="text-sm text-destructive ml-6">{error}</p>}
    </div>
  );
}

export function MemberAuthForm() {
  const navigate = useNavigate();
  const { signUp, signIn, user, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('login');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginPolicyAgreed, setLoginPolicyAgreed] = useState(true);

  // Register fields
  const [regStudentId, setRegStudentId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPolicyAgreed, setRegPolicyAgreed] = useState(false);

  // Policy
  const [policyContent, setPolicyContent] = useState('');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      if (profile.is_approved) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, navigate]);

  // Fetch policy
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

  // If logged in but not approved, show pending screen
  if (user && profile && !profile.is_approved) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <UEHLogo width={100} />
          <span className="font-heading font-semibold text-primary flex items-center gap-1">
            <Users className="w-4 h-4" /> Teamworks UEH
          </span>
        </div>
        <Card className="w-full shadow-card-lg border-border/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-heading font-semibold">Tài khoản đang chờ duyệt</h2>
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn đã được tạo thành công. Vui lòng chờ Admin xét duyệt trước khi sử dụng hệ thống.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-left text-sm space-y-1">
              <p><span className="text-muted-foreground">Họ tên:</span> <span className="font-medium">{profile.full_name}</span></p>
              <p><span className="text-muted-foreground">MSSV:</span> <span className="font-medium">{profile.student_id}</span></p>
              <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{profile.email}</span></p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut({ scope: 'local' });
                window.location.reload();
              }}
            >
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!loginPolicyAgreed) {
      setErrors({ policy: 'Vui lòng đồng ý với Chính sách hệ thống để tiếp tục' });
      return;
    }

    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const studentId = identifier.trim();
    
    try {
      const { data: email, error: lookupError } = await supabase
        .rpc('get_email_by_student_id', { _student_id: studentId });

      if (lookupError) {
        setIsLoading(false);
        toast({ title: 'Lỗi hệ thống', description: 'Không thể kiểm tra MSSV.', variant: 'destructive' });
        return;
      }

      if (!email) {
        setIsLoading(false);
        toast({
          title: 'MSSV không tồn tại',
          description: 'Mã số sinh viên này chưa được đăng ký trong hệ thống. Bạn có thể chuyển sang tab "Tạo tài khoản" để đăng ký.',
          variant: 'destructive',
        });
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('student_id', studentId)
        .maybeSingle();

      if (profileData && !profileData.is_approved) {
        setIsLoading(false);
        toast({
          title: 'Tài khoản chờ duyệt',
          description: 'Tài khoản của bạn đã được tạo nhưng đang chờ Admin xét duyệt. Vui lòng thử lại sau.',
        });
        return;
      }

      const { error } = await signIn(email, password);
      setIsLoading(false);

      if (error) {
        toast({
          title: 'Đăng nhập thất bại',
          description: error.message === 'Invalid login credentials' ? 'MSSV hoặc mật khẩu không đúng' : error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Đăng nhập thành công', description: 'Chào mừng bạn quay lại!' });
      }
    } catch (err) {
      setIsLoading(false);
      toast({ title: 'Lỗi hệ thống', description: 'Có lỗi xảy ra. Vui lòng thử lại sau.', variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!regPolicyAgreed) {
      setErrors({ policy: 'Vui lòng đồng ý với Chính sách hệ thống để đăng ký' });
      return;
    }

    const result = registerSchema.safeParse({
      studentId: regStudentId,
      fullName: regFullName,
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingEmail } = await supabase
        .rpc('get_email_by_student_id', { _student_id: regStudentId.trim() });

      if (existingEmail) {
        setIsLoading(false);
        toast({ title: 'MSSV đã tồn tại', description: 'Mã số sinh viên này đã được đăng ký trong hệ thống.', variant: 'destructive' });
        return;
      }

      const { error } = await signUp(regEmail.trim(), regPassword, regStudentId.trim(), regFullName.trim());

      if (error) {
        setIsLoading(false);
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('already registered') || msg.includes('already exists')) {
          toast({ title: 'Email đã tồn tại', description: 'Email này đã được sử dụng. Vui lòng dùng email khác.', variant: 'destructive' });
        } else {
          toast({ title: 'Đăng ký thất bại', description: error.message, variant: 'destructive' });
        }
      } else {
        await supabase.auth.signOut({ scope: 'local' });
        setIsLoading(false);
        setRegisterSuccess(true);
        toast({ title: 'Đăng ký thành công', description: 'Tài khoản đang chờ Admin duyệt.' });
      }
    } catch (err) {
      setIsLoading(false);
      toast({ title: 'Lỗi hệ thống', description: 'Có lỗi xảy ra. Vui lòng thử lại sau.', variant: 'destructive' });
    }
  };

  if (registerSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <UEHLogo width={100} />
          <span className="font-heading font-semibold text-primary flex items-center gap-1">
            <Users className="w-4 h-4" /> Teamworks UEH
          </span>
        </div>
        <Card className="w-full shadow-card-lg border-border/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-heading font-semibold">Đăng ký thành công!</h2>
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn đã được tạo và đang chờ Admin xét duyệt. Bạn sẽ có thể đăng nhập sau khi được duyệt.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setRegisterSuccess(false);
                setActiveTab('login');
                setRegStudentId('');
                setRegFullName('');
                setRegEmail('');
                setRegPassword('');
                setRegConfirmPassword('');
              }}
            >
              Quay lại đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-2">
        <UEHLogo width={100} />
        <span className="font-heading font-semibold text-primary flex items-center gap-1">
          <Users className="w-4 h-4" /> Teamworks UEH - Thành viên
        </span>
      </div>
      <Card className="w-full shadow-card-lg border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg font-heading">
            {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'login'
              ? 'Nhập MSSV và mật khẩu để đăng nhập'
              : 'Điền thông tin để đăng ký tài khoản mới'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-identifier">Mã số sinh viên (MSSV)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder="31241234567"
                    className="pl-10"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* Policy checkbox - checked by default for login */}
              <PolicyCheckbox
                checked={loginPolicyAgreed}
                onCheckedChange={setLoginPolicyAgreed}
                policyContent={policyContent}
                policyUpdatedAt={policyUpdatedAt}
                error={errors.policy}
              />

              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Đăng nhập
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => { setActiveTab('register'); setErrors({}); }}
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reg-student-id">Mã số sinh viên (MSSV)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-student-id"
                    type="text"
                    placeholder="31241234567"
                    className="pl-10"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.studentId && <p className="text-sm text-destructive">{errors.studentId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-full-name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-full-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    className="pl-10"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* Policy checkbox - unchecked by default for register */}
              <PolicyCheckbox
                checked={regPolicyAgreed}
                onCheckedChange={setRegPolicyAgreed}
                policyContent={policyContent}
                policyUpdatedAt={policyUpdatedAt}
                error={errors.policy}
              />

              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Tạo tài khoản
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Sau khi tạo, tài khoản cần được Admin duyệt trước khi sử dụng.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => { setActiveTab('login'); setErrors({}); }}
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
