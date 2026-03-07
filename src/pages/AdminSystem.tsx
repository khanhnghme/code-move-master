import { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Wrench, AlertTriangle, FileText, Clock, Save } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

  // Policy state
  const [policyContent, setPolicyContent] = useState('');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

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
    }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: { content: policyContent, updated_at: now },
          updated_at: now,
        })
        .eq('key', 'system_policy');

      if (error) throw error;
      setPolicyUpdatedAt(now);
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
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground text-sm">Các chức năng quản trị đặc biệt dành cho Admin chính</p>
          </div>
        </div>

        {/* Maintenance Mode Card */}
        <Card className="border-2 border-dashed border-warning/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Wrench className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  Khóa hệ thống (Maintenance Mode)
                  {maintenanceEnabled && (
                    <Badge variant="destructive" className="text-xs">ĐANG BẬT</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Khi bật, toàn bộ thành viên sẽ không thể truy cập hệ thống. Chỉ Admin chính vẫn đăng nhập và sử dụng được.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${maintenanceEnabled ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium text-sm">Trạng thái bảo trì</p>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceEnabled ? 'Hệ thống đang bị khóa cho tất cả người dùng' : 'Hệ thống đang hoạt động bình thường'}
                  </p>
                </div>
              </div>
              <Switch
                checked={maintenanceEnabled}
                onCheckedChange={setMaintenanceEnabled}
              />
            </div>

            {/* Scheduled time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-start" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Thời gian bắt đầu (tùy chọn)
                </Label>
                <Input
                  id="maintenance-start"
                  type="datetime-local"
                  value={maintenanceStart}
                  onChange={(e) => setMaintenanceStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance-end" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Thời gian kết thúc (tự động mở)
                </Label>
                <Input
                  id="maintenance-end"
                  type="datetime-local"
                  value={maintenanceEnd}
                  onChange={(e) => setMaintenanceEnd(e.target.value)}
                />
              </div>
            </div>
            {maintenanceEnd && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                ⏱ Hệ thống sẽ tự động mở lại vào <span className="font-semibold text-foreground">{format(new Date(maintenanceEnd), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}</span>
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="maintenance-msg">Thông báo hiển thị cho người dùng</Label>
              <Textarea
                id="maintenance-msg"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Nhập thông báo bảo trì..."
                rows={3}
              />
            </div>

            <Button onClick={handleSaveMaintenance} disabled={saving} className="w-full">
              {saving ? 'Đang lưu...' : 'Lưu cài đặt bảo trì'}
            </Button>
          </CardContent>
        </Card>

        {/* System Policy Card */}
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Chính sách hệ thống</CardTitle>
                <CardDescription>
                  Soạn thảo nội dung chính sách mà người dùng cần đồng ý khi đăng nhập / đăng ký.
                </CardDescription>
                {policyUpdatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cập nhật lần cuối: <span className="font-medium">{format(new Date(policyUpdatedAt), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}</span>
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policy-content">Nội dung chính sách (hỗ trợ Markdown)</Label>
              <Textarea
                id="policy-content"
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                placeholder={"# Chính sách hệ thống\n\n## 1. Quy tắc chung\n- Không chia sẻ tài khoản...\n\n## 2. Bảo mật thông tin\n..."}
                rows={14}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Sử dụng cú pháp Markdown để định dạng. Ví dụ: **in đậm**, *in nghiêng*, ## tiêu đề, - danh sách.
              </p>
            </div>

            <Button onClick={handleSavePolicy} disabled={savingPolicy} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {savingPolicy ? 'Đang lưu...' : 'Lưu chính sách'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
