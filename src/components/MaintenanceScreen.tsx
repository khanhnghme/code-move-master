import { Wrench } from 'lucide-react';
import uehLogo from '@/assets/ueh-logo-new.png';

interface MaintenanceScreenProps {
  message?: string;
  onSignOut?: () => void;
}

export default function MaintenanceScreen({ message, onSignOut }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <img src={uehLogo} alt="UEH Logo" className="h-16 w-auto mx-auto opacity-60" />

        <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto">
          <Wrench className="w-12 h-12 text-warning" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Hệ thống đang bảo trì</h1>
          <p className="text-muted-foreground">
            {message || 'Hệ thống đang bảo trì, vui lòng quay lại sau.'}
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Nếu bạn có thắc mắc, vui lòng liên hệ Admin để biết thêm chi tiết.
          </p>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-sm text-primary hover:underline"
          >
            Đăng xuất
          </button>
        )}
      </div>
    </div>
  );
}
