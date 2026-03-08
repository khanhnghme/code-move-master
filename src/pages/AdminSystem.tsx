import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Wrench, AlertTriangle, FileText, Clock, Save, Edit, CheckCircle2, HelpCircle, Bug } from 'lucide-react';
import uehLogoWhite from '@/assets/ueh-logo-new.png';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { UEHLogo } from '@/components/UEHLogo';

export default function AdminSystem() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Maintenance state
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [showGuidePopover, setShowGuidePopover] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Hệ thống đang bảo trì, vui lòng quay lại sau.');
  const [maintenanceDays, setMaintenanceDays] = useState(0);
  const [customDays, setCustomDays] = useState('');
  const [maintenanceStart, setMaintenanceStart] = useState('');
  const [maintenanceEnd, setMaintenanceEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);

  // Original maintenance state for comparison
  const [origMaintenanceEnabled, setOrigMaintenanceEnabled] = useState(false);

  // Policy state
  const [policyContent, setPolicyContent] = useState('');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editPolicyContent, setEditPolicyContent] = useState('');

  // Error logging state
  const [errorLoggingEnabled, setErrorLoggingEnabled] = useState(true);
  const [savingErrorLogging, setSavingErrorLogging] = useState(false);
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchSettings();
  }, [isAdmin, isLoading]);

  const fetchSettings = async () => {
    try {
      const [maintenanceRes, policyRes, errorLoggingRes] = await Promise.all([
        supabase.from('system_settings').select('*').eq('key', 'maintenance_mode').maybeSingle(),
        supabase.from('system_settings').select('*').eq('key', 'system_policy').maybeSingle(),
        supabase.from('system_settings').select('*').eq('key', 'error_logging').maybeSingle(),
      ]);

      if (maintenanceRes.data?.value) {
        const val = maintenanceRes.data.value as { enabled?: boolean; message?: string; duration_days?: number; start_at?: string; end_at?: string };
        setMaintenanceEnabled(val.enabled ?? false);
        setOrigMaintenanceEnabled(val.enabled ?? false);
        setMaintenanceMessage(val.message ?? 'Hệ thống đang bảo trì, vui lòng quay lại sau.');
        const days = val.duration_days ?? 0;
        setMaintenanceDays(days);
        if (days > 0 && ![1,3,5,7,14,30].includes(days)) setCustomDays(String(days));
        setMaintenanceStart(val.start_at ?? '');
        setMaintenanceEnd(val.end_at ?? '');
      }

      if (policyRes.data?.value) {
        const val = policyRes.data.value as { content?: string; updated_at?: string };
        setPolicyContent(val.content ?? '');
        setPolicyUpdatedAt(val.updated_at ?? null);
      }

      if (errorLoggingRes.data?.value) {
        const val = errorLoggingRes.data.value as { enabled?: boolean };
        setErrorLoggingEnabled(val.enabled ?? true);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const endAt = maintenanceDays > 0 ? new Date(now.getTime() + maintenanceDays * 86400000).toISOString() : null;
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: {
            enabled: maintenanceEnabled,
            message: maintenanceMessage,
            duration_days: maintenanceDays || null,
            start_at: maintenanceEnabled ? now.toISOString() : null,
            end_at: endAt,
          },
          updated_at: now.toISOString(),
        })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      setOrigMaintenanceEnabled(maintenanceEnabled);

      toast({
        title: 'Đã lưu cài đặt',
        description: maintenanceEnabled
          ? 'Chế độ bảo trì đã được BẬT.'
          : 'Chế độ bảo trì đã TẮT.',
      });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể lưu cài đặt', variant: 'destructive' });
    } finally {
      setSaving(false);
      setShowMaintenanceConfirm(false);
    }
  };

  const handleOpenPolicyEditor = () => {
    setEditPolicyContent(policyContent);
    setPolicyDialogOpen(true);
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: { content: editPolicyContent, updated_at: now },
          updated_at: now,
        })
        .eq('key', 'system_policy');

      if (error) throw error;
      setPolicyContent(editPolicyContent);
      setPolicyUpdatedAt(now);
      setPolicyDialogOpen(false);
      toast({ title: 'Đã lưu chính sách', description: 'Nội dung chính sách hệ thống đã được cập nhật.' });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể lưu chính sách', variant: 'destructive' });
    } finally {
      setSavingPolicy(false);
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground text-sm">Các chức năng quản trị đặc biệt dành cho Admin chính</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Maintenance Mode */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Wrench className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Khóa hệ thống
                      {maintenanceEnabled && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">BẬT</Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
                <Switch
                  checked={maintenanceEnabled}
                  onCheckedChange={(checked) => {
                    setMaintenanceEnabled(checked);
                    setShowMaintenanceConfirm(true);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-muted-foreground">
                Khi bật, toàn bộ thành viên (trừ Admin) sẽ không thể truy cập hệ thống.
              </p>

              {/* Duration presets */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Thời lượng khóa
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '1 ngày', days: 1 },
                    { label: '3 ngày', days: 3 },
                    { label: '7 ngày', days: 7 },
                    { label: '14 ngày', days: 14 },
                    { label: '30 ngày', days: 30 },
                  ].map((opt) => (
                    <Button
                      key={opt.days}
                      type="button"
                      size="sm"
                      variant={maintenanceDays === opt.days && !customDays ? 'default' : 'outline'}
                      className="h-7 text-xs px-2.5"
                      onClick={() => { setMaintenanceDays(opt.days); setCustomDays(''); }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Tùy chỉnh..."
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      const n = parseInt(e.target.value);
                      if (n > 0) setMaintenanceDays(n);
                    }}
                    className="h-7 text-xs flex-1"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">ngày</span>
                </div>
              </div>

              {maintenanceDays > 0 && (
                <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                  ⏱ Tự mở lại sau <span className="font-semibold text-foreground">{maintenanceDays} ngày</span>
                  {maintenanceEnabled && maintenanceEnd ? (
                    <> · Dự kiến: <span className="font-semibold text-foreground">{format(new Date(maintenanceEnd), "HH:mm dd/MM/yyyy", { locale: vi })}</span></>
                  ) : (
                    <> kể từ khi bật</>
                  )}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-msg" className="text-xs">Thông báo</Label>
                <Textarea
                  id="maintenance-msg"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Nhập thông báo bảo trì..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: System Policy */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Chính sách hệ thống</CardTitle>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleOpenPolicyEditor}>
                  <Edit className="w-3 h-3" /> Chỉnh sửa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Nội dung chính sách người dùng cần đồng ý khi đăng nhập.
                {policyUpdatedAt && (
                  <> · Cập nhật: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}</span></>
                )}
              </p>
              {!policyContent && (
                <p className="text-sm text-muted-foreground mt-2 italic">Chưa có nội dung chính sách. Bấm "Chỉnh sửa" để thêm.</p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Error Logging */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Bug className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Ghi lỗi hệ thống
                      <Badge variant={errorLoggingEnabled ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {errorLoggingEnabled ? 'BẬT' : 'TẮT'}
                      </Badge>
                    </CardTitle>
                  </div>
                </div>
                <Switch
                  checked={errorLoggingEnabled}
                  disabled={savingErrorLogging}
                  onCheckedChange={async (checked) => {
                    setSavingErrorLogging(true);
                    try {
                      const { error } = await supabase
                        .from('system_settings')
                        .update({ value: { enabled: checked }, updated_at: new Date().toISOString() })
                        .eq('key', 'error_logging');
                      if (error) throw error;
                      setErrorLoggingEnabled(checked);
                      toast({
                        title: checked ? 'Đã bật ghi lỗi' : 'Đã tắt ghi lỗi',
                        description: checked ? 'Hệ thống sẽ tự động ghi lại các lỗi.' : 'Hệ thống sẽ không ghi lỗi vào CSDL.',
                      });
                    } catch {
                      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' });
                    } finally {
                      setSavingErrorLogging(false);
                    }
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {errorLoggingEnabled
                  ? 'Tự động ghi lại các lỗi runtime, promise rejection và console error vào cơ sở dữ liệu.'
                  : 'Không ghi lỗi — lỗi sẽ chỉ hiện trong console trình duyệt.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Maintenance Confirm Dialog */}
      <AlertDialog open={showMaintenanceConfirm} onOpenChange={setShowMaintenanceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Xác nhận thay đổi trạng thái
            </AlertDialogTitle>
            <AlertDialogDescription>
              {maintenanceEnabled !== origMaintenanceEnabled ? (
                maintenanceEnabled
                  ? 'Bạn sắp BẬT chế độ bảo trì. Toàn bộ thành viên (trừ Admin) sẽ bị chặn truy cập hệ thống.'
                  : 'Bạn sắp TẮT chế độ bảo trì. Hệ thống sẽ hoạt động trở lại bình thường.'
              ) : (
                'Bạn muốn lưu các thay đổi cài đặt bảo trì?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMaintenanceEnabled(origMaintenanceEnabled)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveMaintenance} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Policy Editor Dialog - 16:9 */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[1280px] h-[720px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-0 shadow-2xl">
          {/* Header with UEH branding */}
          <div className="relative shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative px-6 py-4 flex items-center gap-4">
              <div className="p-2 rounded-xl">
                <img src={uehLogoWhite} alt="UEH Logo" style={{ width: 44, height: 'auto' }} />
              </div>
              <div className="text-primary-foreground flex-1">
                <DialogTitle className="text-xl font-bold text-primary-foreground">Chỉnh sửa Chính sách hệ thống</DialogTitle>
                <p className="text-sm opacity-80">
                  Soạn thảo nội dung Markdown — Xem trước realtime
                  {policyUpdatedAt && (
                    <> · Cập nhật lần cuối: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}</span></>
                  )}
                </p>
              </div>
              <Badge className="bg-white/20 text-primary-foreground border-0 backdrop-blur-sm text-xs">
                <Edit className="w-3 h-3 mr-1" /> Editor
              </Badge>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-2 divide-x">
            {/* Editor */}
            <div className="flex flex-col min-h-0">
              <div className="px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Soạn thảo
                </span>
              </div>
              <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
                <Textarea
                  value={editPolicyContent}
                  onChange={(e) => setEditPolicyContent(e.target.value)}
                  placeholder={"# Chính sách hệ thống\n\n## 1. Quy tắc chung\n- Không chia sẻ tài khoản...\n\n## 2. Bảo mật thông tin\n..."}
                  className="font-mono text-sm flex-1 min-h-0 resize-none"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col min-h-0">
              <div className="px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Xem trước
                </span>
              </div>
              <div className="flex-1 min-h-0 p-6 overflow-y-auto overscroll-contain">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-primary prose-h1:text-2xl prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-3 prose-h2:text-lg prose-h2:mt-6 prose-a:text-accent prose-strong:text-foreground">
                  {editPolicyContent ? (
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{editPolicyContent}</ReactMarkdown>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground">Nhập nội dung bên trái để xem trước...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center relative">
            {/* Guide button - bottom left */}
            <div className="mr-auto relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowGuidePopover(!showGuidePopover)}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Hướng dẫn soạn thảo
              </Button>

              {/* Guide Popover */}
              {showGuidePopover && (
                <div className="absolute bottom-full left-0 mb-2 w-[420px] max-h-[480px] overflow-y-auto rounded-xl border bg-popover shadow-2xl p-4 text-xs text-muted-foreground space-y-3 z-50 animate-scale-in">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-primary" /> Hướng dẫn Markdown
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowGuidePopover(false)}>
                      <span className="text-lg leading-none">×</span>
                    </Button>
                  </div>

                  {/* Basic formatting */}
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">📝 Định dạng cơ bản</p>
                    <div className="space-y-0.5">
                      <p><code className="bg-muted px-1 rounded text-[11px]">**text**</code> → <strong>in đậm</strong></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">*text*</code> → <em>in nghiêng</em></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">***text***</code> → <strong><em>đậm + nghiêng</em></strong></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">~~text~~</code> → <span className="line-through">gạch ngang</span></p>
                    </div>
                  </div>

                  {/* Headings */}
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">📌 Tiêu đề</p>
                    <div className="space-y-0.5">
                      <p><code className="bg-muted px-1 rounded text-[11px]"># Tiêu đề</code> → <span className="font-bold text-sm">H1 (lớn nhất)</span></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">## Tiêu đề</code> → <span className="font-semibold">H2</span></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">### Tiêu đề</code> → <span className="font-medium">H3</span></p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">#### Tiêu đề</code> → H4 (nhỏ nhất)</p>
                    </div>
                  </div>

                  {/* Line breaks */}
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">↵ Xuống hàng & đoạn</p>
                    <div className="space-y-0.5">
                      <p><code className="bg-muted px-1 rounded text-[11px]">Enter 2 lần</code> → xuống đoạn mới</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">2 dấu cách + Enter</code> → xuống hàng</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">{'<br/>'}</code> → ép xuống hàng</p>
                    </div>
                  </div>

                  {/* Lists */}
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">📋 Danh sách</p>
                    <div className="space-y-0.5">
                      <p><code className="bg-muted px-1 rounded text-[11px]">- mục 1</code> → danh sách chấm</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">1. mục 1</code> → danh sách số</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">{'  '}- mục con</code> → thụt vào (2 space)</p>
                    </div>
                  </div>

                  {/* Links & media */}
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">🔗 Liên kết & khác</p>
                    <div className="space-y-0.5">
                      <p><code className="bg-muted px-1 rounded text-[11px]">[text](url)</code> → liên kết</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">{'> trích dẫn'}</code> → blockquote</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">---</code> → đường kẻ ngang</p>
                      <p><code className="bg-muted px-1 rounded text-[11px]">`code`</code> → <code className="bg-muted px-1 rounded">code inline</code></p>
                    </div>
                  </div>

                  {/* UEH special */}
                  <div className="border-t pt-2">
                    <p className="font-semibold text-foreground mb-1.5">🎨 Màu sắc & kích thước UEH</p>
                    <div className="space-y-1">
                      <p className="text-[11px]">Dùng HTML inline để đổi màu/cỡ chữ:</p>
                      <div className="bg-muted/60 rounded p-2 font-mono text-[10px] space-y-0.5">
                        <p>{'<span style="color:#006D6F">Xanh UEH</span>'}</p>
                        <p>{'<span style="color:#E8702A">Cam UEH</span>'}</p>
                        <p>{'<span style="color:red">Đỏ cảnh báo</span>'}</p>
                        <p>{'<span style="font-size:18px">Chữ to</span>'}</p>
                        <p>{'<span style="font-size:12px">Chữ nhỏ</span>'}</p>
                      </div>
                      <p className="text-[11px] mt-1">Kết hợp nhiều thuộc tính:</p>
                      <div className="bg-muted/60 rounded p-2 font-mono text-[10px]">
                        <p>{'<span style="color:#006D6F;font-size:20px;font-weight:bold">Tiêu đề UEH</span>'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Color reference */}
                  <div className="border-t pt-2">
                    <p className="font-semibold text-foreground mb-1.5">🎯 Bảng màu UEH</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary shrink-0" />
                        <span className="text-[11px]">#006D6F Xanh teal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent shrink-0" />
                        <span className="text-[11px]">#E8702A Cam</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-warning shrink-0" />
                        <span className="text-[11px]">#F59E0B Vàng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-destructive shrink-0" />
                        <span className="text-[11px]">#EF4444 Đỏ</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSavePolicy} disabled={savingPolicy} className="gap-2">
              {savingPolicy ? 'Đang lưu...' : <><CheckCircle2 className="w-4 h-4" /> Xác nhận thay đổi</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
