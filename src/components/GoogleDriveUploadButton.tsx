import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  loadGoogleScripts,
  requestAccessToken,
  openPicker,
  setFilePublicAccess,
  type DriveFile,
} from '@/lib/googleDrive';

export interface DriveFileResult {
  name: string;
  url: string;
  size: number;
  driveFileId: string;
  mimeType: string;
}

interface GoogleDriveUploadButtonProps {
  onFilesSelected: (files: DriveFileResult[]) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

interface GoogleDriveConfig {
  enabled: boolean;
  api_key: string;
  client_id: string;
}

export default function GoogleDriveUploadButton({
  onFilesSelected,
  disabled = false,
  className,
  variant = 'outline',
  size = 'default',
  children,
}: GoogleDriveUploadButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'google_drive_config')
        .maybeSingle();

      if (data?.value) {
        const val = data.value as unknown as GoogleDriveConfig;
        if (val.enabled && val.api_key && val.client_id) {
          setConfig(val);
        }
      }
    } catch (err) {
      console.error('Failed to load Google Drive config:', err);
    } finally {
      setConfigLoaded(true);
    }
  };

  if (!configLoaded || !config) return null;

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      // Load Google scripts
      await loadGoogleScripts();

      // Get OAuth token
      const accessToken = await requestAccessToken(config.client_id);

      // Open picker
      const pickedFiles = await openPicker(config.api_key, accessToken);
      if (pickedFiles.length === 0) {
        setLoading(false);
        return;
      }

      // Set sharing permissions and get public links
      const results: DriveFileResult[] = [];
      for (const file of pickedFiles) {
        const shareUrl = await setFilePublicAccess(accessToken, file.id);
        results.push({
          name: file.name,
          url: shareUrl,
          size: file.size,
          driveFileId: file.id,
          mimeType: file.mimeType,
        });
      }

      onFilesSelected(results);
      toast({
        title: 'Google Drive',
        description: `Đã chọn ${results.length} file từ Google Drive`,
      });
    } catch (err: any) {
      console.error('Google Drive error:', err);
      if (!err.message?.includes('popup_closed')) {
        toast({
          title: 'Lỗi Google Drive',
          description: err.message || 'Không thể kết nối Google Drive',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
          <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L3.2 45.15c-.8 1.4-1.2 2.95-1.2 4.5h27.5L43.65 25z" fill="#00AC47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3 7.8 13.5z" fill="#EA4335"/>
          <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25z" fill="#00832D"/>
          <path d="M59.8 49.65H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.5c1.6 0 3.15-.45 4.5-1.2L59.8 49.65z" fill="#2684FC"/>
          <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 24.65h27.5c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#FFBA00"/>
        </svg>
      )}
      {children || 'Google Drive'}
    </Button>
  );
}
