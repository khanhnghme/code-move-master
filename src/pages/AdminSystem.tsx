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
import { Shield, Wrench, AlertTriangle, FileText, Clock, Save, Edit, CheckCircle2, HelpCircle } from 'lucide-react';
import uehLogoWhite from '@/assets/ueh-logo-new.png';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { UEHLogo } from '@/components/UEHLogo';

export default function AdminSystem() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Maintenance state
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Hệ thống đang bảo trì, vui lòng quay lại sau.');
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

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchSettings();
  }, [isAdmin, isLoading]);

  const fetchSettings = async () => {
    try {
      const [maintenanceRes, policyRes] = await Promise.all([
        supabase.from('system_settings').select('*').eq('key', 'maintenance_mode').maybeSingle(),
        supabase.from('system_settings').select('*').eq('key', 'system_policy').maybeSingle(),
      ]);

      if (maintenanceRes.data?.value) {
        const val = maintenanceRes.data.value as { enabled?: boolean; message?: string; start_at?: string; end_at?: string };
        setMaintenanceEnabled(val.enabled ?? false);
        setOrigMaintenanceEnabled(val.enabled ?? false);
        setMaintenanceMessage(val.message ?? 'Hệ thống đang bảo trì, vui lòng quay lại sau.');
        setMaintenanceStart(val.start_at ?? '');
        setMaintenanceEnd(val.end_at ?? '');
      }

      if (policyRes.data?.value) {
        const val = policyRes.data.value as { content?: string; updated_at?: string };
        setPolicyContent(val.content ?? '');
        setPolicyUpdatedAt(val.updated_at ?? null);
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
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: {
            enabled: maintenanceEnabled,
            message: maintenanceMessage,
            start_at: maintenanceStart || null,
            end_at: maintenanceEnd || null,
          },
          updated_at: new Date().toISOString(),
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground text-sm">Các chức năng quản trị đặc biệt dành cho Admin chính</p>
          </div>
        </div>

        {/* Two cards side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maintenance Mode Card */}
          <Card className="border-2 border-dashed border-warning/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Wrench className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Khóa hệ thống
                    {maintenanceEnabled && (
                      <Badge variant="destructive" className="text-xs">ĐANG BẬT</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Khi bật, toàn bộ thành viên sẽ không thể truy cập.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${maintenanceEnabled ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Trạng thái bảo trì</p>
                    <p className="text-[11px] text-muted-foreground">
                      {maintenanceEnabled ? 'Đang khóa' : 'Hoạt động bình thường'}
                    </p>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="maintenance-start" className="text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Bắt đầu
                  </Label>
                  <Input
                    id="maintenance-start"
                    type="datetime-local"
                    value={maintenanceStart}
                    onChange={(e) => setMaintenanceStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maintenance-end" className="text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Kết thúc (tự mở)
                  </Label>
                  <Input
                    id="maintenance-end"
                    type="datetime-local"
                    value={maintenanceEnd}
                    onChange={(e) => setMaintenanceEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {maintenanceEnd && (
                <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                  ⏱ Tự mở lại: <span className="font-semibold text-foreground">{format(new Date(maintenanceEnd), "HH:mm dd/MM/yyyy", { locale: vi })}</span>
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-msg" className="text-xs">Thông báo cho người dùng</Label>
                <Textarea
                  id="maintenance-msg"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Nhập thông báo bảo trì..."
                  rows={2}
                  className="text-sm"
                />
              </div>

            </CardContent>
          </Card>

          {/* System Policy Card */}
          <Card className="border-2 border-dashed border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Chính sách hệ thống</CardTitle>
                  <CardDescription className="text-xs">
                    Nội dung chính sách người dùng cần đồng ý khi đăng nhập / đăng ký.
                  </CardDescription>
                  {policyUpdatedAt && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Cập nhật: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Policy preview */}
              <div className="rounded-lg border bg-muted/30 p-3 max-h-[220px] overflow-y-auto">
                {policyContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                    <ReactMarkdown>{policyContent}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Chưa có nội dung chính sách</p>
                )}
              </div>

              <Button onClick={handleOpenPolicyEditor} className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa chính sách
              </Button>
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

          <div className="flex-1 overflow-hidden grid grid-cols-[1fr_1fr] divide-x">
            {/* Editor */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Soạn thảo
                </span>
              </div>
              <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
                <Textarea
                  value={editPolicyContent}
                  onChange={(e) => setEditPolicyContent(e.target.value)}
                  placeholder={"# Chính sách hệ thống\n\n## 1. Quy tắc chung\n- Không chia sẻ tài khoản...\n\n## 2. Bảo mật thông tin\n..."}
                  className="font-mono text-sm flex-1 resize-none"
                />
                {/* Markdown guide */}
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn Markdown
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span><code className="bg-muted px-1 rounded text-[11px]">**text**</code> → <strong>in đậm</strong></span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">*text*</code> → <em>in nghiêng</em></span>
                    <span><code className="bg-muted px-1 rounded text-[11px]"># Tiêu đề lớn</code> → <span className="font-bold">H1</span></span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">## Tiêu đề phụ</code> → <span className="font-semibold">H2</span></span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">### Mục nhỏ</code> → <span className="font-medium">H3</span></span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">- mục 1</code> → danh sách</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">1. mục 1</code> → danh sách số</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">[text](url)</code> → liên kết</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">---</code> → đường kẻ ngang</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">&gt; trích dẫn</code> → blockquote</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">Enter 2 lần</code> → xuống đoạn</span>
                    <span><code className="bg-muted px-1 rounded text-[11px]">2 space + Enter</code> → xuống hàng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Xem trước
                </span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-primary prose-h1:text-2xl prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-3 prose-h2:text-lg prose-h2:mt-6 prose-a:text-accent prose-strong:text-foreground">
                  {editPolicyContent ? (
                    <ReactMarkdown>{editPolicyContent}</ReactMarkdown>
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

          <DialogFooter className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center">
            <p className="text-[10px] text-muted-foreground mr-auto">© UEH Teamworks</p>
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
