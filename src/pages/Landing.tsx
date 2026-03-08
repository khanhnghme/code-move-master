import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield, Loader2, X, ChevronRight, ChevronLeft, CheckCircle2, BarChart3, ListChecks, Clock, Award, Globe, MessageSquare, FileText, Zap, Lock, Upload, TrendingUp, AlertTriangle, Star, Bell, FolderOpen, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import uehLogo from '@/assets/ueh-logo-new.png';
import introPage1 from '@/assets/intro-page1-overview.png';
import introPage2 from '@/assets/intro-page2-tasks.png';
import introPage3 from '@/assets/intro-page3-scoring.png';
import introPage4 from '@/assets/intro-page4-project.png';
import introPage5 from '@/assets/intro-page5-advanced.png';
import introP1Workflow from '@/assets/intro-p1-workflow.png';
import introP1Roles from '@/assets/intro-p1-roles.png';
import introP1Features from '@/assets/intro-p1-features.png';
import introP1Multiplatform from '@/assets/intro-p1-multiplatform.png';
import introP2Kanban from '@/assets/intro-p2-kanban.png';
import introP2Deadline from '@/assets/intro-p2-deadline.png';
import introP2Submission from '@/assets/intro-p2-submission.png';
import introP2Notes from '@/assets/intro-p2-notes.png';
import introP3Formula from '@/assets/intro-p3-formula.png';
import introP3Weights from '@/assets/intro-p3-weights.png';
import introP3Appeal from '@/assets/intro-p3-appeal.png';
import introP3Leaderboard from '@/assets/intro-p3-leaderboard.png';
import introP4Team from '@/assets/intro-p4-team.png';
import introP4Stages from '@/assets/intro-p4-stages.png';
import introP4Resources from '@/assets/intro-p4-resources.png';
import introP4Sharing from '@/assets/intro-p4-sharing.png';

/* ─── Intro Images ─── */
type IntroImages = Record<string, string>;
const STATIC_INTRO_IMAGES: IntroImages = {
  page1: introPage1,
  page2: introPage2,
  page3: introPage3,
  page4: introPage4,
  page5: introPage5,
};

const IntroHeroImage = React.forwardRef<HTMLDivElement, { imageUrl?: string; fallbackGradient: string; alt: string }>(
  function IntroHeroImage({ imageUrl, fallbackGradient, alt }, ref) {
    const [loaded, setLoaded] = useState(false);

    if (!imageUrl) {
      return (
        <div ref={ref} className={`w-full h-full rounded-xl ${fallbackGradient} border border-border/30 flex items-center justify-center`}>
          <Zap className="w-5 h-5 opacity-40 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div ref={ref} className="w-full h-full relative rounded-xl overflow-hidden">
        {!loaded && <div className="absolute inset-0 rounded-xl bg-muted animate-pulse" />}
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover rounded-xl transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }
);
/* ─── Visual Page Components ─── */

function Page1Overview({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Title */}
      <div className="text-center flex-shrink-0">
        <h3 className="text-2xl font-bold text-foreground">Tổng quan hệ thống</h3>
        <p className="text-xs text-muted-foreground">Teamworks UEH — Nền tảng quản lý công việc nhóm cho sinh viên</p>
      </div>

      {/* Hero + Workflow row */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Hero overview */}
        <div className="w-[35%] flex-shrink-0 rounded-xl overflow-hidden" style={{ animation: 'fade-in 0.4s ease-out both' }}>
          <img src={introPage1} alt="Tổng quan" className="w-full h-full object-cover rounded-xl" />
        </div>

        {/* Right: Grid of feature images */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
          {/* Workflow */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative group" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
            <img src={introP1Workflow} alt="Quy trình làm việc" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Quy trình làm việc</p>
            </div>
          </div>

          {/* Roles */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative group" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
            <img src={introP1Roles} alt="Vai trò hệ thống" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Vai trò hệ thống</p>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative group" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
            <img src={introP1Features} alt="Tính năng nổi bật" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Tính năng nổi bật</p>
            </div>
          </div>

          {/* Multi-platform */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative group" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
            <img src={introP1Multiplatform} alt="Đa nền tảng" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Đa nền tảng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page2Tasks({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Title */}
      <div className="text-center flex-shrink-0">
        <h3 className="text-2xl font-bold text-foreground">Quản lý Task</h3>
        <p className="text-xs text-muted-foreground">Phân công, theo dõi và hoàn thành công việc hiệu quả</p>
      </div>

      {/* Image grid */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Hero task image */}
        <div className="w-[35%] flex-shrink-0 rounded-xl overflow-hidden" style={{ animation: 'fade-in 0.4s ease-out both' }}>
          <img src={introPage2} alt="Quản lý Task" className="w-full h-full object-cover rounded-xl" />
        </div>

        {/* Right: Grid of feature images */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
          {/* Kanban */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
            <img src={introP2Kanban} alt="Kanban Board" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Kanban Board</p>
            </div>
          </div>

          {/* Deadline */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
            <img src={introP2Deadline} alt="Deadline & Timeline" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Deadline & Timeline</p>
            </div>
          </div>

          {/* Submission */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
            <img src={introP2Submission} alt="Nộp bài đa hình thức" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Nộp bài đa hình thức</p>
            </div>
          </div>

          {/* Notes & Comments */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
            <img src={introP2Notes} alt="Ghi chú & Bình luận" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Ghi chú & Bình luận</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page3Scoring({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Title */}
      <div className="text-center flex-shrink-0">
        <h3 className="text-2xl font-bold text-foreground">Hệ thống chấm điểm</h3>
        <p className="text-xs text-muted-foreground">Tính điểm tự động, công bằng và minh bạch</p>
      </div>

      {/* Image grid */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Hero scoring image */}
        <div className="w-[35%] flex-shrink-0 rounded-xl overflow-hidden" style={{ animation: 'fade-in 0.4s ease-out both' }}>
          <img src={introPage3} alt="Hệ thống chấm điểm" className="w-full h-full object-cover rounded-xl" />
        </div>

        {/* Right: Grid of feature images */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
          {/* Formula */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
            <img src={introP3Formula} alt="Công thức tính điểm" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Công thức tính điểm</p>
            </div>
          </div>

          {/* Weights */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
            <img src={introP3Weights} alt="Trọng số & So sánh" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Trọng số & So sánh</p>
            </div>
          </div>

          {/* Appeal */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
            <img src={introP3Appeal} alt="Khiếu nại điểm" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Khiếu nại điểm</p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20 relative" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
            <img src={introP3Leaderboard} alt="Bảng xếp hạng" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">Bảng xếp hạng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page4Project({ images }: { images: IntroImages }) {
  const features = [
    { img: introP4Team, label: 'Cấu trúc nhóm' },
    { img: introP4Stages, label: 'Giai đoạn dự án' },
    { img: introP4Resources, label: 'Tài nguyên dự án' },
    { img: introP4Sharing, label: 'Chia sẻ & Công khai' },
  ];

  return (
    <div className="flex gap-3 flex-1 min-h-0">
      {/* Hero image */}
      <div className="w-[35%] flex-shrink-0 rounded-xl overflow-hidden" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <img src={introPage4} alt="Quản lý dự án" className="w-full h-full object-cover" />
      </div>

      {/* 2x2 feature grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
        {features.map((f, i) => (
          <div
            key={i}
            className="relative group rounded-xl overflow-hidden border border-border/40"
            style={{ animation: `fade-in 0.4s ease-out ${100 + i * 100}ms both` }}
          >
            <img src={f.img} alt={f.label} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent px-3 py-2">
              <p className="text-xs font-semibold text-foreground">{f.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Page5Advanced({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="h-[38%] min-h-[180px] flex-shrink-0" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <IntroHeroImage
          imageUrl={images.page5}
          fallbackGradient="bg-gradient-to-br from-accent/15 via-primary/10 to-purple-500/10"
          alt="Tính năng nâng cao AI và bảo mật"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Tính năng nâng cao</h3>
        <p className="text-sm text-muted-foreground">Công cụ hỗ trợ chuyên nghiệp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* Chat */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <MessageSquare className="w-3 h-3 inline mr-1" />Giao tiếp nhóm
          </p>
          <div className="bg-background rounded-lg border border-border/50 p-2 space-y-1.5">
            <div className="flex gap-1.5 items-start">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[7px] text-primary-foreground font-bold">A</span>
              </div>
              <div className="bg-primary/10 rounded-lg px-2 py-1">
                <p className="text-[9px] text-foreground">Cập nhật tiến độ tuần này nhé!</p>
              </div>
            </div>
            <div className="flex gap-1.5 items-start flex-row-reverse">
              <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-[7px] font-bold">B</span>
              </div>
              <div className="bg-muted rounded-lg px-2 py-1">
                <p className="text-[9px] text-foreground">Em đã hoàn thành ✅</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-1.5">
            <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Bell className="w-2.5 h-2.5" />Thông báo realtime</span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />@mention</span>
          </div>
        </div>

        {/* AI */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3 inline mr-1" />AI Assistant
          </p>
          <div className="bg-background rounded-lg border border-border/50 p-2 space-y-1.5">
            <div className="flex gap-1.5 items-start flex-row-reverse">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[7px] text-primary-foreground font-bold">?</span>
              </div>
              <div className="bg-muted rounded-lg px-2 py-1">
                <p className="text-[9px] text-foreground">Nhóm mình tiến độ thế nào?</p>
              </div>
            </div>
            <div className="flex gap-1.5 items-start">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Zap className="w-2 h-2 text-white" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-lg px-2 py-1 flex-1">
                <p className="text-[9px] text-foreground leading-relaxed">
                  📊 Hoàn thành <span className="font-bold text-primary">8/12 tasks</span> (67%)
                  <br />⚠️ <span className="text-destructive font-bold">2 tasks trễ</span>
                </p>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5">Powered by Gemini AI</p>
        </div>

        {/* Export + Security */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3 md:col-span-2" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <FileText className="w-3 h-3 inline mr-1" />Xuất báo cáo
              </p>
              <div className="space-y-1">
                {[
                  { type: 'PDF', icon: '📄', name: 'Nhật ký hoạt động' },
                  { type: 'Excel', icon: '📊', name: 'Bảng điểm chi tiết' },
                  { type: 'ZIP', icon: '📦', name: 'Minh chứng dự án' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-sm">{r.icon}</span>
                    <span className="text-[10px] font-medium text-foreground flex-1">{r.name}</span>
                    <span className="text-[8px] font-bold bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Lock className="w-3 h-3 inline mr-1" />Bảo mật
              </p>
              <div className="space-y-1">
                {[
                  'Row Level Security',
                  'Role-based Access',
                  'Activity Logging',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-0.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="text-[10px] text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const introPageComponents = [Page1Overview, Page2Tasks, Page3Scoring, Page4Project, Page5Advanced];

export default function Landing() {
  const [isInitializing, setIsInitializing] = useState(false);
  const introImages = STATIC_INTRO_IMAGES;
  const [showIntro, setShowIntro] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<'next' | 'prev'>('next');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Fetch video background settings
  useEffect(() => {
    const fetchSettings = async () => {
      const videoRes = await supabase.from('system_settings').select('value').eq('key', 'dashboard_video_bg').maybeSingle();
      if (videoRes.data?.value) {
        const val = videoRes.data.value as { enabled?: boolean; landing_opacity?: number; opacity?: number; url?: string };
        setVideoEnabled(val.enabled ?? false);
        setVideoOpacity(val.landing_opacity ?? val.opacity ?? 0.2);
        setVideoUrl(val.url ?? '');
      }
    };
    fetchSettings();
  }, []);

  const openIntro = () => {
    setCurrentPage(0);
    setShowIntro(true);
    requestAnimationFrame(() => setIntroVisible(true));
  };

  const closeIntro = () => {
    setIntroVisible(false);
    setTimeout(() => setShowIntro(false), 400);
  };

  const goPage = useCallback((dir: 'next' | 'prev') => {
    setPageDirection(dir);
    setCurrentPage((p) => dir === 'next' ? Math.min(p + 1, introPageComponents.length - 1) : Math.max(p - 1, 0));
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeIntro();
      if (e.key === 'ArrowRight') goPage('next');
      if (e.key === 'ArrowLeft') goPage('prev');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showIntro, goPage]);

  const handleInitAdmin = async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ensure-admin');
      if (error) throw error;
      if (data?.success) toast.success(data.message || 'Khởi tạo admin thành công!');
      else toast.error(data?.error || 'Có lỗi xảy ra');
    } catch (error: any) {
      toast.error('Lỗi kết nối: ' + (error.message || 'Không thể khởi tạo admin'));
    } finally {
      setIsInitializing(false);
    }
  };

  const PageComponent = introPageComponents[currentPage];
  const pageTitles = ['Tổng quan', 'Task', 'Chấm điểm', 'Dự án', 'Nâng cao'];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Video Background */}
      {videoEnabled && videoUrl && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="fixed inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000"
            style={{ opacity: videoOpacity, zIndex: 0 }}
            src={videoUrl}
            onLoadedData={(e) => {
              const vid = e.currentTarget;
              vid.style.opacity = '0';
              requestAnimationFrame(() => { vid.style.opacity = String(videoOpacity); });
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ 
              zIndex: 1,
              background: 'linear-gradient(to bottom, hsl(var(--background) / 0.4) 0%, hsl(var(--background) / 0.7) 50%, hsl(var(--background) / 0.5) 100%)'
            }}
          />
        </>
      )}
      <div className="relative flex flex-col flex-1 min-h-screen" style={{ zIndex: 2 }}>
      {/* Header */}
      <header className="border-b bg-primary/90 backdrop-blur-md text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={uehLogo} alt="UEH logo" className="h-8 w-auto drop-shadow-md" loading="lazy" />
            <div className="hidden sm:block h-8 w-px bg-primary-foreground/30" />
            <span className="hidden sm:block font-heading font-semibold text-lg">Teamworks UEH</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleInitAdmin} disabled={isInitializing}
              className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs gap-1 h-8 px-2"
              title="Khởi tạo tài khoản Admin">
              {isInitializing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
              <span className="hidden sm:inline">Init</span>
            </Button>
            <Link to="/auth">
              <Button variant="secondary" className="font-medium">
                Đăng nhập <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className="bg-primary/90 backdrop-blur-md text-primary-foreground border-b border-primary/40">
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm">
          <span className="font-medium">Liên hệ Admin phụ trách hệ thống:</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Email: <span className="font-semibold">khanhngh.ueh@gmail.com</span></span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  <Users className="w-4 h-4" /> Dành cho sinh viên UEH
                </div>
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Effective Team{' '}<span className="text-gradient">Task Management System</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Nền tảng số giúp sinh viên quản lý công việc nhóm một cách minh bạch, công bằng với hệ thống tính điểm tự động.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full text-base font-semibold px-8">
                      Đăng nhập hệ thống <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="flex gap-8 pt-8 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">Đồ án Sinh viên</p>
                  <p className="text-sm font-medium text-foreground">Mục đích Học tập</p>
                  <p className="text-sm font-medium text-foreground">Phi thương mại</p>
                </div>
              </div>

              {/* Explore button */}
              {/* Explore button — premium typographic style */}
              <div className="hidden lg:flex items-center justify-center" style={{ animation: 'fade-in 0.8s ease-out 0.2s both' }}>
                <div className="relative flex flex-col items-center gap-10">
                  {/* Ambient glow */}
                  <div className="absolute -inset-16 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
                  
                  <button onClick={openIntro} className="group relative cursor-pointer focus:outline-none">
                    {/* Main text */}
                    <span className="relative z-10 block text-[2.5rem] font-heading font-semibold tracking-[0.3em] uppercase select-none overflow-hidden group-hover:tracking-[0.4em] transition-all duration-700">
                      <span className="text-muted-foreground/30 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-700">Khám phá</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
                    </span>
                    {/* Underline draw animation */}
                    <span className="block h-[3px] bg-primary/20 group-hover:bg-primary transition-colors duration-500 mt-3 relative overflow-hidden">
                      <span className="absolute inset-y-0 left-0 w-0 bg-primary group-hover:w-full transition-all duration-700 ease-out" />
                    </span>
                    {/* Subtitle */}
                    <span className="block mt-4 text-xs tracking-[0.25em] uppercase text-muted-foreground/50 group-hover:text-muted-foreground group-hover:tracking-[0.35em] transition-all duration-500 text-center">
                      Tìm hiểu hệ thống
                      <ArrowRight className="w-3.5 h-3.5 inline ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  </button>

                  <div className="flex items-center gap-3 text-muted-foreground/25">
                    <span className="w-16 h-px bg-current" />
                    <span className="text-[9px] tracking-[0.4em] uppercase font-medium">ver 5.0</span>
                    <span className="w-16 h-px bg-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-primary/90 backdrop-blur-md text-primary-foreground py-6 mt-8">
        <div className="container mx-auto px-4 space-y-4 text-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={uehLogo} alt="UEH logo" className="h-8 w-auto" loading="lazy" />
              <span className="text-xs md:text-sm">© 2025 Teamworks UEH — Hệ thống quản lý công việc nhóm cho sinh viên UEH.</span>
            </div>
            <p className="text-xs md:text-sm text-primary-foreground/90 text-center md:text-right max-w-md">
              Teamworks hỗ trợ chia task, theo dõi tiến độ, tính điểm từng thành viên và tổng kết theo giai đoạn.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm text-primary-foreground/90">
            <span>Đơn vị: Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH).</span>
            <span>Góp ý &amp; báo lỗi: <span className="font-semibold">khanhngh.ueh@gmail.com</span></span>
          </div>
        </div>
      </footer>

      {/* Intro Overlay — 16:9 */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-[400ms] ${introVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'}`}
          onClick={closeIntro}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-background rounded-xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500 ease-out ${introVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
            style={{ width: '1280px', maxWidth: '95vw', height: '720px', maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent opacity-95" />
              <div className="relative px-6 py-3 text-primary-foreground flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={uehLogo} alt="UEH" className="h-5 w-auto" />
                  <div className="h-4 w-px bg-primary-foreground/30" />
                  <div>
                    <h2 className="text-sm font-bold">Giới thiệu Teamworks UEH</h2>
                    <p className="text-primary-foreground/70 text-[10px]">Trang {currentPage + 1} / {introPageComponents.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Page tabs */}
                  <div className="hidden md:flex gap-1">
                    {pageTitles.map((title, i) => (
                      <button key={i}
                        onClick={() => { setPageDirection(i > currentPage ? 'next' : 'prev'); setCurrentPage(i); }}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${i === currentPage ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/50 hover:text-primary-foreground/80'}`}
                      >{title}</button>
                    ))}
                  </div>
                  <button onClick={closeIntro} className="w-7 h-7 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Page body */}
            <div className="flex-1 overflow-y-auto">
              <div key={currentPage} className="p-6 h-full" style={{
                animation: pageDirection === 'next' ? 'slide-in-from-right 0.35s ease-out both' : 'slide-in-from-left 0.35s ease-out both',
              }}>
                <PageComponent images={introImages} />
              </div>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-4 w-4 rounded-sm bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-primary">U</span>
                </div>
                <span>Đồ án sinh viên · Phi thương mại</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => goPage('prev')} className="gap-1 h-8">
                  <ChevronLeft className="w-4 h-4" /> Trước
                </Button>
                {currentPage < introPageComponents.length - 1 ? (
                  <Button size="sm" onClick={() => goPage('next')} className="gap-1 h-8">
                    Tiếp theo <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Link to="/auth" onClick={closeIntro}>
                    <Button size="sm" className="gap-1 h-8 shadow-md">
                      Bắt đầu sử dụng <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slide-in-from-right {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-from-left {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes grow-height {
          from { height: 0; }
        }
        @keyframes grow-width {
          from { width: 0; }
        }
      `}</style>
      </div>
    </div>
  );
}
