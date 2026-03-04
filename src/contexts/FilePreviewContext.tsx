import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Maximize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FilePreviewContextType {
  openFilePreview: (url: string) => void;
  closeFilePreview: () => void;
}

const FilePreviewContext = createContext<FilePreviewContextType | null>(null);

export function useFilePreview() {
  const ctx = useContext(FilePreviewContext);
  if (!ctx) throw new Error('useFilePreview must be used within FilePreviewProvider');
  return ctx;
}

export function FilePreviewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const openFilePreview = useCallback((url: string) => {
    setPreviewUrl(url);
    setIsOpen(true);
  }, []);

  const closeFilePreview = useCallback(() => {
    setIsOpen(false);
    setPreviewUrl('');
  }, []);

  // Listen for close messages from iframe (FilePreview "Quay lại" button)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'close-file-preview') {
        closeFilePreview();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [closeFilePreview]);

  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <FilePreviewContext.Provider value={{ openFilePreview, closeFilePreview }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeFilePreview(); }}>
        <DialogContent
          className="max-w-[96vw] w-[96vw] h-[94vh] max-h-[94vh] p-0 gap-0 overflow-hidden rounded-xl border-0 shadow-2xl [&>button:last-child]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Full-size iframe - loads the exact FilePreview page */}
          <div className="w-full h-full relative">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 rounded-xl"
                title="File Preview"
              />
            )}
            {/* Floating button - open in new tab */}
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenInNewTab}
                className="gap-2 shadow-lg border bg-background/95 backdrop-blur-sm hover:bg-background text-xs font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở trong tab mới
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FilePreviewContext.Provider>
  );
}
