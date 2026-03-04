import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminBackupRestore from '@/components/AdminBackupRestore';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, Upload, FolderArchive, Settings, File, MessageSquare, 
  FileText, MessageCircle, FolderOpen, History, Award, Bug, 
  HelpCircle, Shield, AlertTriangle, CheckCircle, Database,
  Clock, Zap, Lock
} from 'lucide-react';

export default function AdminBackup() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Bạn không có quyền truy cập trang này</p>
        </div>
      </DashboardLayout>
    );
  }

  const backupFeatures = [
    { icon: Settings, label: 'Thông tin project' },
    { icon: File, label: 'File đính kèm' },
    { icon: MessageSquare, label: 'Tin nhắn' },
    { icon: FileText, label: 'Ghi chú task' },
    { icon: MessageCircle, label: 'Bình luận task' },
    { icon: FolderOpen, label: 'Tài nguyên dự án' },
    { icon: History, label: 'Nhật ký hoạt động' },
    { icon: Award, label: 'Điểm số đầy đủ' },
    { icon: Bug, label: 'Lịch sử điều chỉnh' },
    { icon: HelpCircle, label: 'Phản hồi & bình luận' },
    { icon: Shield, label: 'Kiểm tra toàn vẹn' },
    { icon: FolderArchive, label: 'Phân loại thư mục' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Sao lưu & Khôi phục
            <span className="text-xs font-normal text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">v5.0</span>
          </h1>
          <p className="text-muted-foreground">Quản lý sao lưu và khôi phục dữ liệu project</p>
        </div>

        {/* CTA Button - prominent */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative">
          <CardContent className="pt-6 pb-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <FolderArchive className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Bắt đầu sao lưu hoặc khôi phục</h2>
                <p className="text-sm text-muted-foreground">Chọn project, tùy chỉnh nội dung và xuất/nhập dữ liệu toàn diện</p>
              </div>
            </div>
            <AdminBackupRestore />
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup info */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Sao lưu Project</h3>
                  <p className="text-xs text-muted-foreground">Xuất toàn bộ dữ liệu project ra file ZIP</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-2 text-foreground">Nội dung được sao lưu:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {backupFeatures.map(({ icon: Icon, label }, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-emerald-500" /> {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restore info */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Khôi phục Project</h3>
                  <p className="text-xs text-muted-foreground">Nhập dữ liệu từ file ZIP backup</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  <p className="font-medium mb-2">Lưu ý quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dữ liệu sẽ được tạo thành project mới</li>
                    <li>Admin hiện tại sẽ trở thành Leader</li>
                    <li>Kiểm tra toàn vẹn tự động (v5.0+)</li>
                    <li>Thành viên sẽ được liên kết theo MSSV</li>
                    <li>Hỗ trợ file .zip từ hệ thống sao lưu v5.0</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Sao lưu toàn diện</h4>
                <p className="text-xs text-muted-foreground">Hỗ trợ 12+ loại dữ liệu bao gồm task, tin nhắn, điểm số, file đính kèm và nhật ký hoạt động.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Kiểm tra toàn vẹn</h4>
                <p className="text-xs text-muted-foreground">Tự động kiểm tra checksum và đối chiếu số lượng bản ghi trước khi khôi phục để đảm bảo dữ liệu chính xác.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Theo dõi thời gian thực</h4>
                <p className="text-xs text-muted-foreground">Hiển thị tiến trình chi tiết từng bước, cho phép hủy giữa chừng và báo cáo tổng kết sau khi hoàn tất.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Quy trình hoạt động
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backup flow */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-500" /> Sao lưu
                </p>
                <div className="space-y-2 pl-6 border-l-2 border-emerald-500/20">
                  {[
                    'Chọn project cần sao lưu',
                    'Tùy chỉnh nội dung (tin nhắn, điểm, tài nguyên...)',
                    'Hệ thống tải và đóng gói dữ liệu',
                    'Kiểm tra tính toàn vẹn & tạo manifest',
                    'Xuất file ZIP kèm báo cáo PDF minh chứng',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">{i + 1}</span>
                      <span className="text-xs text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restore flow */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-500" /> Khôi phục
                </p>
                <div className="space-y-2 pl-6 border-l-2 border-amber-500/20">
                  {[
                    'Chọn file ZIP từ hệ thống sao lưu',
                    'Kiểm tra toàn vẹn dữ liệu (checksum)',
                    'Tạo project mới & liên kết thành viên theo MSSV',
                    'Khôi phục task, điểm số, tin nhắn, file...',
                    'Báo cáo tổng kết kết quả khôi phục',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">{i + 1}</span>
                      <span className="text-xs text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security note */}
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Bảo mật & Quyền riêng tư</h4>
              <p className="text-xs text-muted-foreground">
                File sao lưu được tạo và tải về trực tiếp trên trình duyệt, không qua máy chủ trung gian. 
                Chỉ Admin mới có quyền truy cập chức năng này. Dữ liệu nhạy cảm được bảo vệ theo chính sách bảo mật hệ thống.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
