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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Wrench, AlertTriangle } from 'lucide-react';

export default function AdminSystem() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Hệ thống đang bảo trì, vui lòng quay lại sau.');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchSettings();
  }, [isAdmin, isLoading]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .maybeSingle();

      if (data?.value) {
        const val = data.value as { enabled?: boolean; message?: string };
        setMaintenanceEnabled(val.enabled ?? false);
        setMaintenanceMessage(val.message ?? 'Hệ thống đang bảo trì, vui lòng quay lại sau.');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: { enabled: maintenanceEnabled, message: maintenanceMessage },
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'maintenance_mode');

      if (error) throw error;

      toast({
        title: 'Đã lưu cài đặt',
        description: maintenanceEnabled
          ? 'Chế độ bảo trì đã được BẬT. Tất cả người dùng khác sẽ bị chặn truy cập.'
          : 'Chế độ bảo trì đã TẮT. Hệ thống hoạt động bình thường.',
      });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể lưu cài đặt', variant: 'destructive' });
    } finally {
      setSaving(false);
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

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
