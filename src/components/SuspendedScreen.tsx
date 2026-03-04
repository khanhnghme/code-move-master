import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Clock, Mail, LogOut, ShieldAlert, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import uehLogo from '@/assets/ueh-logo-new.png';

interface SuspendedScreenProps {
  suspendedUntil: string;
  suspensionReason: string | null;
  onSignOut: () => void;
  onUnlocked: () => void;
}

const ADMIN_EMAIL = 'khanhngh.ueh@gmail.com';

export default function SuspendedScreen({ suspendedUntil, suspensionReason, onSignOut, onUnlocked }: SuspendedScreenProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [timeString, setTimeString] = useState('');
  const isPermanent = new Date(suspendedUntil).getFullYear() >= 2099;

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const end = new Date(suspendedUntil).getTime();
      const diff = end - now;

      if (diff <= 0 && !isPermanent) {
        onUnlocked();
        return;
      }

      if (isPermanent) {
        setTimeString('Vĩnh viễn');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });

      const parts: string[] = [];
      if (days > 0) parts.push(`${days} ngày`);
      if (hours > 0) parts.push(`${hours} giờ`);
      if (minutes > 0) parts.push(`${minutes} phút`);
      parts.push(`${seconds} giây`);
      setTimeString(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [suspendedUntil, isPermanent, onUnlocked]);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('profiles')
        .select('suspended_until')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!data?.suspended_until || new Date(data.suspended_until).getTime() <= Date.now()) {
        onUnlocked();
      }
    };
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [onUnlocked]);

  const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="text-2xl font-bold font-mono text-primary">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — same style as Landing */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={uehLogo} alt="UEH logo" className="h-8 w-auto drop-shadow-md" loading="lazy" />
            <div className="hidden sm:block h-8 w-px bg-primary-foreground/30" />
            <span className="hidden sm:block font-heading font-semibold text-lg">Teamworks UEH</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
            {/* Accent strip */}
            <div className="h-1 bg-destructive" />

            <div className="p-8 space-y-6">
              {/* Icon + Title */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-10 h-10 text-destructive" />
                </div>
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground">Tài khoản bị tạm khóa</h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Tài khoản của bạn đã bị tạm khóa bởi quản trị viên hệ thống.
                  </p>
                </div>
              </div>

              {/* Reason */}
              {suspensionReason && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1.5">Lý do</p>
                  <p className="text-sm text-foreground leading-relaxed">{suspensionReason}</p>
                </div>
              )}

              {/* Countdown */}
              <div className="rounded-xl bg-secondary p-5 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Thời gian còn lại</span>
                </div>

                {isPermanent ? (
                  <p className="text-3xl font-bold font-mono text-center text-foreground">Vĩnh viễn</p>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <CountdownBlock value={timeLeft.days} label="Ngày" />
                    <span className="text-xl font-bold text-primary/40 mt-[-18px]">:</span>
                    <CountdownBlock value={timeLeft.hours} label="Giờ" />
                    <span className="text-xl font-bold text-primary/40 mt-[-18px]">:</span>
                    <CountdownBlock value={timeLeft.minutes} label="Phút" />
                    <span className="text-xl font-bold text-primary/40 mt-[-18px]">:</span>
                    <CountdownBlock value={timeLeft.seconds} label="Giây" />
                  </div>
                )}

                {!isPermanent && (
                  <p className="text-xs text-center text-muted-foreground">
                    Mở khóa lúc: <span className="font-medium text-foreground">{new Date(suspendedUntil).toLocaleString('vi-VN')}</span>
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
                      Liên hệ Admin để được hỗ trợ mở khóa tài khoản trước hạn.
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
