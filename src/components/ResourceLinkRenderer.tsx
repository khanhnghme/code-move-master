import { useNavigate } from 'react-router-dom';
import { useFilePreview } from '@/contexts/FilePreviewContext';
import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceLinkRendererProps {
  content: string;
  className?: string;
  /** max width for displayed file name inside the chip */
  nameMaxWidth?: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-3.5 h-3.5';
  
  switch (ext) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-red-500')} />;
    case 'doc':
    case 'docx':
      return <FileText className={cn(iconClass, 'text-blue-500')} />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className={cn(iconClass, 'text-green-500')} />;
    case 'ppt':
    case 'pptx':
      return <Presentation className={cn(iconClass, 'text-orange-500')} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <ImageIcon className={cn(iconClass, 'text-purple-500')} />;
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
      return <Video className={cn(iconClass, 'text-pink-500')} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music className={cn(iconClass, 'text-cyan-500')} />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className={cn(iconClass, 'text-amber-500')} />;
    default:
      return <File className={cn(iconClass, 'text-muted-foreground')} />;
  }
}

// Extract filename from a storage URL
function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return decodeURIComponent(fileName);
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'file';
  }
}

// Clean up filename for display
function cleanFileName(name: string): string {
  // Remove # prefix if present
  let cleaned = name.startsWith('#') ? name.slice(1) : name;
  
  // If it looks like a storage name (timestamp-randomchars.ext), extract just extension
  const storagePattern = /^\d{13}-[a-z0-9]+\./i;
  if (storagePattern.test(cleaned)) {
    const ext = cleaned.split('.').pop();
    return `file.${ext}`;
  }
  
  return cleaned;
}

export default function ResourceLinkRenderer({ content, className, nameMaxWidth = '180px' }: ResourceLinkRendererProps) {
  const navigate = useNavigate();
  const { openFilePreview } = useFilePreview();
  
  if (!content) return null;
  
  interface MatchInfo {
    start: number;
    end: number;
    fileName: string;
    url: string;
  }
  
  const allMatches: MatchInfo[] = [];
  
  // Pattern 1: [#filename](url) - markdown style
  // Also supports short references: [#name](res:<uuid>)
  const markdownRegex = /\[#([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      fileName: match[1],
      url: match[2]
    });
  }
  
  // Pattern 2: Standalone (https://...supabase...storage...) - parenthesized URLs  
  const parenUrlRegex = /\((https:\/\/[^)]*supabase[^)]*\/storage\/[^)]+)\)/g;
  while ((match = parenUrlRegex.exec(content)) !== null) {
    const overlaps = allMatches.some(m => 
      (match!.index >= m.start && match!.index < m.end) ||
      (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        fileName: extractFileNameFromUrl(match[1]),
        url: match[1]
      });
    }
  }
  
  // Pattern 3: Raw supabase storage URLs
  const rawUrlRegex = /(https:\/\/[^\s]*supabase[^\s]*\/storage\/v1\/object\/[^\s\])]+)/g;
  while ((match = rawUrlRegex.exec(content)) !== null) {
    const overlaps = allMatches.some(m => 
      (match!.index >= m.start && match!.index < m.end) ||
      (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        fileName: extractFileNameFromUrl(match[1]),
        url: match[1]
      });
    }
  }
  
  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Build parts
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  allMatches.forEach((m, idx) => {
    if (m.start > lastIndex) {
      parts.push(content.slice(lastIndex, m.start));
    }
    
    const displayName = cleanFileName(m.fileName);
    
    // Clickable card/chip
    parts.push(
        <button
        key={`resource-${idx}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const params = new URLSearchParams();
            if (m.url.startsWith('res:')) {
              params.set('rid', m.url.slice('res:'.length));
            } else {
              params.set('url', m.url);
            }
          params.set('name', displayName);
          params.set('source', 'resource');
          openFilePreview(`/file-preview?${params.toString()}`);
        }}
        className="inline-flex items-center gap-1.5 px-2 py-1 my-0.5 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer shadow-sm"
        title={`Xem: ${displayName}`}
      >
        {getFileIcon(displayName)}
          <span className="truncate" style={{ maxWidth: nameMaxWidth }}>{displayName}</span>
        <ExternalLink className="w-3 h-3 opacity-50" />
      </button>
    );
    
    lastIndex = m.end;
  });
  
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }
  
  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {parts.map((part, index) => 
        typeof part === 'string' ? <span key={index}>{part}</span> : part
      )}
    </span>
  );
}
