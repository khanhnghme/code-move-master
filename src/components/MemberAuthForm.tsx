import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Hash, Lock, Users, User, UserPlus, LogIn, FileText, Shield } from 'lucide-react';
import { UEHLogo } from '@/components/UEHLogo';
import uehLogoWhite from '@/assets/ueh-logo-new.png';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập Mã số sinh viên'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const registerSchema = z.object({
  studentId: z.string().min(1, 'Vui lòng nhập MSSV').max(20, 'MSSV tối đa 20 ký tự'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
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
          className="shrink-0 h-3.5 w-3.5 rounded-full border border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-transparent transition-all duration-200 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-primary"
        />
        <label htmlFor="policy-agree" className="text-xs cursor-pointer leading-none flex items-center gap-1 whitespace-nowrap">
          <span>Tôi đồng ý với</span>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="text-warning hover:underline font-semibold">
                Chính sách hệ thống
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1280px] h-[720px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-0 shadow-2xl">
              {/* Header with UEH branding */}
              <div className="relative shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
                <div className="relative px-6 py-5 flex items-center gap-4">
                  <div className="p-2 rounded-xl">
                    <img src={uehLogoWhite} alt="UEH Logo" style={{ width: 44, height: 'auto' }} />
                  </div>
                  <div className="text-primary-foreground">
                    <DialogTitle className="text-xl font-bold">Chính sách hệ thống</DialogTitle>
                    <p className="text-sm opacity-80">
                      Teamworks UEH — Vui lòng đọc kỹ các điều khoản trước khi sử dụng
                    </p>
                  </div>
                  {policyUpdatedAt && (
                    <Badge className="ml-auto bg-white/20 text-primary-foreground border-0 backdrop-blur-sm text-xs">
                      Cập nhật: {format(new Date(policyUpdatedAt), "dd/MM/yyyy", { locale: vi })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-primary prose-h1:text-2xl prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-3 prose-h2:text-lg prose-h2:mt-6 prose-a:text-accent prose-strong:text-foreground">
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

              {/* Footer */}
              <div className="px-6 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {policyUpdatedAt
                    ? `Cập nhật lần cuối: ${format(new Date(policyUpdatedAt), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}`
                    : 'Teamworks UEH'}
                </p>
                <p className="text-[10px] text-muted-foreground">© UEH Teamworks</p>
              </div>
            </DialogContent>
          </Dialog>
          {policyUpdatedAt && (
            <span className="text-[10px] text-muted-foreground">· {format(new Date(policyUpdatedAt), "dd/MM/yyyy", { locale: vi })}</span>
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
  const [regPassword, setRegPassword] = useState('');
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
      password: regPassword,
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

      const placeholderEmail = `${regStudentId.trim().toLowerCase()}@teamworks.local`;
      const { error } = await signUp(placeholderEmail, regPassword, regStudentId.trim(), regFullName.trim());

      if (error) {
        setIsLoading(false);
        toast({ title: 'Đăng ký thất bại', description: error.message, variant: 'destructive' });
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
                setRegPassword('');
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

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">hoặc</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { error } = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (error) {
                      toast({ title: 'Lỗi', description: (error as Error).message, variant: 'destructive' });
                      setIsLoading(false);
                    }
                  } catch (err: any) {
                    toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
                    setIsLoading(false);
                  }
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Đăng nhập bằng Google
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
                Sau khi tạo, tài khoản cần được Admin duyệt. Khi đăng nhập lần đầu, bạn cần liên kết tài khoản Google.
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
