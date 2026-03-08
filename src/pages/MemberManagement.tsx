import { useState, useEffect, useMemo, useCallback } from 'react';
import { deleteWithUndo } from '@/lib/deleteWithUndo';
import { notifyRoleChanged } from '@/lib/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberNavigation from '@/components/MemberNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  UserPlus, 
  Users, 
  Trash2, 
  Key, 
  Mail, 
  Hash, 
  User, 
  Pencil, 
  Search,
  MoreVertical,
  Shield,
  UserCheck,
  Info,
  Download,
  Upload,
  Lock,
  Unlock,
  CheckSquare,
  X,
  Check,
  Filter,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { exportMembersToExcel, getRoleDisplayName } from '@/lib/excelExport';
import MemberDetailDialog from '@/components/MemberDetailDialog';
import MemberRoleManagementDialog from '@/components/MemberRoleManagementDialog';
import SuspendMemberDialog from '@/components/SuspendMemberDialog';
import ExcelMemberImport, { type ParsedRow, type ExcelImportAction, type ImportValidation } from '@/components/ExcelMemberImport';
import UserPresenceIndicator from '@/components/UserPresenceIndicator';
import { useUserPresence } from '@/hooks/useUserPresence';

export default function MemberManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  const { getPresenceStatus, isConnected } = useUserPresence('system-global');
  
  const [members, setMembers] = useState<Profile[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'suspend' | 'unsuspend' | 'promote' | 'demote' | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  
  // Sub-navigation state
  const [activeSubTab, setActiveSubTab] = useState('all');
  
  // Role filter for "Hoạt động" tab
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Form state - New member
  const [newEmail, setNewEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  
  // Password dialog
  const [updatePassword, setUpdatePassword] = useState('');
  
  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const isMemberAdmin = (memberId: string): boolean => {
    const roles = memberRoles[memberId] || [];
    return roles.includes('admin');
  };

  const canManageMember = (memberId: string): boolean => {
    if (memberId === user?.id) return false;
    return isAdmin;
  };

  const isMemberSuspended = (member: Profile): boolean => {
    return member.suspended_until ? new Date(member.suspended_until).getTime() > Date.now() : false;
  };

  // Derived lists
  const activeMembers = useMemo(() => members.filter(m => !isMemberSuspended(m)), [members]);
  const suspendedMembers = useMemo(() => members.filter(m => isMemberSuspended(m)), [members]);

  const navCounts = useMemo(() => ({
    all: members.length,
    active: activeMembers.length,
    pending: pendingMembers.length,
    suspended: suspendedMembers.length,
  }), [members.length, activeMembers.length, pendingMembers.length, suspendedMembers.length]);

  // Get the list for the current sub-tab
  const currentList = useMemo(() => {
    switch (activeSubTab) {
      case 'active': return activeMembers;
      case 'suspended': return suspendedMembers;
      default: return members;
    }
  }, [activeSubTab, members, activeMembers, suspendedMembers]);

  // Apply role filter (only on active tab)
  const roleFilteredList = useMemo(() => {
    if (activeSubTab !== 'active' || roleFilter === 'all') return currentList;
    return currentList.filter(m => {
      const roles = memberRoles[m.id] || [];
      switch (roleFilter) {
        case 'member': return !roles.includes('admin') && !roles.includes('leader');
        case 'leader': return roles.includes('leader') && !roles.includes('admin');
        case 'admin': return roles.includes('admin');
        default: return true;
      }
    });
  }, [activeSubTab, roleFilter, currentList, memberRoles]);

  // Apply search filter
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return roleFilteredList;
    const query = searchQuery.toLowerCase();
    return roleFilteredList.filter(m =>
      m.full_name.toLowerCase().includes(query) ||
      m.student_id.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
    );
  }, [roleFilteredList, searchQuery]);

  // Selection helpers
  const selectableMembers = filteredMembers.filter(m => canManageMember(m.id));
  const allSelectableSelected = selectableMembers.length > 0 && selectableMembers.every(m => selectedIds.has(m.id));

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    if (isAdmin) {
      fetchMembers();
      fetchPendingMembers();
    }
  }, [authLoading, isAdmin, navigate]);

  // Reset selection when changing tabs
  useEffect(() => {
    clearSelection();
    setSearchQuery('');
    setRoleFilter('all');
  }, [activeSubTab]);

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách thành viên', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    setMembers(profilesData || []);
    
    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
    if (rolesData) {
      const rolesMap: Record<string, string[]> = {};
      rolesData.forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });
      setMemberRoles(rolesMap);
    }
    
    setIsLoading(false);
  };

  const fetchPendingMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (!error && data) setPendingMembers(data as Profile[]);
  };

  const handleApprovePending = async (member: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', member.id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('user_roles').upsert({ user_id: member.id, role: 'member' }, { onConflict: 'user_id,role' } as any);
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'APPROVE_MEMBER_REGISTRATION', action_type: 'member',
      description: `Duyệt tài khoản đăng ký của ${member.full_name} (${member.student_id})`,
    });
    toast({ title: 'Đã duyệt', description: `Tài khoản ${member.full_name} đã được kích hoạt.` });
    fetchPendingMembers();
    fetchMembers();
  };

  const handleRejectPending = async (member: Profile) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete_user', user_id: member.id, requester_id: user?.id },
    });
    if (error || data?.error) { toast({ title: 'Lỗi', description: data?.error || error?.message, variant: 'destructive' }); return; }
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'REJECT_MEMBER_REGISTRATION', action_type: 'member',
      description: `Từ chối và xóa tài khoản đăng ký của ${member.full_name} (${member.student_id})`,
    });
    toast({ title: 'Đã xóa', description: `Đã xóa tài khoản ${member.full_name} khỏi hệ thống.` });
    fetchPendingMembers();
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newStudentId || !newFullName) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create_member', email: newEmail, student_id: newStudentId, full_name: newFullName }
    });
    setIsCreating(false);
    if (error || data?.error) {
      toast({ title: 'Tạo thành viên thất bại', description: data?.error || error?.message || 'Có lỗi xảy ra', variant: 'destructive' });
      return;
    }
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'CREATE_SYSTEM_MEMBER', action_type: 'member',
      description: `Tạo tài khoản hệ thống cho ${newFullName}`,
    });
    toast({ title: 'Tạo thành viên thành công', description: `Đã tạo tài khoản cho ${newFullName}. Mật khẩu mặc định: 123456` });
    setNewEmail(''); setNewStudentId(''); setNewFullName('');
    setIsDialogOpen(false);
    fetchMembers();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !updatePassword) return;
    if (updatePassword.length < 6) {
      toast({ title: 'Mật khẩu quá ngắn', description: 'Mật khẩu phải có ít nhất 6 ký tự', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update_password', user_id: selectedMember.id, password: updatePassword, requester_id: user?.id }
    });
    setIsCreating(false);
    if (error || data?.error) {
      toast({ title: 'Cập nhật mật khẩu thất bại', description: data?.error || error?.message || 'Có lỗi xảy ra', variant: 'destructive' });
      return;
    }
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'CHANGE_MEMBER_PASSWORD', action_type: 'member',
      description: `Đổi mật khẩu cho ${selectedMember.full_name}`,
    });
    toast({ title: 'Cập nhật thành công', description: `Đã đổi mật khẩu cho ${selectedMember.full_name}` });
    setUpdatePassword(''); setSelectedMember(null); setIsPasswordDialogOpen(false);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!editFullName.trim() || !editStudentId.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    const { error: profileError } = await supabase.from('profiles')
      .update({ full_name: editFullName.trim(), student_id: editStudentId.trim() })
      .eq('id', selectedMember.id);
    if (editEmail.trim() !== selectedMember.email) {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'update_email', user_id: selectedMember.id, email: editEmail.trim() }
      });
      if (error || data?.error) {
        setIsCreating(false);
        toast({ title: 'Cập nhật email thất bại', description: data?.error || error?.message || 'Có lỗi xảy ra', variant: 'destructive' });
        return;
      }
    }
    setIsCreating(false);
    if (profileError) {
      toast({ title: 'Cập nhật thất bại', description: profileError.message || 'Có lỗi xảy ra', variant: 'destructive' });
      return;
    }
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'EDIT_SYSTEM_MEMBER', action_type: 'member',
      description: `Cập nhật thông tin tài khoản ${editFullName}`,
    });
    toast({ title: 'Cập nhật thành công', description: `Đã cập nhật thông tin cho ${editFullName}` });
    setSelectedMember(null); setIsEditDialogOpen(false);
    fetchMembers();
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    const memberRef = selectedMember;
    setSelectedMember(null); setIsDeleteDialogOpen(false);
    deleteWithUndo({
      description: `Đã xóa tài khoản ${memberRef.full_name} khỏi hệ thống`,
      onDelete: async () => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: { action: 'delete_user', user_id: memberRef.id, requester_id: user?.id }
        });
        if (error || data?.error) throw new Error(data?.error || error?.message || 'Có lỗi xảy ra');
        await supabase.from('activity_logs').insert({
          user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
          action: 'DELETE_SYSTEM_MEMBER', action_type: 'member',
          description: `Xóa tài khoản ${memberRef.full_name} khỏi hệ thống`,
        });
        fetchMembers();
      },
      onUndo: () => { fetchMembers(); },
    });
  };

  const handleUnsuspend = async (member: Profile) => {
    const { error } = await supabase.from('profiles')
      .update({ suspended_until: null, suspension_reason: null, suspended_at: null, suspended_by: null })
      .eq('id', member.id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('activity_logs').insert({
      user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
      action: 'UNSUSPEND_MEMBER', action_type: 'member',
      description: `Mở khóa tài khoản ${member.full_name}`,
    });
    toast({ title: 'Đã mở khóa', description: `Tài khoản ${member.full_name} đã được mở khóa.` });
    fetchMembers();
  };

  const openEditDialog = (member: Profile) => {
    setSelectedMember(member);
    setEditFullName(member.full_name);
    setEditStudentId(member.student_id);
    setEditEmail(member.email);
    setIsEditDialogOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (allSelectableSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableMembers.map(m => m.id)));
  };
  const clearSelection = () => { setSelectedIds(new Set()); setIsSelectMode(false); };

  // Bulk actions
  const handleBulkSuspend = async () => {
    setIsBulkProcessing(true);
    const suspendedUntil = new Date(Date.now() + 86400000).toISOString();
    const ids = Array.from(selectedIds);
    const names: string[] = [];
    for (const id of ids) {
      const member = members.find(m => m.id === id);
      if (!member || isMemberSuspended(member)) continue;
      const { error } = await supabase.from('profiles').update({
        suspended_until: suspendedUntil, suspension_reason: 'Khóa hàng loạt bởi Admin',
        suspended_at: new Date().toISOString(), suspended_by: user!.id,
      }).eq('id', id);
      if (!error) names.push(member.full_name);
    }
    if (names.length > 0) {
      await supabase.from('activity_logs').insert({
        user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
        action: 'BULK_SUSPEND_MEMBERS', action_type: 'member',
        description: `Tạm khóa hàng loạt ${names.length} tài khoản: ${names.join(', ')}`,
      });
      toast({ title: 'Đã khóa hàng loạt', description: `${names.length} tài khoản đã bị tạm khóa (1 ngày).` });
    }
    setIsBulkProcessing(false); clearSelection(); setBulkAction(null); fetchMembers();
  };

  const handleBulkUnsuspend = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const names: string[] = [];
    for (const id of ids) {
      const member = members.find(m => m.id === id);
      if (!member || !isMemberSuspended(member)) continue;
      const { error } = await supabase.from('profiles').update({
        suspended_until: null, suspension_reason: null, suspended_at: null, suspended_by: null,
      }).eq('id', id);
      if (!error) names.push(member.full_name);
    }
    if (names.length > 0) {
      await supabase.from('activity_logs').insert({
        user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
        action: 'BULK_UNSUSPEND_MEMBERS', action_type: 'member',
        description: `Mở khóa hàng loạt ${names.length} tài khoản: ${names.join(', ')}`,
      });
      toast({ title: 'Đã mở khóa hàng loạt', description: `${names.length} tài khoản đã được mở khóa.` });
    }
    setIsBulkProcessing(false); clearSelection(); setBulkAction(null); fetchMembers();
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const names: string[] = [];
    for (const id of ids) {
      const member = members.find(m => m.id === id);
      if (!member) continue;
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete_user', user_id: id, requester_id: user?.id },
      });
      if (!error && !data?.error) names.push(member.full_name);
    }
    if (names.length > 0) {
      await supabase.from('activity_logs').insert({
        user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
        action: 'BULK_DELETE_MEMBERS', action_type: 'member',
        description: `Xóa hàng loạt ${names.length} tài khoản: ${names.join(', ')}`,
      });
      toast({ title: 'Đã xóa hàng loạt', description: `${names.length} tài khoản đã bị xóa.` });
    }
    setIsBulkProcessing(false); clearSelection(); setBulkAction(null); fetchMembers();
  };
  const handleBulkPromote = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const promoted: string[] = [];
    for (const id of ids) {
      const member = members.find(m => m.id === id);
      if (!member) continue;
      const roles = memberRoles[id] || [];
      if (roles.includes('leader') || roles.includes('admin')) continue; // already promoted
      const { error } = await supabase.from('user_roles').insert({ user_id: id, role: 'leader' });
      if (!error) promoted.push(member.full_name);
    }
    if (promoted.length > 0) {
      await supabase.from('activity_logs').insert({
        user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
        action: 'BULK_PROMOTE_MEMBERS', action_type: 'member',
        description: `Nâng cấp hàng loạt ${promoted.length} tài khoản lên Thành viên Nâng cao: ${promoted.join(', ')}`,
      });
      toast({ title: 'Đã nâng cấp hàng loạt', description: `${promoted.length} tài khoản đã được nâng lên Thành viên Nâng cao.` });
    } else {
      toast({ title: 'Không có thay đổi', description: 'Các tài khoản đã chọn đều đã là Thành viên Nâng cao hoặc Admin.', variant: 'destructive' });
    }
    setIsBulkProcessing(false); clearSelection(); setBulkAction(null); fetchMembers();
  };

  const handleBulkDemote = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const demoted: string[] = [];
    for (const id of ids) {
      const member = members.find(m => m.id === id);
      if (!member) continue;
      const roles = memberRoles[id] || [];
      if (!roles.includes('leader')) continue;
      if (roles.includes('admin')) continue;
      const { error } = await supabase.from('user_roles').delete().eq('user_id', id).eq('role', 'leader');
      if (!error) demoted.push(member.full_name);
    }
    if (demoted.length > 0) {
      await supabase.from('activity_logs').insert({
        user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
        action: 'BULK_DEMOTE_MEMBERS', action_type: 'member',
        description: `Hạ cấp hàng loạt ${demoted.length} tài khoản về Thành viên: ${demoted.join(', ')}`,
      });
      toast({ title: 'Đã hạ cấp hàng loạt', description: `${demoted.length} tài khoản đã được hạ về Thành viên.` });
    } else {
      toast({ title: 'Không có thay đổi', description: 'Không có tài khoản nào đủ điều kiện để hạ cấp.', variant: 'destructive' });
    }
    setIsBulkProcessing(false); clearSelection(); setBulkAction(null); fetchMembers();
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ====== RENDER MEMBER ROW ======
  const renderMemberRow = (member: Profile) => {
    const canManage = canManageMember(member.id);
    const isAdminMember = isMemberAdmin(member.id);
    const suspended = isMemberSuspended(member);
    const isSelected = selectedIds.has(member.id);
    const roles = memberRoles[member.id] || [];
    
    return (
      <div
        key={member.id}
        className={`flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer ${
          isSelected ? 'bg-primary/10 border border-primary/30' : 
          suspended ? 'bg-destructive/5 hover:bg-destructive/10 border border-destructive/20' : 
          'bg-muted/30 hover:bg-muted/50'
        }`}
        onClick={() => {
          if (isSelectMode && canManage) toggleSelect(member.id);
          else if (!isSelectMode) { setSelectedMember(member); setIsDetailDialogOpen(true); }
        }}
      >
        {isSelectMode && canManage && (
          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(member.id)} onClick={(e) => e.stopPropagation()} className="shrink-0" />
        )}
        <UserAvatar src={member.avatar_url} name={member.full_name} size="lg" className="border-2 border-background"
          showPresence={isConnected} presenceStatus={getPresenceStatus(member.id)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate">{member.full_name}</p>
            {isAdminMember && (
              <Badge className="bg-destructive/10 text-destructive text-xs gap-1"><Shield className="w-3 h-3" />Admin</Badge>
            )}
            {!isAdminMember && roles.includes('leader') && (
              <Badge className="bg-primary/10 text-primary text-xs gap-1"><Shield className="w-3 h-3" />Thành viên Nâng cao</Badge>
            )}
            {member.id === user?.id && <Badge variant="outline" className="text-xs">Bạn</Badge>}
            {suspended && <Badge variant="destructive" className="text-xs gap-1"><Lock className="w-3 h-3" />Đã khóa</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{member.student_id}</span>
            <span>•</span>
            <span className="truncate">{member.email}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tạo: {new Date(member.created_at).toLocaleDateString('vi-VN')}
          </p>
        </div>
        
        {canManage && !isSelectMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsRoleManagementOpen(true); }}>
                <Shield className="w-4 h-4 mr-2" />Quản lý quyền
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                <Pencil className="w-4 h-4 mr-2" />Chỉnh sửa thông tin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsPasswordDialogOpen(true); }}>
                <Key className="w-4 h-4 mr-2" />Đổi mật khẩu
              </DropdownMenuItem>
              {suspended ? (
                <DropdownMenuItem onClick={() => handleUnsuspend(member)}>
                  <Unlock className="w-4 h-4 mr-2" />Mở khóa tài khoản
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsSuspendDialogOpen(true); }}>
                  <Lock className="w-4 h-4 mr-2" />Tạm khóa tài khoản
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />Xóa tài khoản
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // ====== RENDER TOOLBAR (Search + Bulk Actions) ======
  const renderToolbar = (showRoleFilter: boolean = false) => (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, MSSV hoặc email..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Role filter - only on Active tab */}
        {showRoleFilter && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px] h-10">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Lọc vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="member">Thành viên Thường</SelectItem>
              <SelectItem value="leader">Thành viên Nâng cao</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Select mode button */}
        {!isSelectMode && selectableMembers.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 h-10" onClick={() => setIsSelectMode(true)}>
            <CheckSquare className="w-4 h-4" />
            Chọn nhiều
          </Button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isSelectMode && (
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <Checkbox checked={allSelectableSelected} onCheckedChange={toggleSelectAll} className="shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : 'Chọn thành viên'}
          </span>
          <div className="flex-1" />
          {activeSubTab !== 'suspended' && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('suspend')} disabled={selectedIds.size === 0}>
              <Lock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Khóa</span>
            </Button>
          )}
          {activeSubTab === 'suspended' && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('unsuspend')} disabled={selectedIds.size === 0}>
              <Unlock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Mở khóa</span>
            </Button>
          )}
          {activeSubTab !== 'suspended' && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('unsuspend')} disabled={selectedIds.size === 0}>
              <Unlock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Mở khóa</span>
            </Button>
          )}
          {activeSubTab !== 'suspended' && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('promote')} disabled={selectedIds.size === 0}>
              <Shield className="w-3.5 h-3.5" /><span className="hidden sm:inline">Nâng cấp</span>
            </Button>
          )}
          {activeSubTab !== 'suspended' && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('demote')} disabled={selectedIds.size === 0}>
              <UserCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Hạ cấp</span>
            </Button>
          )}
          <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={() => setBulkAction('delete')} disabled={selectedIds.size === 0}>
            <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Xóa</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={clearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // ====== RENDER MEMBER LIST ======
  const renderMemberList = (title: string, description: string) => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {title} ({filteredMembers.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{searchQuery ? 'Không tìm thấy thành viên' : 'Không có thành viên nào'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map(renderMemberRow)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ====== RENDER PENDING TAB ======
  const renderPendingTab = () => (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Duyệt tài khoản</p>
            <p className="text-muted-foreground mt-1">
              Các tài khoản do thành viên tự đăng ký sẽ xuất hiện tại đây. Admin cần duyệt hoặc từ chối trước khi họ có thể sử dụng hệ thống.
            </p>
          </div>
        </CardContent>
      </Card>

      {pendingMembers.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không có tài khoản nào chờ duyệt</p>
              <p className="text-sm mt-1">Tất cả tài khoản đăng ký đã được xử lý</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingMembers.map((member) => (
            <Card key={member.id} className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar src={member.avatar_url} name={member.full_name} size="lg" className="border-2 border-background" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{member.full_name || '(Chưa có tên)'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" /><span>{member.student_id}</span>
                      <span>•</span>
                      <Mail className="w-3.5 h-3.5" /><span className="truncate">{member.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đăng ký lúc: {new Date(member.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprovePending(member)} className="gap-1.5">
                      <Check className="w-4 h-4" /> Duyệt
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectPending(member)} className="gap-1.5">
                      <Trash2 className="w-4 h-4" /> Từ chối
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-0 -mx-6 md:-mx-8 -mt-6">
        {/* Sub-navigation - flush with main nav */}
        <MemberNavigation activeTab={activeSubTab} onTabChange={setActiveSubTab} counts={navCounts} />

        {/* Header - below navigation */}
        <div className="px-4 md:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
            <div>
              <h1 className="text-3xl font-heading font-bold">Thành viên hệ thống</h1>
              <p className="text-muted-foreground">
                Quản lý tài khoản thành viên trong hệ thống. Thêm thành viên vào project tại trang chi tiết project.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" className="font-semibold gap-2"
                onClick={() => {
                  const allMembers = members;
                  const exportData = allMembers.map(m => ({
                    fullName: m.full_name,
                    studentId: m.student_id,
                    email: m.email,
                    role: isMemberAdmin(m.id) ? 'Admin' : (memberRoles[m.id]?.includes('leader') ? 'Thành viên Nâng cao' : 'Thành viên Thường')
                  }));
                  exportMembersToExcel(exportData, 'danh-sach-thanh-vien-he-thong');
                }}
              >
                <Download className="w-4 h-4" />Xuất Excel
              </Button>
              <Button variant="outline" className="font-semibold gap-2" onClick={() => setIsExcelImportOpen(true)}>
                <Upload className="w-4 h-4" />Import Excel
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-semibold gap-2">
                    <UserPlus className="w-4 h-4" />Tạo tài khoản mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-primary" />Tạo tài khoản thành viên
                    </DialogTitle>
                    <DialogDescription>
                      Tạo tài khoản mới cho thành viên. Mật khẩu mặc định là "123456", thành viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="fullName" placeholder="Nguyễn Văn A" className="pl-10 h-11" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Mã số sinh viên <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="studentId" placeholder="31241234567" className="pl-10 h-11" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="email@ueh.edu.vn" className="pl-10 h-11" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
                      <Key className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Mật khẩu mặc định: <span className="font-mono font-bold">123456</span>
                        <br /><span className="text-xs">Thành viên sẽ đổi mật khẩu khi đăng nhập lần đầu</span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                      <Button type="submit" disabled={isCreating} className="min-w-28">
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo tài khoản'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 pb-6">
          <div className="max-w-[1600px] mx-auto space-y-4">
            {/* Tab: All Members */}
            {activeSubTab === 'all' && (
              <>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Cách hoạt động</p>
                      <p className="text-muted-foreground mt-1">
                        • Tạo tài khoản tại đây để thêm thành viên vào hệ thống (mặc định role = Member)<br />
                        • Thêm thành viên vào project tại trang chi tiết project và gán vai trò riêng cho project đó<br />
                        • Một tài khoản có thể có vai trò khác nhau ở các project khác nhau
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {renderToolbar(false)}
                {renderMemberList('Tất cả thành viên', 'Tất cả thành viên đã được phê duyệt trong hệ thống')}
              </>
            )}

            {/* Tab: Active Members */}
            {activeSubTab === 'active' && (
              <>
                {renderToolbar(true)}
                {renderMemberList('Thành viên hoạt động', 'Các thành viên đang hoạt động bình thường')}
              </>
            )}

            {/* Tab: Pending */}
            {activeSubTab === 'pending' && renderPendingTab()}

            {/* Tab: Suspended */}
            {activeSubTab === 'suspended' && (
              <>
                {renderToolbar(false)}
                {renderMemberList('Thành viên bị khóa', 'Các tài khoản đang bị tạm khóa')}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ====== DIALOGS ====== */}
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => { setIsPasswordDialogOpen(open); if (!open) { setUpdatePassword(''); setSelectedMember(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-primary" />Đổi mật khẩu</DialogTitle>
            <DialogDescription>Đặt mật khẩu mới cho <span className="font-medium">{selectedMember?.full_name}</span></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới <span className="text-destructive">*</span></Label>
              <Input id="newPassword" type="password" placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)" className="h-11" value={updatePassword} onChange={(e) => setUpdatePassword(e.target.value)} minLength={6} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isCreating || updatePassword.length < 6} className="min-w-28">
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đổi mật khẩu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setSelectedMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-primary" />Chỉnh sửa thông tin</DialogTitle>
            <DialogDescription>Cập nhật thông tin tài khoản của <span className="font-medium">{selectedMember?.full_name}</span></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Họ và tên <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="editFullName" className="pl-10 h-11" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStudentId">Mã số sinh viên <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="editStudentId" className="pl-10 h-11" value={editStudentId} onChange={(e) => setEditStudentId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="editEmail" type="email" className="pl-10 h-11" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isCreating} className="min-w-28">
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setSelectedMember(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản <span className="font-semibold">{selectedMember?.full_name}</span> khỏi hệ thống?
              <br /><br />
              <span className="text-destructive font-medium">Cảnh báo: Thao tác này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan. Không thể hoàn tác.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa tài khoản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Member Dialog */}
      <SuspendMemberDialog
        open={isSuspendDialogOpen}
        onOpenChange={(open) => { setIsSuspendDialogOpen(open); if (!open) setSelectedMember(null); }}
        member={selectedMember}
        currentUserId={user?.id || ''}
        currentUserName={currentProfile?.full_name || user?.email || 'Unknown'}
        onSuccess={fetchMembers}
      />

      {/* Member Detail Dialog */}
      <MemberDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setSelectedMember(null); }}
        member={selectedMember}
        systemRoles={selectedMember ? (memberRoles[selectedMember.id] || ['member']) : []}
      />

      {/* Bulk Action Confirm Dialog */}
      <AlertDialog open={bulkAction !== null} onOpenChange={(open) => { if (!open) setBulkAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'delete' && 'Xác nhận xóa hàng loạt'}
              {bulkAction === 'suspend' && 'Xác nhận khóa hàng loạt'}
              {bulkAction === 'unsuspend' && 'Xác nhận mở khóa hàng loạt'}
              {bulkAction === 'promote' && 'Xác nhận nâng cấp hàng loạt'}
              {bulkAction === 'demote' && 'Xác nhận hạ cấp hàng loạt'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'delete' && (<>Bạn sắp xóa <span className="font-semibold">{selectedIds.size}</span> tài khoản khỏi hệ thống.<br /><br /><span className="text-destructive font-medium">Thao tác này không thể hoàn tác!</span></>)}
              {bulkAction === 'suspend' && (<>Bạn sắp tạm khóa <span className="font-semibold">{selectedIds.size}</span> tài khoản (mặc định 1 ngày).</>)}
              {bulkAction === 'unsuspend' && (<>Bạn sắp mở khóa <span className="font-semibold">{selectedIds.size}</span> tài khoản.</>)}
              {bulkAction === 'promote' && (<>Bạn sắp nâng cấp <span className="font-semibold">{selectedIds.size}</span> tài khoản lên <span className="font-semibold">Thành viên Nâng cao</span>. Các tài khoản đã là Thành viên Nâng cao hoặc Admin sẽ được bỏ qua.</>)}
              {bulkAction === 'demote' && (<>Bạn sắp hạ cấp <span className="font-semibold">{selectedIds.size}</span> tài khoản về <span className="font-semibold">Thành viên</span>. Chỉ các tài khoản đang là Thành viên Nâng cao mới bị ảnh hưởng (Admin sẽ được bỏ qua).</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bulkAction === 'delete') handleBulkDelete();
                else if (bulkAction === 'suspend') handleBulkSuspend();
                else if (bulkAction === 'unsuspend') handleBulkUnsuspend();
                else if (bulkAction === 'promote') handleBulkPromote();
                else if (bulkAction === 'demote') handleBulkDemote();
              }}
              className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Import Dialog */}
      <ExcelMemberImport
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        contextLabel="hệ thống"
        allowedActions={['add', 'remove']}
        onValidate={async (action: ExcelImportAction, rows: ParsedRow[]) => {
          const results: ImportValidation[] = [];
          for (const row of rows) {
            if (action === 'add') {
              if (!row.fullName || !row.email) { results.push({ row, status: 'missing_field', message: `Thiếu ${!row.fullName ? 'họ tên' : 'email'}` }); continue; }
              const existing = members.find(m => m.email.toLowerCase() === row.email.toLowerCase());
              if (existing) results.push({ row, status: 'duplicate', message: 'Email đã tồn tại' });
              else results.push({ row, status: 'ok' });
            } else {
              const match = members.find(m => (row.studentId && m.student_id === row.studentId) || (row.email && m.email.toLowerCase() === row.email.toLowerCase()));
              if (!match) results.push({ row, status: 'not_found', message: 'Không tìm thấy' });
              else if (match.id === user?.id) results.push({ row, status: 'missing_field', message: 'Không thể xóa chính mình' });
              else results.push({ row, status: 'ok' });
            }
          }
          return results;
        }}
        onExecute={async (action: ExcelImportAction, rows: ParsedRow[]) => {
          let success = 0, failed = 0;
          const errors: string[] = [];
          if (action === 'add') {
            for (const row of rows) {
              try {
                const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'create_member', email: row.email, student_id: row.studentId, full_name: row.fullName } });
                if (error || data?.error) throw new Error(data?.error || error?.message);
                success++;
              } catch (err: any) { failed++; errors.push(`${row.fullName}: ${err.message}`); }
            }
            if (success > 0) {
              await supabase.from('activity_logs').insert({
                user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
                action: 'BULK_IMPORT_MEMBERS', action_type: 'member',
                description: `Import hàng loạt ${success} thành viên từ Excel`,
              });
            }
          } else {
            for (const row of rows) {
              try {
                const match = members.find(m => (row.studentId && m.student_id === row.studentId) || (row.email && m.email.toLowerCase() === row.email.toLowerCase()));
                if (!match) { failed++; errors.push(`${row.fullName}: Không tìm thấy`); continue; }
                const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'delete_user', user_id: match.id, requester_id: user?.id } });
                if (error || data?.error) throw new Error(data?.error || error?.message);
                success++;
              } catch (err: any) { failed++; errors.push(`${row.fullName}: ${err.message}`); }
            }
            if (success > 0) {
              await supabase.from('activity_logs').insert({
                user_id: user!.id, user_name: currentProfile?.full_name || user?.email || 'Unknown',
                action: 'BULK_REMOVE_MEMBERS', action_type: 'member',
                description: `Xóa hàng loạt ${success} thành viên từ Excel`,
              });
            }
          }
          fetchMembers();
          return { success, failed, errors };
        }}
      />

      {/* Role Management Dialog */}
      <MemberRoleManagementDialog
        open={isRoleManagementOpen}
        onOpenChange={setIsRoleManagementOpen}
        member={selectedMember}
        systemRoles={selectedMember ? (memberRoles[selectedMember.id] || []) : []}
        onRoleChanged={() => { fetchMembers(); }}
      />
    </DashboardLayout>
  );
}
