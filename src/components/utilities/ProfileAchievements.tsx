import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, ExternalLink, Image, Loader2, GripVertical, Pencil } from 'lucide-react';

const CATEGORIES = [
  { value: 'academic', label: 'Học tập' },
  { value: 'activity', label: 'Hoạt động' },
  { value: 'skill', label: 'Kỹ năng & Chứng chỉ' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'general', label: 'Khác' },
];

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  storage_name: string | null;
  link_url: string | null;
  category: string;
  display_order: number;
}

export default function ProfileAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadAchievements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profile_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });
    setAchievements((data as Achievement[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAchievements(); }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setCategory('general');
    setImagePreview(null);
    setImageFile(null);
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (a: Achievement) => {
    setEditing(a);
    setTitle(a.title);
    setDescription(a.description || '');
    setLinkUrl(a.link_url || '');
    setCategory(a.category);
    if (a.image_path) {
      const { data } = supabase.storage.from('profile-achievements').getPublicUrl(a.image_path);
      setImagePreview(data.publicUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File quá lớn', description: 'Tối đa 5MB', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<{ path: string; storageName: string } | null> => {
    if (!imageFile || !user) return null;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const storageName = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('profile-achievements')
      .upload(storageName, imageFile, { upsert: true });
    setUploading(false);
    if (error) {
      toast({ title: 'Lỗi upload', description: error.message, variant: 'destructive' });
      return null;
    }
    return { path: storageName, storageName };
  };

  const handleSave = async () => {
    if (!user || !title.trim()) {
      toast({ title: 'Vui lòng nhập tiêu đề', variant: 'destructive' });
      return;
    }
    setSaving(true);

    let imagePath = editing?.image_path || null;
    let storageName = editing?.storage_name || null;

    if (imageFile) {
      // Delete old image if replacing
      if (editing?.image_path) {
        await supabase.storage.from('profile-achievements').remove([editing.image_path]);
      }
      const result = await uploadImage();
      if (result) {
        imagePath = result.path;
        storageName = result.storageName;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_path: imagePath,
      storage_name: storageName,
      link_url: linkUrl.trim() || null,
      category,
    };

    if (editing) {
      const { error } = await supabase
        .from('profile_achievements')
        .update(payload)
        .eq('id', editing.id);
      if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      else toast({ title: 'Đã cập nhật!' });
    } else {
      const { error } = await supabase
        .from('profile_achievements')
        .insert({ ...payload, user_id: user.id, display_order: achievements.length });
      if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      else toast({ title: 'Đã thêm thành tích!' });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    loadAchievements();
  };

  const handleDelete = async (a: Achievement) => {
    if (!confirm(`Xóa thành tích "${a.title}"?`)) return;
    if (a.image_path) {
      await supabase.storage.from('profile-achievements').remove([a.image_path]);
    }
    await supabase.from('profile_achievements').delete().eq('id', a.id);
    toast({ title: 'Đã xóa' });
    loadAchievements();
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('profile-achievements').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: achievements.filter(a => a.category === cat.value),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Thành tích & Chứng chỉ</h2>
          <p className="text-sm text-muted-foreground">Quản lý thành tích hiển thị trên trang cá nhân công khai</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />Thêm
        </Button>
      </div>

      {achievements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Chưa có thành tích nào</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1.5" />Thêm thành tích đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="grid gap-3">
                {group.items.map(a => (
                  <Card key={a.id} className="overflow-hidden">
                    <div className="flex gap-4 p-4">
                      {a.image_path && (
                        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <img src={getImageUrl(a.image_path)} alt={a.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium truncate">{a.title}</h4>
                            {a.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {a.link_url && (
                          <a href={a.link_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                            <ExternalLink className="w-3 h-3" />Xem liên kết
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { resetForm(); } setDialogOpen(v); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa thành tích' : 'Thêm thành tích mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Giải nhất cuộc thi..." maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn về thành tích..." rows={2} maxLength={500} />
            </div>
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ảnh minh họa</Label>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => fileInputRef.current?.click()}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => { setImagePreview(null); setImageFile(null); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-24 border-dashed" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Tải ảnh lên (tối đa 5MB)</span>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Liên kết</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
