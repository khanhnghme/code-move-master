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
import { Shield, Wrench, AlertTriangle, FileText, Clock, Save, Edit, CheckCircle2 } from 'lucide-react';
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

              <Button
                onClick={() => setShowMaintenanceConfirm(true)}
                disabled={saving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Xác nhận thay đổi
              </Button>
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
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveMaintenance} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Policy Editor Dialog - 16:9 */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[1280px] h-[720px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-5 py-3 border-b bg-primary/5 shrink-0">
            <div className="flex items-center gap-3">
              <UEHLogo width={40} />
              <div>
                <DialogTitle className="text-lg font-bold">Chính sách hệ thống</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Soạn thảo nội dung chính sách (hỗ trợ Markdown)
                  {policyUpdatedAt && (
                    <> · Cập nhật lần cuối: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm dd/MM/yyyy", { locale: vi })}</span></>
                  )}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x">
            {/* Editor */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Soạn thảo
                </span>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <Textarea
                  value={editPolicyContent}
                  onChange={(e) => setEditPolicyContent(e.target.value)}
                  placeholder={"# Chính sách hệ thống\n\n## 1. Quy tắc chung\n- Không chia sẻ tài khoản...\n\n## 2. Bảo mật thông tin\n..."}
                  className="font-mono text-sm h-full resize-none"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Xem trước
                </span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {editPolicyContent ? (
                    <ReactMarkdown>{editPolicyContent}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">Nhập nội dung bên trái để xem trước...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 py-3 border-t bg-muted/30 shrink-0">
            <p className="text-xs text-muted-foreground mr-auto">
              Sử dụng **in đậm**, *in nghiêng*, ## tiêu đề, - danh sách
            </p>
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
