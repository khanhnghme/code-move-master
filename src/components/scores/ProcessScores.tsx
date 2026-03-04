import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';
import { 
  Award, Scale, History, 
  AlertCircle, CheckCircle, Clock, Edit2, MessageSquare,
  TrendingUp, TrendingDown, Minus, FileText, Users, Loader2,
  ChevronRight, Info, Target, BarChart3, Star, Eye, MoreHorizontal,
  RefreshCw, ArrowUp, ArrowDown, Percent, Activity, ChevronDown,
  Trophy, Zap, Crown, Medal, Sparkles
} from 'lucide-react';
import ScoreAdjustmentDialog from './ScoreAdjustmentDialog';
import AppealDialog from './AppealDialog';
import AppealReviewDialog from './AppealReviewDialog';
import StageWeightDialog from './StageWeightDialog';
import ScoreHistoryPanel from './ScoreHistoryPanel';
import TaskScoringDialog from './TaskScoringDialog';
import type { Stage, Task, GroupMember, Profile } from '@/types/database';
import type { 
  TaskScore, MemberStageScore, MemberFinalScore, 
  ScoreAppeal, StageWeight, ScoreAdjustmentHistory 
} from '@/types/processScores';

interface ProcessScoresProps {
  groupId: string;
  stages: Stage[];
  tasks: Task[];
  members: GroupMember[];
  isLeader: boolean;
}

interface AdjustmentDetailDialog {
  isOpen: boolean;
  type: 'task' | 'stage' | 'final';
  title: string;
  score: number;
  baseScore: number;
  adjustment: number;
  reason: string | null;
  adjustedAt: string | null;
}

// ── Score tier helpers ──
const getScoreTier = (score: number) => {
  if (score >= 90) return { label: 'Xuất sắc', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600', icon: Crown };
  if (score >= 70) return { label: 'Tốt', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', ring: 'ring-sky-500/20', gradient: 'from-sky-500 to-sky-600', icon: Star };
  if (score >= 50) return { label: 'Trung bình', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500/20', gradient: 'from-amber-500 to-amber-600', icon: Minus };
  return { label: 'Cần cải thiện', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', ring: 'ring-rose-500/20', gradient: 'from-rose-500 to-rose-600', icon: TrendingDown };
};

// Score circle component
const ScoreCircle = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const tier = getScoreTier(score);
  const sizes = {
    sm: { outer: 'w-10 h-10', text: 'text-sm font-bold', ring: 2 },
    md: { outer: 'w-14 h-14', text: 'text-lg font-bold', ring: 3 },
    lg: { outer: 'w-20 h-20', text: 'text-2xl font-bold', ring: 3 },
    xl: { outer: 'w-28 h-28', text: 'text-4xl font-extrabold', ring: 4 },
  };
  const s = sizes[size];
  const pct = Math.min(score, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className={`relative ${s.outer} flex items-center justify-center`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" strokeWidth={s.ring} className="stroke-muted/40" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          strokeWidth={s.ring}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-700 ease-out`}
          style={{ stroke: score >= 90 ? '#10b981' : score >= 70 ? '#0ea5e9' : score >= 50 ? '#f59e0b' : '#f43f5e' }}
        />
      </svg>
      <span className={`${s.text} ${tier.color} relative z-10`}>{score.toFixed(0)}</span>
    </div>
  );
};

// Rank badge for top 3
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm"><Crown className="w-3.5 h-3.5 text-white" /></div>;
  if (rank === 2) return <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-sm"><Medal className="w-3.5 h-3.5 text-white" /></div>;
  if (rank === 3) return <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm"><Medal className="w-3.5 h-3.5 text-white" /></div>;
  return <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><span className="text-xs font-semibold text-muted-foreground">{rank}</span></div>;
};

// Adjustment pill
const AdjustmentPill = ({ adjustment, onClick }: { adjustment: number | null; onClick?: () => void }) => {
  if (!adjustment || adjustment === 0) return null;
  const isPositive = adjustment > 0;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer ${
        isPositive 
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
      }`}
    >
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{adjustment}
    </button>
  );
};

export default function ProcessScores({
  groupId,
  stages,
  tasks,
  members,
  isLeader,
}: ProcessScoresProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [memberTab, setMemberTab] = useState('scores');
  
  // Data states
  const [taskScores, setTaskScores] = useState<TaskScore[]>([]);
  const [stageScores, setStageScores] = useState<MemberStageScore[]>([]);
  const [finalScores, setFinalScores] = useState<MemberFinalScore[]>([]);
  const [stageWeights, setStageWeights] = useState<StageWeight[]>([]);
  const [appeals, setAppeals] = useState<ScoreAppeal[]>([]);
  const [history, setHistory] = useState<ScoreAdjustmentHistory[]>([]);
  
  // Dialog states
  const [adjustmentDialog, setAdjustmentDialog] = useState<{
    isOpen: boolean;
    type: 'task' | 'stage' | 'final';
    targetId: string;
    memberId: string;
    memberName: string;
    currentScore: number;
  } | null>(null);
  
  const [appealDialog, setAppealDialog] = useState<{
    isOpen: boolean;
    type: 'task' | 'stage' | 'final';
    scoreId: string;
    currentScore: number;
    adjustment: number;
    adjustmentReason: string | null;
  } | null>(null);
  
  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    appeal: ScoreAppeal | null;
  }>({ isOpen: false, appeal: null });
  
  const [weightDialog, setWeightDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [taskScoringDialog, setTaskScoringDialog] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({ isOpen: false, task: null });
  
  const [adjustmentDetailDialog, setAdjustmentDetailDialog] = useState<AdjustmentDetailDialog | null>(null);
  
  // Expanded stages tracking for member view
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const toggleStage = (id: string) => setExpandedStages(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Data fetching (unchanged business logic) ──
  useEffect(() => {
    if (groupId) fetchScoreData();
  }, [groupId]);

  const fetchScoreData = async () => {
    setIsLoading(true);
    try {
      const taskIds = tasks.map(t => t.id);
      let fetchedTaskScores: TaskScore[] = [];
      if (taskIds.length > 0) {
        const { data: taskScoresData } = await supabase
          .from('task_scores').select('*').in('task_id', taskIds);
        fetchedTaskScores = (taskScoresData || []) as unknown as TaskScore[];
        setTaskScores(fetchedTaskScores);
      }

      const stageIds = stages.map(s => s.id);
      let fetchedStageScores: MemberStageScore[] = [];
      if (stageIds.length > 0) {
        const { data: stageScoresData } = await supabase
          .from('member_stage_scores').select('*').in('stage_id', stageIds);
        fetchedStageScores = (stageScoresData || []) as unknown as MemberStageScore[];
        setStageScores(fetchedStageScores);

        const { data: weightsData } = await supabase
          .from('stage_weights').select('*').in('stage_id', stageIds);
        setStageWeights((weightsData || []) as unknown as StageWeight[]);
      }

      const { data: finalScoresData } = await supabase
        .from('member_final_scores').select('*').eq('group_id', groupId);
      setFinalScores((finalScoresData || []) as unknown as MemberFinalScore[]);

      let appealsQuery = supabase.from('score_appeals').select('*');
      if (!isLeader) appealsQuery = appealsQuery.eq('user_id', user?.id);
      const { data: appealsData } = await appealsQuery;
      
      if (appealsData && appealsData.length > 0) {
        const appealIds = appealsData.map(a => a.id);
        const { data: attachmentsData } = await supabase
          .from('appeal_attachments').select('*').in('appeal_id', appealIds);
        const appealsWithAttachments = appealsData.map(appeal => ({
          ...appeal,
          attachments: attachmentsData?.filter(a => a.appeal_id === appeal.id) || []
        }));
        setAppeals(appealsWithAttachments as unknown as ScoreAppeal[]);
      } else {
        setAppeals([]);
      }

      let historyQuery = supabase.from('score_adjustment_history').select('*').order('created_at', { ascending: false }).limit(100);
      if (!isLeader) historyQuery = historyQuery.eq('user_id', user?.id);
      const { data: historyData } = await historyQuery;
      setHistory((historyData || []) as unknown as ScoreAdjustmentHistory[]);

      await autoSyncScores(fetchedTaskScores, fetchedStageScores);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu điểm', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const autoSyncScores = async (currentTaskScores: TaskScore[], currentStageScores: MemberStageScore[]) => {
    try {
      for (const task of tasks) {
        const assignments = task.task_assignments || [];
        for (const assignment of assignments) {
          const existing = currentTaskScores.find(ts => ts.task_id === task.id && ts.user_id === assignment.user_id);
          if (!existing) {
            await supabase.from('task_scores').insert({ task_id: task.id, user_id: assignment.user_id, base_score: 100, final_score: 100 });
          }
        }
      }

      for (const stage of stages) {
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        const stageTaskIds = stageTasks.map(t => t.id);
        const assigneeIds = new Set<string>();
        stageTasks.forEach(task => { task.task_assignments?.forEach(a => assigneeIds.add(a.user_id)); });

        for (const userId of assigneeIds) {
          const userTaskScores = currentTaskScores.filter(ts => stageTaskIds.includes(ts.task_id) && ts.user_id === userId);
          if (userTaskScores.length > 0) {
            const avgScore = userTaskScores.reduce((sum, ts) => sum + (ts.final_score || 100), 0) / userTaskScores.length;
            const existing = currentStageScores.find(ss => ss.stage_id === stage.id && ss.user_id === userId);
            if (existing) {
              await supabase.from('member_stage_scores').update({ average_score: avgScore, final_stage_score: avgScore + (existing.adjustment || 0) }).eq('id', existing.id);
            } else {
              await supabase.from('member_stage_scores').insert({ stage_id: stage.id, user_id: userId, average_score: avgScore, final_stage_score: avgScore });
            }
          }
        }
      }

      const memberIds = members.map(m => m.user_id);
      const { data: latestStageScores } = await supabase.from('member_stage_scores').select('*').in('stage_id', stages.map(s => s.id));
      const { data: latestWeights } = await supabase.from('stage_weights').select('*').in('stage_id', stages.map(s => s.id));
      const { data: latestFinalScores } = await supabase.from('member_final_scores').select('*').eq('group_id', groupId);
      
      for (const memberId of memberIds) {
        const memberStageScores = (latestStageScores || []).filter(ss => ss.user_id === memberId);
        if (memberStageScores.length > 0) {
          let totalWeight = 0, weightedSum = 0;
          memberStageScores.forEach(ss => {
            const weight = (latestWeights || []).find(w => w.stage_id === ss.stage_id)?.weight ?? 1;
            weightedSum += (ss.final_stage_score || 100) * weight;
            totalWeight += weight;
          });
          const calculatedScore = totalWeight > 0 ? weightedSum / totalWeight : 100;
          const existing = (latestFinalScores || []).find(fs => fs.group_id === groupId && fs.user_id === memberId);
          if (existing) {
            await supabase.from('member_final_scores').update({ calculated_score: calculatedScore, final_score: calculatedScore + (existing.adjustment || 0) }).eq('id', existing.id);
          } else {
            await supabase.from('member_final_scores').insert({ group_id: groupId, user_id: memberId, calculated_score: calculatedScore, final_score: calculatedScore });
          }
        }
      }

      // Refresh
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length > 0) {
        const { data: r } = await supabase.from('task_scores').select('*').in('task_id', taskIds);
        setTaskScores((r || []) as unknown as TaskScore[]);
      }
      const stageIds = stages.map(s => s.id);
      if (stageIds.length > 0) {
        const { data: r } = await supabase.from('member_stage_scores').select('*').in('stage_id', stageIds);
        setStageScores((r || []) as unknown as MemberStageScore[]);
      }
      const { data: r } = await supabase.from('member_final_scores').select('*').eq('group_id', groupId);
      setFinalScores((r || []) as unknown as MemberFinalScore[]);
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  };

  // ── Handlers (unchanged) ──
  const handleAdjustScore = async (adjustment: number, reason: string) => {
    if (!adjustmentDialog) return;
    setIsProcessing(true);
    try {
      const { type, targetId, memberId } = adjustmentDialog;
      if (type === 'task') {
        const existing = taskScores.find(ts => ts.id === targetId);
        const previousScore = existing?.final_score || 100;
        const newScore = 100 + adjustment;
        await supabase.from('task_scores').update({ adjustment, adjustment_reason: reason, adjusted_by: user?.id, adjusted_at: new Date().toISOString(), final_score: newScore }).eq('id', targetId);
        await supabase.from('score_adjustment_history').insert([{ adjustment_type: 'task', target_id: targetId, user_id: memberId, previous_score: previousScore, new_score: newScore, adjustment_value: adjustment, reason, adjusted_by: user?.id || '' }]);
      } else if (type === 'stage') {
        const existing = stageScores.find(ss => ss.id === targetId);
        const previousScore = existing?.final_stage_score || 100;
        const newScore = (existing?.average_score || 100) + adjustment;
        await supabase.from('member_stage_scores').update({ adjustment, adjustment_reason: reason, adjusted_by: user?.id, adjusted_at: new Date().toISOString(), final_stage_score: newScore }).eq('id', targetId);
        await supabase.from('score_adjustment_history').insert([{ adjustment_type: 'stage', target_id: targetId, user_id: memberId, previous_score: previousScore, new_score: newScore, adjustment_value: adjustment, reason, adjusted_by: user?.id || '' }]);
      } else if (type === 'final') {
        const existing = finalScores.find(fs => fs.id === targetId);
        const previousScore = existing?.final_score || 100;
        const newScore = (existing?.calculated_score || 100) + adjustment;
        await supabase.from('member_final_scores').update({ adjustment, adjustment_reason: reason, adjusted_by: user?.id, adjusted_at: new Date().toISOString(), final_score: newScore }).eq('id', targetId);
        await supabase.from('score_adjustment_history').insert([{ adjustment_type: 'final', target_id: targetId, user_id: memberId, previous_score: previousScore, new_score: newScore, adjustment_value: adjustment, reason, adjusted_by: user?.id || '' }]);
      }
      toast({ title: 'Thành công', description: 'Đã điều chỉnh điểm' });
      setAdjustmentDialog(null);
      fetchScoreData();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitAppeal = async (content: string, files: File[]) => {
    if (!appealDialog) return;
    setIsProcessing(true);
    try {
      const { data: appealData, error: appealError } = await supabase
        .from('score_appeals').insert([{ user_id: user?.id || '', task_score_id: appealDialog.type === 'task' ? appealDialog.scoreId : null, stage_score_id: appealDialog.type === 'stage' ? appealDialog.scoreId : null, reason: content }]).select().single();
      if (appealError) throw appealError;
      for (const file of files) {
        const filePath = `${user?.id}/${appealData.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('appeal-attachments').upload(filePath, file);
        if (!uploadError) {
          await supabase.from('appeal_attachments').insert([{ appeal_id: appealData.id, file_name: file.name, file_path: filePath, file_size: file.size, storage_name: filePath }]);
        }
      }
      toast({ title: 'Thành công', description: 'Đã gửi phúc khảo' });
      setAppealDialog(null);
      fetchScoreData();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAppealResponse = async (approved: boolean, response: string) => {
    if (!reviewDialog.appeal) return;
    setIsProcessing(true);
    try {
      await supabase.from('score_appeals').update({ status: approved ? 'approved' : 'rejected', response, responded_by: user?.id, responded_at: new Date().toISOString() }).eq('id', reviewDialog.appeal.id);
      toast({ title: 'Thành công', description: approved ? 'Đã chấp nhận phúc khảo' : 'Đã từ chối phúc khảo' });
      setReviewDialog({ isOpen: false, appeal: null });
      fetchScoreData();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveWeights = async (weights: { stageId: string; weight: number }[]) => {
    setIsProcessing(true);
    try {
      for (const { stageId, weight } of weights) {
        const existing = stageWeights.find(w => w.stage_id === stageId);
        if (existing) {
          await supabase.from('stage_weights').update({ weight }).eq('id', existing.id);
        } else {
          await supabase.from('stage_weights').insert([{ group_id: groupId, stage_id: stageId, weight }]);
        }
      }
      toast({ title: 'Thành công', description: 'Đã lưu trọng số giai đoạn' });
      setWeightDialog(false);
      fetchScoreData();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Helpers ──
  const getMemberProfile = (userId: string) => members.find(m => m.user_id === userId)?.profiles;
  const pendingAppealsCount = appeals.filter(a => a.status === 'pending').length;
  
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const currentUserProfile = currentUserMember?.profiles;
  const currentUserFinalScore = finalScores.find(fs => fs.user_id === user?.id);
  const currentUserStageScores = stageScores.filter(ss => ss.user_id === user?.id);
  const currentUserTaskScores = taskScores.filter(ts => ts.user_id === user?.id);
  const currentUserAppeals = appeals.filter(a => a.user_id === user?.id);

  const openAdjDetail = (type: AdjustmentDetailDialog['type'], title: string, score: number, baseScore: number, adjustment: number, reason: string | null, adjustedAt: string | null) => {
    setAdjustmentDetailDialog({ isOpen: true, type, title, score, baseScore, adjustment, reason, adjustedAt });
  };

  const leaderStats = useMemo(() => {
    const avgFinalScore = finalScores.length > 0 
      ? finalScores.reduce((sum, fs) => sum + (fs.final_score || 100), 0) / finalScores.length : 100;
    const adjustedCount = taskScores.filter(ts => (ts.adjustment ?? 0) !== 0).length;
    const highPerformers = finalScores.filter(fs => (fs.final_score || 100) >= 90).length;
    const lowPerformers = finalScores.filter(fs => (fs.final_score || 100) < 70).length;
    return { avgFinalScore, adjustedCount, highPerformers, lowPerformers, totalMembers: members.length };
  }, [finalScores, taskScores, members]);

  // Sorted & ranked members
  const rankedMembers = useMemo(() => {
    return members
      .map(m => {
        const fs = finalScores.find(f => f.user_id === m.user_id);
        return { member: m, score: fs?.final_score ?? 100, finalScore: fs };
      })
      .sort((a, b) => b.score - a.score);
  }, [members, finalScores]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải điểm quá trình...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // LEADER: Overview
  // ═══════════════════════════════════════════════
  const renderLeaderOverview = () => {
    const avgScore = leaderStats.avgFinalScore;
    const avgTier = getScoreTier(avgScore);

    return (
      <div className="space-y-6">
        {/* Hero stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className={`${avgTier.bg} ${avgTier.border} border`}>
            <CardContent className="p-4 flex items-center gap-3">
              <ScoreCircle score={avgScore} size="md" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Điểm TB nhóm</p>
                <p className={`text-xl font-bold ${avgTier.color}`}>{avgScore.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Xuất sắc</p>
                <p className="text-xl font-bold text-emerald-600">{leaderStats.highPerformers}<span className="text-sm text-muted-foreground font-normal">/{leaderStats.totalMembers}</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Cần cải thiện</p>
                <p className="text-xl font-bold text-rose-600">{leaderStats.lowPerformers}<span className="text-sm text-muted-foreground font-normal">/{leaderStats.totalMembers}</span></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Điều chỉnh</p>
                <p className="text-xl font-bold text-primary">{leaderStats.adjustedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member ranking table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Bảng xếp hạng thành viên
                </CardTitle>
                <CardDescription className="mt-0.5">Sắp xếp theo điểm quá trình từ cao đến thấp</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 text-xs">
                <Activity className="w-3 h-3" />
                Tự động
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {rankedMembers.map(({ member, score, finalScore: fs }, index) => {
                const profile = member.profiles;
                const tier = getScoreTier(score);
                const adjustment = fs?.adjustment ?? 0;
                const memberAppeals = appeals.filter(a => a.user_id === member.user_id && a.status === 'pending');
                const rank = index + 1;

                return (
                  <div 
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${tier.bg} ${tier.border}`}
                  >
                    <RankBadge rank={rank} />
                    
                    <UserAvatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{profile?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{profile?.student_id}</p>
                    </div>

                    {memberAppeals.length > 0 && (
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-1.5">
                        <Clock className="w-3 h-3 mr-0.5" />
                        {memberAppeals.length}
                      </Badge>
                    )}

                    <div className="flex items-center gap-1.5">
                      <AdjustmentPill 
                        adjustment={adjustment}
                        onClick={() => fs && openAdjDetail('final', `Chi tiết: ${profile?.full_name}`, score, fs.calculated_score ?? 100, adjustment, fs.adjustment_reason || null, fs.adjusted_at || null)}
                      />
                      <ScoreCircle score={score} size="sm" />
                    </div>

                    {fs && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                        onClick={() => setAdjustmentDialog({ isOpen: true, type: 'final', targetId: fs.id, memberId: member.user_id, memberName: profile?.full_name || '', currentScore: score })}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}

              {members.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Chưa có thành viên nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // LEADER: Stage / Task detail
  // ═══════════════════════════════════════════════
  const renderLeaderDetail = () => {
    const sortedStages = [...stages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
      <div className="space-y-4">
        {sortedStages.length === 0 ? (
          <Card><CardContent className="text-center py-12"><p className="text-muted-foreground">Chưa có giai đoạn nào</p></CardContent></Card>
        ) : (
          sortedStages.map((stage, stageIndex) => {
            const stageTasks = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const weight = stageWeights.find(w => w.stage_id === stage.id)?.weight ?? 1;
            const stageNumber = stageIndex + 1;
            const stageColor = `hsl(var(--stage-${Math.min(stageNumber, 6)}))`;

            return (
              <Card key={stage.id} className="overflow-hidden">
                <div className="h-1" style={{ background: stageColor }} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: stageColor }}>
                        {stageNumber}
                      </div>
                      <div>
                        <CardTitle className="text-base">{stage.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {stageTasks.length} task · Trọng số: ×{weight}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {stageTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Chưa có task</p>
                    ) : stageTasks.map((task, taskIndex) => {
                      const assigneeIds = task.task_assignments?.map((a: any) => a.user_id) || [];
                      const taskScoresForTask = taskScores.filter(ts => ts.task_id === task.id);
                      const scoredCount = taskScoresForTask.length;
                      const totalCount = assigneeIds.length;
                      const taskCode = `${stageNumber}.${taskIndex + 1}`;
                      const hasAdjustments = taskScoresForTask.some(ts => (ts.adjustment ?? 0) !== 0);
                      
                      return (
                        <div key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => setTaskScoringDialog({ isOpen: true, task })}
                        >
                          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{taskCode}</span>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{task.title}</p>
                            <p className="text-[11px] text-muted-foreground">{totalCount} người thực hiện</p>
                          </div>

                          {task.status === 'DONE' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0"><CheckCircle className="w-3 h-3 mr-0.5" />Xong</Badge>}
                          {task.status === 'VERIFIED' && <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] shrink-0"><Star className="w-3 h-3 mr-0.5" />Duyệt</Badge>}

                          {totalCount > 0 && (
                            scoredCount === totalCount ? (
                              <Badge className="bg-emerald-500 text-[10px] shrink-0"><CheckCircle className="w-3 h-3 mr-0.5" />{scoredCount}/{totalCount}{hasAdjustments && ' ✱'}</Badge>
                            ) : scoredCount > 0 ? (
                              <Badge variant="secondary" className="text-[10px] shrink-0"><Clock className="w-3 h-3 mr-0.5" />{scoredCount}/{totalCount}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] shrink-0">Chưa chấm</Badge>
                            )
                          )}

                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // LEADER: Appeals
  // ═══════════════════════════════════════════════
  const renderLeaderAppeals = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Phúc khảo</CardTitle>
        <CardDescription>Quản lý các yêu cầu phúc khảo từ thành viên</CardDescription>
      </CardHeader>
      <CardContent>
        {appeals.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-muted-foreground">Chưa có phúc khảo nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appeals.map(appeal => {
              const profile = getMemberProfile(appeal.user_id);
              const typeLabel = appeal.appeal_type === 'task' ? 'Task' : appeal.appeal_type === 'stage' ? 'Giai đoạn' : 'Điểm cuối';
              const statusConfig = appeal.status === 'pending' 
                ? { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock, text: 'Chờ xử lý' }
                : appeal.status === 'approved'
                  ? { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle, text: 'Chấp nhận' }
                  : { bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', badge: 'bg-rose-100 text-rose-700 border-rose-300', icon: AlertCircle, text: 'Từ chối' };

              return (
                <div key={appeal.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${statusConfig.bg}`}
                  onClick={() => setReviewDialog({ isOpen: true, appeal })}
                >
                  <UserAvatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{appeal.content}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                  {appeal.attachments && appeal.attachments.length > 0 && <Badge variant="secondary" className="text-[10px]"><FileText className="w-3 h-3 mr-0.5" />{appeal.attachments.length}</Badge>}
                  <Badge variant="outline" className={`text-[10px] ${statusConfig.badge}`}>
                    <statusConfig.icon className="w-3 h-3 mr-0.5" />{statusConfig.text}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(appeal.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ═══════════════════════════════════════════════
  // MEMBER: Score view
  // ═══════════════════════════════════════════════
  const renderMemberScoresView = () => {
    const finalScore = currentUserFinalScore?.final_score ?? 100;
    const calculatedScore = currentUserFinalScore?.calculated_score ?? 100;
    const adjustment = currentUserFinalScore?.adjustment ?? 0;
    const tier = getScoreTier(finalScore);

    return (
      <div className="space-y-5">
        {/* Hero card */}
        <Card className={`overflow-hidden ${tier.border} border`}>
          <div className={`bg-gradient-to-r ${tier.gradient} p-6`}>
            <div className="flex items-center gap-5">
              <div className="relative">
                <UserAvatar src={currentUserProfile?.avatar_url} name={currentUserProfile?.full_name} size="lg" className="border-2 border-white/30 shadow-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{currentUserProfile?.full_name}</h3>
                <p className="text-white/70 text-sm">{currentUserProfile?.student_id}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-white/70 text-xs flex items-center gap-1"><Target className="w-3 h-3" />{currentUserTaskScores.length} task</span>
                  <span className="text-white/70 text-xs flex items-center gap-1"><BarChart3 className="w-3 h-3" />{currentUserStageScores.length} giai đoạn</span>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium mb-1">Điểm quá trình</p>
                  <p className="text-4xl font-extrabold text-white">{finalScore.toFixed(1)}</p>
                  {adjustment !== 0 && (
                    <div className="mt-1.5 flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => openAdjDetail('final', 'Chi tiết điểm quá trình', finalScore, calculatedScore, adjustment, currentUserFinalScore?.adjustment_reason || null, currentUserFinalScore?.adjusted_at || null)}
                    >
                      <span className={`text-xs font-semibold ${adjustment > 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                        {adjustment > 0 ? '+' : ''}{adjustment}
                      </span>
                      <Info className="w-3 h-3 text-white/60" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick actions bar */}
          <CardContent className="py-2.5 px-4 flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <tier.icon className={`w-4 h-4 ${tier.color}`} />
              <span className={`text-sm font-medium ${tier.color}`}>{tier.label}</span>
            </div>
            {currentUserFinalScore && (
              <Button variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => setAppealDialog({ isOpen: true, type: 'final', scoreId: currentUserFinalScore.id, currentScore: finalScore, adjustment, adjustmentReason: currentUserFinalScore.adjustment_reason })}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Phúc khảo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stage breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
            <BarChart3 className="w-4 h-4" />
            Chi tiết theo giai đoạn
          </h4>
          
          {stages.length === 0 ? (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground text-sm">Chưa có giai đoạn nào</p></CardContent></Card>
          ) : (
            [...stages].sort((a, b) => a.order_index - b.order_index).map((stage, stageIndex) => {
              const stageScore = currentUserStageScores.find(ss => ss.stage_id === stage.id);
              const weight = stageWeights.find(w => w.stage_id === stage.id)?.weight ?? 1;
              const score = stageScore?.final_stage_score ?? 100;
              const stageAdj = stageScore?.adjustment ?? 0;
              const stageNumber = stageIndex + 1;
              const stageTier = getScoreTier(score);
              const isExpanded = expandedStages.has(stage.id);
              const stageColor = `hsl(var(--stage-${Math.min(stageNumber, 6)}))`;

              const stageTasks = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const userStageTaskScores = currentUserTaskScores.filter(ts => {
                const task = tasks.find(t => t.id === ts.task_id);
                return task?.stage_id === stage.id;
              });

              return (
                <Card key={stage.id} className="overflow-hidden">
                  <div className="h-0.5" style={{ background: stageColor }} />
                  
                  {/* Stage header - clickable */}
                  <button
                    onClick={() => toggleStage(stage.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: stageColor }}>
                      {stageNumber}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{stage.name}</p>
                      <p className="text-[11px] text-muted-foreground">{userStageTaskScores.length} task · ×{weight}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AdjustmentPill
                        adjustment={stageAdj}
                        onClick={() => {
                          if (stageScore) openAdjDetail('stage', `Giai đoạn: ${stage.name}`, score, stageScore.average_score ?? 100, stageAdj, stageScore.adjustment_reason || null, stageScore.adjusted_at || null);
                        }}
                      />
                      <ScoreCircle score={score} size="sm" />
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded task list */}
                  {isExpanded && userStageTaskScores.length > 0 && (
                    <div className="border-t px-4 py-2 space-y-1.5 bg-muted/20">
                      {userStageTaskScores.map(taskScore => {
                        const task = tasks.find(t => t.id === taskScore.task_id);
                        const adj = taskScore.adjustment ?? 0;
                        const taskIndex = stageTasks.findIndex(t => t.id === taskScore.task_id) + 1;
                        const taskCode = `${stageNumber}.${taskIndex}`;
                        const taskTier = getScoreTier(taskScore.final_score);

                        return (
                          <div key={taskScore.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border bg-card ${taskTier.border}`}>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{taskCode}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task?.title || 'Task không xác định'}</p>
                            </div>
                            <AdjustmentPill
                              adjustment={adj}
                              onClick={() => openAdjDetail('task', `Task: ${task?.title}`, taskScore.final_score, taskScore.base_score ?? 100, adj, taskScore.adjustment_reason || null, taskScore.adjusted_at || null)}
                            />
                            <span className={`text-sm font-bold ${taskTier.color} tabular-nums`}>{taskScore.final_score.toFixed(0)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                              onClick={() => setAppealDialog({ isOpen: true, type: 'task', scoreId: taskScore.id, currentScore: taskScore.final_score, adjustment: adj, adjustmentReason: taskScore.adjustment_reason })}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && userStageTaskScores.length === 0 && (
                    <div className="border-t px-4 py-4 text-center">
                      <p className="text-xs text-muted-foreground">Chưa có điểm task nào</p>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // MEMBER: Appeals
  // ═══════════════════════════════════════════════
  const renderMemberAppealsView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Phúc khảo của tôi
          </CardTitle>
          <CardDescription>Theo dõi trạng thái các yêu cầu phúc khảo</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserAppeals.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Bạn chưa gửi phúc khảo nào</p>
              <p className="text-xs text-muted-foreground mt-1">Bấm nút phúc khảo bên cạnh điểm để gửi</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentUserAppeals.map(appeal => {
                const typeLabel = appeal.appeal_type === 'task' ? 'Task' : appeal.appeal_type === 'stage' ? 'Giai đoạn' : 'Điểm cuối';
                const statusConfig = appeal.status === 'pending' 
                  ? { bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', badgeCls: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock, text: 'Chờ xử lý' }
                  : appeal.status === 'approved'
                    ? { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle, text: 'Chấp nhận' }
                    : { bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', badgeCls: 'bg-rose-100 text-rose-700 border-rose-300', icon: AlertCircle, text: 'Từ chối' };

                return (
                  <div key={appeal.id} className={`p-4 rounded-xl border transition-colors ${statusConfig.bg}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusConfig.badgeCls}`}>
                          <statusConfig.icon className="w-3 h-3 mr-0.5" />{statusConfig.text}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(appeal.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{appeal.content}</p>
                    {appeal.attachments && appeal.attachments.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />{appeal.attachments.length} tệp đính kèm
                      </div>
                    )}
                    {appeal.response && (
                      <div className={`mt-3 p-3 rounded-lg ${appeal.status === 'approved' ? 'bg-emerald-100/50 dark:bg-emerald-900/20' : 'bg-rose-100/50 dark:bg-rose-900/20'}`}>
                        <p className="text-[11px] font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Phản hồi từ Leader</p>
                        <p className="text-sm">{appeal.response}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Điểm quá trình
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLeader ? 'Điểm được cập nhật tự động theo thời gian thực' : 'Theo dõi điểm quá trình của bạn'}
          </p>
        </div>
        {isLeader && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeightDialog(true)}>
              <Scale className="w-4 h-4 mr-1.5" />Trọng số
            </Button>
            <Button variant="outline" size="sm" onClick={fetchScoreData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />Làm mới
            </Button>
          </div>
        )}
      </div>

      {/* Pending appeals alert */}
      {isLeader && pendingAppealsCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm flex-1">
            Có <strong>{pendingAppealsCount}</strong> phúc khảo đang chờ xử lý
          </span>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setActiveTab('appeals')}>Xem ngay</Button>
        </div>
      )}

      {/* Main content */}
      {isLeader ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="stages" className="gap-1.5 text-xs">
              <FileText className="w-4 h-4" /><span className="hidden sm:inline">Chi tiết</span>
            </TabsTrigger>
            <TabsTrigger value="appeals" className="gap-1.5 text-xs">
              <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Phúc khảo</span>
              {pendingAppealsCount > 0 && <Badge variant="destructive" className="ml-0.5 px-1.5 py-0 text-[10px] h-4">{pendingAppealsCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History className="w-4 h-4" /><span className="hidden sm:inline">Lịch sử</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-5">{renderLeaderOverview()}</TabsContent>
          <TabsContent value="stages" className="mt-5">{renderLeaderDetail()}</TabsContent>
          <TabsContent value="appeals" className="mt-5">{renderLeaderAppeals()}</TabsContent>
          <TabsContent value="history" className="mt-5"><ScoreHistoryPanel history={history} members={members} isLeader={isLeader} /></TabsContent>
        </Tabs>
      ) : (
        <Tabs value={memberTab} onValueChange={setMemberTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="scores" className="gap-1.5"><Award className="w-4 h-4" />Điểm của tôi</TabsTrigger>
            <TabsTrigger value="appeals" className="gap-1.5">
              <MessageSquare className="w-4 h-4" />Phúc khảo
              {currentUserAppeals.filter(a => a.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-[10px] h-4">{currentUserAppeals.filter(a => a.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="scores" className="mt-4">{renderMemberScoresView()}</TabsContent>
          <TabsContent value="appeals" className="mt-4">{renderMemberAppealsView()}</TabsContent>
        </Tabs>
      )}

      {/* ── Dialogs ── */}
      {adjustmentDialog?.isOpen && (
        <ScoreAdjustmentDialog isOpen={true} onClose={() => setAdjustmentDialog(null)} onSave={handleAdjustScore}
          title={adjustmentDialog.type === 'task' ? 'Điều chỉnh điểm Task' : adjustmentDialog.type === 'stage' ? 'Điều chỉnh điểm Giai đoạn' : 'Điều chỉnh điểm Quá trình'}
          currentScore={adjustmentDialog.currentScore} memberName={adjustmentDialog.memberName} isLoading={isProcessing} />
      )}

      {appealDialog?.isOpen && (
        <AppealDialog isOpen={true} onClose={() => setAppealDialog(null)} onSubmit={handleSubmitAppeal}
          title="Gửi phúc khảo" description="Trình bày lý do và đính kèm minh chứng để phúc khảo điểm"
          currentScore={appealDialog.currentScore} adjustment={appealDialog.adjustment} adjustmentReason={appealDialog.adjustmentReason} isLoading={isProcessing} />
      )}

      {reviewDialog.isOpen && (
        <AppealReviewDialog isOpen={true} onClose={() => setReviewDialog({ isOpen: false, appeal: null })} appeal={reviewDialog.appeal}
          onApprove={(response) => handleAppealResponse(true, response)} onReject={(response) => handleAppealResponse(false, response)} isLoading={isProcessing} />
      )}

      <StageWeightDialog isOpen={weightDialog} onClose={() => setWeightDialog(false)} onSave={handleSaveWeights} stages={stages} currentWeights={stageWeights} isLoading={isProcessing} />

      <TaskScoringDialog isOpen={taskScoringDialog.isOpen} onClose={() => setTaskScoringDialog({ isOpen: false, task: null })} task={taskScoringDialog.task} members={members} taskScores={taskScores} onScoreUpdated={fetchScoreData} />

      {/* Adjustment detail dialog */}
      {adjustmentDetailDialog && (
        <Dialog open={adjustmentDetailDialog.isOpen} onOpenChange={(open) => !open && setAdjustmentDetailDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-primary" />
                {adjustmentDetailDialog.title}
              </DialogTitle>
              <DialogDescription>Chi tiết về điểm và điều chỉnh</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Điểm gốc</p>
                  <p className="text-2xl font-bold tabular-nums">{adjustmentDetailDialog.baseScore.toFixed(1)}</p>
                </div>
                <div className={`p-4 rounded-xl text-center border ${getScoreTier(adjustmentDetailDialog.score).bg} ${getScoreTier(adjustmentDetailDialog.score).border}`}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Hiện tại</p>
                  <p className={`text-2xl font-bold tabular-nums ${getScoreTier(adjustmentDetailDialog.score).color}`}>{adjustmentDetailDialog.score.toFixed(1)}</p>
                </div>
              </div>
              {adjustmentDetailDialog.adjustment !== 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Điều chỉnh:</span>
                      <AdjustmentPill adjustment={adjustmentDetailDialog.adjustment} />
                    </div>
                    {adjustmentDetailDialog.reason && (
                      <div className={`p-3 rounded-xl border ${adjustmentDetailDialog.adjustment < 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'}`}>
                        <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-muted-foreground">
                          {adjustmentDetailDialog.adjustment < 0 ? 'Lý do trừ điểm' : 'Lý do cộng điểm'}
                        </p>
                        <p className="text-sm">{adjustmentDetailDialog.reason}</p>
                      </div>
                    )}
                    {adjustmentDetailDialog.adjustedAt && (
                      <p className="text-[10px] text-muted-foreground text-right">
                        Điều chỉnh lúc: {new Date(adjustmentDetailDialog.adjustedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
