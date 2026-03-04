import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Folder,
  Hash,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceItem {
  id: string;
  name: string;
  file_path: string;
  category: string | null;
  folder_name?: string;
}

interface ResourceTagTextareaProps {
  value: string;
  onChange: (value: string) => void;
  groupId: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
  fillHeight?: boolean;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-4 h-4';
  
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

export default function ResourceTagTextarea({
  value,
  onChange,
  groupId,
  placeholder = 'Nhập mô tả... (gõ # để tham chiếu tài nguyên)',
  className,
  minHeight = '80px',
  disabled = false,
  fillHeight = false,
}: ResourceTagTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ResourceItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // Fetch resources on mount
  useEffect(() => {
    if (!groupId) return;
    
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        // Fetch resources
        const { data: resourcesData } = await supabase
          .from('project_resources')
          .select('id, name, file_path, category, folder_id')
          .eq('group_id', groupId)
          .order('name', { ascending: true });

        // Fetch folders
        const { data: foldersData } = await (supabase
          .from('resource_folders' as any)
          .select('id, name')
          .eq('group_id', groupId) as any);

        const foldersMap = new Map<string, string>((foldersData || []).map((f: any) => [f.id, f.name]));

        const items: ResourceItem[] = (resourcesData || []).map(r => ({
          id: r.id,
          name: r.name,
          file_path: r.file_path,
          category: r.category,
          folder_name: (r as any).folder_id ? (foldersMap.get((r as any).folder_id) || undefined) : undefined
        }));

        setResources(items);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [groupId]);

  // Detect # trigger
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    
    // Find last # before cursor
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const searchText = textBeforeCursor.substring(lastHashIndex + 1).toLowerCase();
    
    // Check if there's a space before the # (or it's at start)
    const charBefore = lastHashIndex > 0 ? textBeforeCursor[lastHashIndex - 1] : ' ';
    if (charBefore !== ' ' && charBefore !== '\n') {
      setShowSuggestions(false);
      return;
    }

    // Don't show if search text has newlines
    if (searchText.includes('\n')) {
      setShowSuggestions(false);
      return;
    }

    setTriggerStart(lastHashIndex);

    // Filter resources
    const filtered = resources.filter(r => 
      r.name.toLowerCase().includes(searchText) ||
      (r.folder_name && r.folder_name.toLowerCase().includes(searchText))
    ).slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 || isLoading);
    setSelectedIndex(0);

    // Calculate popup position based on textarea
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setPopupPosition({
        top: -10, // Above the textarea
        left: 0
      });
    }
  }, [value, resources, isLoading]);

  const handleSelectSuggestion = (resource: ResourceItem) => {
    if (triggerStart === -1) return;

    const beforeTrigger = value.substring(0, triggerStart);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const afterCursor = value.substring(cursorPos);

    // Insert as short reference to avoid long URLs in the textarea
    // File preview will resolve res:<id> to the actual URL.
    const insertText = `[#${resource.name}](res:${resource.id}) `;

    const newValue = beforeTrigger + insertText + afterCursor;
    onChange(newValue);
    setShowSuggestions(false);

    // Focus and move cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeTrigger.length + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className={cn("relative", fillHeight && "flex-1 flex flex-col min-h-0")}>
      {/* Suggestions Popup - Compact */}
      {showSuggestions && (
        <Card 
          className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden z-50 shadow-lg border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-100"
        >
          <div className="px-2 py-1.5 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Tài nguyên
            </span>
            <span className="text-[9px] text-muted-foreground">↑↓ chọn • Enter chèn</span>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-3 text-xs text-muted-foreground">
                Không tìm thấy
              </div>
            ) : (
              suggestions.map((resource, index) => (
                <button
                  key={resource.id}
                  type="button"
                  className={cn(
                    'w-full text-left px-2 py-1.5 flex items-center gap-2 transition-colors text-xs',
                    index === selectedIndex 
                      ? 'bg-primary/10' 
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelectSuggestion(resource)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="shrink-0">{getFileIcon(resource.name)}</span>
                  <span className="truncate flex-1 font-medium">{resource.name}</span>
                  {resource.folder_name && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px] flex items-center gap-0.5">
                      <Folder className="w-2.5 h-2.5" />
                      {resource.folder_name}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none text-sm', fillHeight && 'flex-1', className)}
        style={{ minHeight: fillHeight ? undefined : minHeight }}
        disabled={disabled}
      />

      {/* Helper text - minimal */}
      <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
        <Hash className="w-2.5 h-2.5" /> Gõ # để chèn tài nguyên
      </p>
    </div>
  );
}
