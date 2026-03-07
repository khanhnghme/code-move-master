import { Button } from '@/components/ui/button';
import { Wrench, LogOut, Mail, Clock, CalendarClock } from 'lucide-react';
import uehLogo from '@/assets/ueh-logo-new.png';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MaintenanceScreenProps {
  message?: string;
  endAt?: string | null;
  onSignOut?: () => void;
}

const ADMIN_EMAIL = 'khanhngh.ueh@gmail.com';

export default function MaintenanceScreen({ message, endAt, onSignOut }: MaintenanceScreenProps) {
  const formattedEnd = endAt ? format(new Date(endAt), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi }) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={uehLogo} alt="UEH logo" className="h-8 w-auto drop-shadow-md" loading="lazy" />
            <div className="hidden sm:block h-8 w-px bg-primary-foreground/30" />
            <span className="hidden sm:block font-heading font-semibold text-lg">Teamworks UEH</span>
          </div>
          {onSignOut && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
            {/* Accent strip */}
            <div className="h-1 bg-warning" />

            <div className="p-8 space-y-6">
              {/* Icon + Title */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto">
                  <Wrench className="w-10 h-10 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground">Hệ thống đang bảo trì</h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Hệ thống hiện đang được bảo trì để nâng cấp và cải thiện hiệu suất.
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="rounded-xl bg-warning/5 border border-warning/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-1.5">Thông báo</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {message || 'Hệ thống đang bảo trì, vui lòng quay lại sau.'}
                </p>
              </div>

              {/* Status */}
              <div className="rounded-xl bg-secondary p-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Trạng thái</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                  </span>
                  <p className="text-lg font-bold text-foreground">Đang bảo trì</p>
                </div>
                {formattedEnd ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="w-4 h-4" />
                    <span>Dự kiến mở lại: <span className="font-semibold text-foreground">{formattedEnd}</span></span>
                  </div>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    Hệ thống sẽ tự động hoạt động trở lại khi quá trình bảo trì hoàn tất.
                  </p>
                )}
              </div>

              {/* Contact Admin */}
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Cần hỗ trợ?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Liên hệ Admin nếu bạn có thắc mắc về quá trình bảo trì.
                    </p>
                    <a
                      href={`mailto:${ADMIN_EMAIL}`}
                      className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-accent hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {ADMIN_EMAIL}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/30 px-8 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                © 2025 Teamworks UEH — Đại học Kinh tế TP. Hồ Chí Minh
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
