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
    <div className="h-full flex flex-col gap-4">
      {/* Hero Image */}
      <div className="h-[38%] min-h-[180px] flex-shrink-0" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <IntroHeroImage
          imageUrl={images.page1}
          fallbackGradient="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5"
          alt="Tổng quan hệ thống Teamworks UEH"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Tổng quan hệ thống</h3>
        <p className="text-sm text-muted-foreground">Teamworks UEH — Nền tảng quản lý công việc nhóm cho sinh viên</p>
      </div>

      {/* Compact flow */}
      <div className="flex items-center justify-between gap-1 px-2 py-3 bg-muted/30 rounded-xl border border-border/60" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
        {[
          { icon: Users, label: 'Tạo nhóm' },
          { icon: ListChecks, label: 'Phân công' },
          { icon: Upload, label: 'Nộp bài' },
          { icon: BarChart3, label: 'Chấm điểm' },
          { icon: FileText, label: 'Báo cáo' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-foreground">{step.label}</span>
            </div>
            {i < 4 && <ArrowRight className="w-3 h-3 text-primary/40 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-3 gap-3 flex-1" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vai trò</p>
          <div className="space-y-1.5">
            {[
              { role: 'Admin', color: 'text-destructive', desc: 'Quản trị hệ thống' },
              { role: 'Leader', color: 'text-primary', desc: 'Quản lý nhóm' },
              { role: 'Member', color: 'text-accent-foreground', desc: 'Thực hiện task' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`text-xs font-bold ${r.color}`}>{r.role}</span>
                <span className="text-[10px] text-muted-foreground">— {r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 border border-border/60 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tính năng</p>
          <div className="space-y-1.5">
            {[
              { icon: CheckCircle2, label: 'Chấm điểm tự động' },
              { icon: Globe, label: 'Chia sẻ công khai' },
              { icon: Zap, label: 'AI hỗ trợ' },
              { icon: Lock, label: 'Bảo mật RLS' },
              { icon: Bell, label: 'Thông báo realtime' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <f.icon className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 border border-border/60 rounded-xl p-3 flex flex-col items-center justify-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Đa nền tảng</p>
          <div className="flex gap-3 items-end">
            <div className="w-14 border-2 border-border rounded-md overflow-hidden">
              <div className="bg-primary h-1.5" />
              <div className="p-1 space-y-0.5"><div className="h-1 bg-muted rounded w-3/4" /><div className="h-4 bg-primary/10 rounded" /></div>
            </div>
            <div className="w-8 border-2 border-border rounded-md overflow-hidden">
              <div className="bg-primary h-1" />
              <div className="p-0.5"><div className="h-3 bg-primary/10 rounded" /></div>
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground mt-2">Desktop · Mobile</p>
        </div>
      </div>
    </div>
  );
}

function Page2Tasks({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="h-[38%] min-h-[180px] flex-shrink-0" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <IntroHeroImage
          imageUrl={images.page2}
          fallbackGradient="bg-gradient-to-br from-primary/15 via-blue-500/10 to-accent/10"
          alt="Quản lý Task với Kanban Board"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Quản lý Task</h3>
        <p className="text-sm text-muted-foreground">Phân công, theo dõi và hoàn thành công việc hiệu quả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* Mini Kanban */}
        <div className="bg-muted/20 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kanban Board — Kéo thả trạng thái</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { status: 'TODO', color: 'border-muted-foreground/30', items: 2 },
              { status: 'DOING', color: 'border-primary/40', items: 1 },
              { status: 'DONE', color: 'border-green-500/40', items: 1 },
              { status: 'VERIFIED', color: 'border-accent/40', items: 1 },
            ].map((col, ci) => (
              <div key={ci} className={`rounded-lg border-2 ${col.color} bg-background/50 p-1.5`}>
                <span className="text-[8px] font-bold uppercase text-foreground/60 block mb-1">{col.status}</span>
                {Array.from({ length: col.items }).map((_, i) => (
                  <div key={i} className="bg-muted/60 rounded h-4 mb-1" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Clock className="w-3 h-3 inline mr-1" />Timeline Deadline
          </p>
          <div className="space-y-2">
            {[
              { task: 'Phân tích yêu cầu', bar: 100, done: true },
              { task: 'Thiết kế mockup', bar: 65, done: false },
              { task: 'Viết báo cáo', bar: 20, done: false },
            ].map((t, i) => (
              <div key={i} className="space-y-0.5">
                <span className="text-[10px] text-foreground">{t.task}</span>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${t.done ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${t.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission types */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3 md:col-span-2" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Upload className="w-3 h-3 inline mr-1" />Hình thức nộp bài
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-background rounded-lg border border-border/50 p-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-foreground">Nộp bằng Link</p>
                <p className="text-[9px] text-muted-foreground">Google Docs, Drive, GitHub...</p>
              </div>
            </div>
            <div className="flex-1 bg-background rounded-lg border border-border/50 p-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-foreground">Upload File</p>
                <p className="text-[9px] text-muted-foreground">.docx .pdf .zip — Max 10MB</p>
              </div>
            </div>
            <div className="flex-1 bg-background rounded-lg border border-border/50 p-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-foreground">Lịch sử nộp</p>
                <p className="text-[9px] text-muted-foreground">Lưu mọi lần nộp, so sánh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page3Scoring({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="h-[38%] min-h-[180px] flex-shrink-0" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <IntroHeroImage
          imageUrl={images.page3}
          fallbackGradient="bg-gradient-to-br from-yellow-500/15 via-primary/10 to-accent/10"
          alt="Hệ thống chấm điểm tự động"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Hệ thống chấm điểm</h3>
        <p className="text-sm text-muted-foreground">Tính điểm tự động, công bằng và minh bạch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* Formula */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Công thức tính điểm Task</p>
          <div className="bg-background rounded-lg border border-primary/20 p-2 mb-2">
            <p className="text-center font-mono text-xs text-foreground">
              <span className="text-primary font-bold">Final</span> = Base − Late − Review + Early + Bug
            </p>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Base', value: 100, color: 'bg-primary', pct: 100 },
              { label: 'Late', value: -15, color: 'bg-destructive', pct: 15 },
              { label: 'Early', value: +5, color: 'bg-green-500', pct: 5 },
              { label: 'Bug', value: +3, color: 'bg-blue-500', pct: 3 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-medium text-muted-foreground w-8 text-right">{s.label}</span>
                <div className="flex-1 h-3 bg-muted/50 rounded overflow-hidden">
                  <div className={`h-full ${s.color} rounded`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className={`text-[10px] font-bold w-6 ${s.value >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {s.value > 0 ? '+' : ''}{s.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-foreground">Điểm cuối:</span>
            <span className="text-lg font-bold text-primary">88</span>
          </div>
        </div>

        {/* Stage weights + chart */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trọng số giai đoạn</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="20" strokeDasharray="75.4 251.2" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-accent" strokeWidth="20" strokeDasharray="50.27 251.2" strokeDashoffset="-75.4" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--chart-3, 142 71% 45%))" strokeWidth="20" strokeDasharray="37.7 251.2" strokeDashoffset="-125.67" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground">100%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { name: 'GĐ 1', weight: '30%', color: 'bg-primary' },
                { name: 'GĐ 2', weight: '20%', color: 'bg-accent' },
                { name: 'GĐ 3', weight: '15%', color: 'bg-green-500' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${s.color}`} />
                  <span className="text-[10px] text-foreground">{s.name}</span>
                  <span className="text-[10px] font-bold text-foreground">{s.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">So sánh điểm</p>
          <div className="flex items-end gap-2 h-[60px]">
            {[
              { name: 'An', score: 92 },
              { name: 'Bình', score: 85 },
              { name: 'Châu', score: 78 },
              { name: 'Dũng', score: 95 },
            ].map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[8px] font-bold text-foreground">{m.score}</span>
                <div className="w-full rounded-t bg-gradient-to-t from-primary to-primary/60" style={{ height: `${m.score * 0.55}%` }} />
                <span className="text-[8px] text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appeal process */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3 md:col-span-2" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3 h-3 inline mr-1" />Quy trình khiếu nại
          </p>
          <div className="flex items-center gap-2 justify-center">
            {[
              { step: '1', label: 'Gửi khiếu nại', color: 'bg-primary' },
              { step: '2', label: 'Leader xem xét', color: 'bg-accent' },
              { step: '3', label: 'Chấp nhận/Từ chối', color: 'bg-green-500' },
              { step: '4', label: 'Ghi log', color: 'bg-muted-foreground' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-5 h-5 rounded-full ${s.color} flex items-center justify-center`}>
                    <span className="text-[8px] text-white font-bold">{s.step}</span>
                  </div>
                  <span className="text-[9px] text-foreground text-center max-w-[70px]">{s.label}</span>
                </div>
                {i < 3 && <ArrowRight className="w-3 h-3 text-border flex-shrink-0 mt-[-10px]" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Page4Project({ images }: { images: IntroImages }) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="h-[38%] min-h-[180px] flex-shrink-0" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        <IntroHeroImage
          imageUrl={images.page4}
          fallbackGradient="bg-gradient-to-br from-primary/15 via-green-500/10 to-accent/10"
          alt="Quản lý dự án và nhóm"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Quản lý dự án</h3>
        <p className="text-sm text-muted-foreground">Tổ chức nhóm và tài nguyên hiệu quả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* Team structure */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Users className="w-3 h-3 inline mr-1" />Cấu trúc nhóm
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-foreground">Leader</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex gap-2">
              {['Bình', 'Châu', 'Dũng'].map((name, i) => (
                <div key={i} className="bg-background border border-border/60 rounded-lg px-2 py-1 text-center">
                  <div className="w-5 h-5 rounded-full bg-muted mx-auto mb-0.5 flex items-center justify-center text-[8px] font-bold">{name[0]}</div>
                  <p className="text-[9px] text-foreground">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <GitBranch className="w-3 h-3 inline mr-1" />Giai đoạn dự án
          </p>
          <div className="space-y-1.5">
            {[
              { name: 'Lập kế hoạch', progress: 100, tasks: 4 },
              { name: 'Phân tích & Thiết kế', progress: 75, tasks: 6 },
              { name: 'Triển khai', progress: 30, tasks: 8 },
              { name: 'Kiểm thử', progress: 0, tasks: 5 },
            ].map((stage, i) => (
              <div key={i} className="bg-background rounded-lg border border-border/50 p-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-foreground">{stage.name}</span>
                  <span className="text-[9px] text-muted-foreground">{stage.tasks} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stage.progress === 100 ? 'bg-green-500' : stage.progress > 0 ? 'bg-primary' : 'bg-muted-foreground/20'}`} style={{ width: `${stage.progress}%` }} />
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground">{stage.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3 md:col-span-2" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <FolderOpen className="w-3 h-3 inline mr-1" />Tài nguyên dự án
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: FolderOpen, name: 'Tài liệu', count: '12 files' },
              { icon: FileText, name: 'Báo cáo', count: '3 files' },
              { icon: Globe, name: 'Links', count: '7 links' },
              { icon: Upload, name: 'Minh chứng', count: '24 files' },
            ].map((folder, i) => (
              <div key={i} className="bg-background rounded-lg border border-border/50 p-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <folder.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">{folder.name}</p>
                  <p className="text-[9px] text-muted-foreground">{folder.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  const [introImages, setIntroImages] = useState<IntroImages>({});
  const [showIntro, setShowIntro] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<'next' | 'prev'>('next');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Fetch video background settings + intro images
  useEffect(() => {
    const fetchSettings = async () => {
      const [videoRes, imagesRes] = await Promise.all([
        supabase.from('system_settings').select('value').eq('key', 'dashboard_video_bg').maybeSingle(),
        supabase.from('system_settings').select('value').eq('key', 'intro_images').maybeSingle(),
      ]);
      if (videoRes.data?.value) {
        const val = videoRes.data.value as { enabled?: boolean; landing_opacity?: number; opacity?: number; url?: string };
        setVideoEnabled(val.enabled ?? false);
        setVideoOpacity(val.landing_opacity ?? val.opacity ?? 0.2);
        setVideoUrl(val.url ?? '');
      }
      if (imagesRes.data?.value) {
        setIntroImages(imagesRes.data.value as IntroImages);
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
