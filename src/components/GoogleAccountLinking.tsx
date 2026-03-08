import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Loader2, Link2, Unlink, Chrome } from 'lucide-react';

export function GoogleAccountLinking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const googleIdentity = user?.identities?.find(i => i.provider === 'google');
  const hasMultipleIdentities = (user?.identities?.length ?? 0) > 1;
  const googleEmail = googleIdentity?.identity_data?.email;

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/personal-info',
        },
      });
      if (error) throw error;
      // Will redirect to Google
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      setIsLinking(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    if (!hasMultipleIdentities) {
      toast({
        title: 'Không thể hủy liên kết',
        description: 'Bạn cần có ít nhất một phương thức đăng nhập khác (email/mật khẩu) trước khi hủy liên kết Google.',
        variant: 'destructive',
      });
      return;
    }
    setIsUnlinking(true);
    try {
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã hủy liên kết tài khoản Google.' });
      // Refresh page to reflect changes
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Tài khoản liên kết
        </CardTitle>
        <CardDescription>Liên kết tài khoản Google để đăng nhập nhanh hơn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-background border shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Google</p>
              {googleIdentity ? (
                <p className="text-xs text-muted-foreground">{googleEmail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Chưa liên kết</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {googleIdentity ? (
              <>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
                  Đã liên kết
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlinkGoogle}
                  disabled={isUnlinking || !hasMultipleIdentities}
                  title={!hasMultipleIdentities ? 'Cần có phương thức đăng nhập khác để hủy liên kết' : 'Hủy liên kết Google'}
                >
                  {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="gap-1.5"
              >
                {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Liên kết ngay
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
