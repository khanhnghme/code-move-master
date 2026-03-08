import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield, Loader2, X, ChevronRight, ChevronLeft, CheckCircle2, BarChart3, ListChecks, Clock, Award, Globe, MessageSquare, FileText, Zap, Lock, Upload, TrendingUp, AlertTriangle, Star, Bell, FolderOpen, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import uehLogo from '@/assets/ueh-logo-new.png';

/* ─── Visual Page Components ─── */

function Page1Overview() {
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Tổng quan hệ thống</h3>
        <p className="text-muted-foreground">Teamworks UEH — Nền tảng quản lý công việc nhóm</p>
      </div>

      {/* System flow diagram */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Flow diagram */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quy trình hoạt động</p>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {[
              { icon: Users, label: 'Tạo nhóm', sub: 'Leader tạo project' },
              { icon: ListChecks, label: 'Phân công', sub: 'Gán task & deadline' },
              { icon: Upload, label: 'Nộp bài', sub: 'Link / File upload' },
              { icon: BarChart3, label: 'Chấm điểm', sub: 'Tự động tính điểm' },
              { icon: FileText, label: 'Báo cáo', sub: 'Excel / PDF export' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{step.label}</span>
                  <span className="text-[10px] text-muted-foreground">{step.sub}</span>
                </div>
                {i < 4 && <ArrowRight className="w-4 h-4 text-primary/40 flex-shrink-0 mt-[-16px]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* User roles visual */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vai trò trong hệ thống</p>
            <div className="space-y-3">
              {[
                { role: 'Admin', color: 'bg-destructive/15 text-destructive border-destructive/20', desc: 'Quản trị toàn hệ thống' },
                { role: 'Leader', color: 'bg-primary/15 text-primary border-primary/20', desc: 'Quản lý nhóm & chấm điểm' },
                { role: 'Member', color: 'bg-accent/15 text-accent-foreground border-accent/30', desc: 'Thực hiện & nộp task' },
              ].map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${r.color}`}>
                  <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {r.role[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.role}</p>
                    <p className="text-[10px] opacity-70">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats preview */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tính năng nổi bật</p>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle2, label: 'Chấm điểm tự động', val: 'Realtime' },
                { icon: Globe, label: 'Chia sẻ công khai', val: 'Public link' },
                { icon: Zap, label: 'AI hỗ trợ', val: 'Gemini AI' },
                { icon: Lock, label: 'Bảo mật RLS', val: 'Row-level' },
                { icon: Bell, label: 'Thông báo', val: 'Realtime' },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <f.icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-foreground">{f.label}</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{f.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device support visual */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Đa nền tảng</p>
            <div className="flex flex-col items-center gap-3 pt-2">
              {/* Desktop mockup */}
              <div className="w-full max-w-[180px]">
                <div className="border-2 border-border rounded-lg overflow-hidden">
                  <div className="bg-primary h-2" />
                  <div className="p-2 space-y-1">
                    <div className="h-1.5 bg-muted rounded w-3/4" />
                    <div className="h-1.5 bg-muted rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <div className="h-6 bg-primary/10 rounded" />
                      <div className="h-6 bg-accent/10 rounded" />
                      <div className="h-6 bg-muted rounded" />
                    </div>
                  </div>
                </div>
                <div className="w-12 h-1 bg-border rounded-b mx-auto" />
              </div>
              <div className="flex gap-4 items-end">
                {/* Tablet */}
                <div className="w-14">
                  <div className="border-2 border-border rounded-md overflow-hidden">
                    <div className="bg-primary h-1" />
                    <div className="p-1 space-y-0.5">
                      <div className="h-1 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-primary/10 rounded" />
                    </div>
                  </div>
                </div>
                {/* Phone */}
                <div className="w-8">
                  <div className="border-2 border-border rounded-md overflow-hidden">
                    <div className="bg-primary h-0.5" />
                    <div className="p-0.5 space-y-0.5">
                      <div className="h-0.5 bg-muted rounded" />
                      <div className="h-2 bg-primary/10 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Desktop · Tablet · Mobile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page2Tasks() {
  const kanbanCols = [
    { status: 'TODO', color: 'border-muted-foreground/30', bg: 'bg-muted/40', items: ['Viết báo cáo chương 1', 'Tìm tài liệu tham khảo'] },
    { status: 'IN PROGRESS', color: 'border-primary/40', bg: 'bg-primary/5', items: ['Thiết kế mockup UI'] },
    { status: 'DONE', color: 'border-green-500/40', bg: 'bg-green-500/5', items: ['Phân tích yêu cầu'] },
    { status: 'VERIFIED', color: 'border-accent/40', bg: 'bg-accent/10', items: ['Lập kế hoạch dự án'] },
  ];

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Quản lý Task</h3>
        <p className="text-muted-foreground">Phân công, theo dõi và hoàn thành công việc</p>
      </div>

      {/* Mini Kanban Board */}
      <div className="bg-muted/20 border border-border/60 rounded-xl p-4 flex-shrink-0" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kanban Board — Kéo thả cập nhật trạng thái</p>
        <div className="grid grid-cols-4 gap-3">
          {kanbanCols.map((col, ci) => (
            <div key={ci} className={`rounded-lg border-2 ${col.color} ${col.bg} p-2.5`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{col.status}</span>
                <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded font-medium">{col.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {col.items.map((item, ii) => (
                  <div key={ii} className="bg-background rounded-md p-2 shadow-sm border border-border/40 text-[11px] text-foreground/80 leading-tight">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Deadline timeline */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5 inline mr-1.5" />
            Timeline Deadline
          </p>
          <div className="space-y-3">
            {[
              { task: 'Phân tích yêu cầu', date: '15/03', status: 'done', bar: 100 },
              { task: 'Thiết kế mockup', date: '22/03', status: 'progress', bar: 65 },
              { task: 'Viết báo cáo Ch.1', date: '30/03', status: 'upcoming', bar: 20 },
              { task: 'Tìm tài liệu', date: '05/04', status: 'upcoming', bar: 0 },
            ].map((t, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{t.task}</span>
                  <span className={`text-[10px] font-medium ${t.status === 'done' ? 'text-green-600' : t.status === 'progress' ? 'text-primary' : 'text-muted-foreground'}`}>{t.date}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${t.status === 'done' ? 'bg-green-500' : t.status === 'progress' ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                    style={{ width: `${t.bar}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission types */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Upload className="w-3.5 h-3.5 inline mr-1.5" />
            Hình thức nộp bài
          </p>
          <div className="space-y-2.5">
            {/* Link submission */}
            <div className="bg-background rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Nộp bằng Link</span>
              </div>
              <div className="bg-muted/50 rounded px-2 py-1.5 text-[10px] text-muted-foreground font-mono truncate">
                https://docs.google.com/document/d/1abc...
              </div>
            </div>
            {/* File upload */}
            <div className="bg-background rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Upload File</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded px-2 py-1 text-[10px] text-primary font-medium">.docx</div>
                <div className="bg-primary/10 rounded px-2 py-1 text-[10px] text-primary font-medium">.pdf</div>
                <div className="bg-primary/10 rounded px-2 py-1 text-[10px] text-primary font-medium">.zip</div>
                <span className="text-[10px] text-muted-foreground">Max 10MB</span>
              </div>
            </div>
            {/* History */}
            <div className="bg-background rounded-lg border border-border/50 p-3 flex items-center gap-3">
              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-foreground">Lịch sử nộp bài</span>
                <p className="text-[10px] text-muted-foreground">Lưu đầy đủ mọi lần nộp, so sánh phiên bản</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page3Scoring() {
  const scoreBreakdown = [
    { label: 'Base', value: 100, color: 'bg-primary' },
    { label: 'Late', value: -15, color: 'bg-destructive' },
    { label: 'Review', value: -5, color: 'bg-orange-500' },
    { label: 'Early', value: +5, color: 'bg-green-500' },
    { label: 'Bug', value: +3, color: 'bg-blue-500' },
  ];

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Hệ thống chấm điểm</h3>
        <p className="text-muted-foreground">Tính điểm tự động, công bằng và minh bạch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Score formula visual */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Công thức tính điểm Task</p>
          
          {/* Formula */}
          <div className="bg-background rounded-lg border border-primary/20 p-4 mb-4">
            <p className="text-center font-mono text-sm text-foreground">
              <span className="text-primary font-bold">Final</span> = Base − Late − Review + Early + Bug + Adjust
            </p>
          </div>

          {/* Bar breakdown */}
          <div className="space-y-2">
            {scoreBreakdown.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-muted-foreground w-12 text-right">{s.label}</span>
                <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden relative">
                  <div
                    className={`h-full ${s.color} rounded transition-all`}
                    style={{ width: `${Math.abs(s.value)}%`, animation: `grow-width 0.6s ease-out ${i * 100 + 200}ms both` }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 ${s.value >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {s.value > 0 ? '+' : ''}{s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Điểm cuối cùng:</span>
            <span className="text-2xl font-bold text-primary">88</span>
          </div>
        </div>

        {/* Stage weights pie chart visual */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Trọng số giai đoạn</p>
          
          {/* Visual pie chart using CSS */}
          <div className="flex items-center gap-6 mb-4">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="20" strokeDasharray="75.4 251.2" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-accent" strokeWidth="20" strokeDasharray="50.27 251.2" strokeDashoffset="-75.4" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--chart-3, 142 71% 45%))" strokeWidth="20" strokeDasharray="37.7 251.2" strokeDashoffset="-125.67" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--chart-4, 280 65% 60%))" strokeWidth="20" strokeDasharray="25.13 251.2" strokeDashoffset="-163.37" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">100%</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { name: 'Giai đoạn 1', weight: '30%', color: 'bg-primary' },
                { name: 'Giai đoạn 2', weight: '20%', color: 'bg-accent' },
                { name: 'Giai đoạn 3', weight: '15%', color: 'bg-green-500' },
                { name: 'Giai đoạn 4', weight: '10%', color: 'bg-purple-500' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${s.color} flex-shrink-0`} />
                  <span className="text-[11px] text-foreground flex-1">{s.name}</span>
                  <span className="text-[11px] font-bold text-foreground">{s.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final score formula */}
          <div className="bg-background rounded-lg border border-border/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Điểm tổng kết</p>
            <p className="font-mono text-xs text-foreground">
              Σ (Điểm_GĐ<sub>i</sub> × Trọng_số<sub>i</sub>) + Điều_chỉnh
            </p>
          </div>
        </div>

        {/* Score comparison chart */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
            Biểu đồ so sánh điểm thành viên
          </p>
          <div className="flex items-end gap-3 h-[110px] pt-2">
            {[
              { name: 'An', score: 92 },
              { name: 'Bình', score: 85 },
              { name: 'Châu', score: 78 },
              { name: 'Dũng', score: 95 },
              { name: 'Em', score: 70 },
            ].map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-foreground">{m.score}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-primary to-primary/60"
                  style={{ height: `${m.score * 0.9}%`, animation: `grow-height 0.5s ease-out ${i * 80 + 200}ms both` }}
                />
                <span className="text-[10px] text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appeal process */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
            Quy trình khiếu nại điểm
          </p>
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
            {[
              { step: '1', label: 'Gửi khiếu nại', desc: 'Kèm lý do & minh chứng', color: 'bg-primary' },
              { step: '2', label: 'Leader xem xét', desc: 'Đánh giá & phản hồi', color: 'bg-accent' },
              { step: '3', label: 'Chấp nhận / Từ chối', desc: 'Cập nhật điểm nếu hợp lệ', color: 'bg-green-500' },
              { step: '4', label: 'Ghi log lịch sử', desc: 'Mọi thay đổi được lưu lại', color: 'bg-muted-foreground' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0 relative">
                <div className={`w-4 h-4 rounded-full ${s.color} flex items-center justify-center absolute -left-[22px] top-0.5`}>
                  <span className="text-[8px] text-white font-bold">{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Page4Project() {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Quản lý dự án</h3>
        <p className="text-muted-foreground">Tổ chức nhóm và tài nguyên hiệu quả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Team org chart */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            Cấu trúc nhóm
          </p>
          <div className="flex flex-col items-center gap-3">
            {/* Leader */}
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg px-4 py-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Nguyễn Văn A</p>
                <p className="text-[10px] text-primary font-medium">Leader</p>
              </div>
            </div>
            {/* Connector lines */}
            <div className="flex items-center gap-0">
              <div className="w-px h-3 bg-border" />
            </div>
            <div className="flex items-start gap-1">
              <div className="w-16 h-px bg-border mt-0" />
              <div className="w-px h-3 bg-border -mt-px" />
              <div className="w-16 h-px bg-border mt-0" />
              <div className="w-px h-3 bg-border -mt-px" />
              <div className="w-16 h-px bg-border mt-0" />
            </div>
            {/* Members */}
            <div className="flex gap-3">
              {['Bình', 'Châu', 'Dũng'].map((name, i) => (
                <div key={i} className="bg-background border border-border/60 rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-foreground">{name}</p>
                    <p className="text-[9px] text-muted-foreground">Member</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage timeline */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <GitBranch className="w-3.5 h-3.5 inline mr-1.5" />
            Giai đoạn dự án
          </p>
          <div className="space-y-2.5">
            {[
              { name: 'Lập kế hoạch', range: '01/03 — 15/03', progress: 100, tasks: 4 },
              { name: 'Phân tích & Thiết kế', range: '16/03 — 31/03', progress: 75, tasks: 6 },
              { name: 'Triển khai', range: '01/04 — 20/04', progress: 30, tasks: 8 },
              { name: 'Kiểm thử & Báo cáo', range: '21/04 — 30/04', progress: 0, tasks: 5 },
            ].map((stage, i) => (
              <div key={i} className="bg-background rounded-lg border border-border/50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground">{stage.tasks} tasks</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.progress === 100 ? 'bg-green-500' : stage.progress > 0 ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{stage.progress}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{stage.range}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resource manager */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5 md:col-span-2" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <FolderOpen className="w-3.5 h-3.5 inline mr-1.5" />
            Quản lý tài nguyên dự án
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { icon: FolderOpen, name: 'Tài liệu', count: '12 files', size: '45 MB' },
              { icon: FileText, name: 'Báo cáo', count: '3 files', size: '8.2 MB' },
              { icon: Globe, name: 'Links', count: '7 links', size: '—' },
              { icon: Upload, name: 'Minh chứng', count: '24 files', size: '120 MB' },
            ].map((folder, i) => (
              <div key={i} className="bg-background rounded-lg border border-border/50 p-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <folder.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{folder.name}</p>
                  <p className="text-[10px] text-muted-foreground">{folder.count} · {folder.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Page5Advanced() {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">Tính năng nâng cao</h3>
        <p className="text-muted-foreground">Công cụ hỗ trợ chuyên nghiệp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Chat / Communication mockup */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 100ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
            Giao tiếp nhóm
          </p>
          <div className="bg-background rounded-lg border border-border/50 p-3 space-y-2.5 max-h-[140px]">
            {/* Chat bubbles */}
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-primary-foreground font-bold">A</span>
              </div>
              <div className="bg-primary/10 rounded-lg rounded-tl-sm px-2.5 py-1.5 max-w-[75%]">
                <p className="text-[10px] text-foreground">Mọi người cập nhật tiến độ task tuần này nhé!</p>
              </div>
            </div>
            <div className="flex gap-2 items-start flex-row-reverse">
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold">B</span>
              </div>
              <div className="bg-muted rounded-lg rounded-tr-sm px-2.5 py-1.5 max-w-[75%]">
                <p className="text-[10px] text-foreground">Em đã hoàn thành phần <span className="text-primary font-medium">@An</span> giao ạ ✅</p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-white font-bold">C</span>
              </div>
              <div className="bg-primary/10 rounded-lg rounded-tl-sm px-2.5 py-1.5 max-w-[75%]">
                <p className="text-[10px] text-foreground">Em cần thêm thời gian cho task "Thiết kế UI" 🙏</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Bell className="w-3 h-3" />
              Thông báo realtime
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              @mention thành viên
            </div>
          </div>
        </div>

        {/* AI Assistant mockup */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 200ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 inline mr-1.5" />
            AI Assistant
          </p>
          <div className="bg-background rounded-lg border border-border/50 p-3 space-y-2.5">
            {/* User question */}
            <div className="flex gap-2 items-start flex-row-reverse">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-primary-foreground font-bold">?</span>
              </div>
              <div className="bg-muted rounded-lg px-2.5 py-1.5">
                <p className="text-[10px] text-foreground">Nhóm mình tiến độ thế nào?</p>
              </div>
            </div>
            {/* AI response */}
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5 flex-1">
                <p className="text-[10px] text-foreground leading-relaxed">
                  📊 Nhóm đã hoàn thành <span className="font-bold text-primary">8/12 tasks</span> (67%).
                  <br />⚠️ Có <span className="font-bold text-destructive">2 tasks trễ deadline</span>.
                  <br />💡 Nên ưu tiên task "Viết báo cáo" — deadline còn 3 ngày.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Powered by Gemini AI — phân tích & gợi ý thông minh</p>
        </div>

        {/* Export reports */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 300ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Xuất báo cáo
          </p>
          <div className="space-y-2">
            {[
              { type: 'PDF', icon: '📄', name: 'Nhật ký hoạt động', desc: 'Log toàn bộ hành động nhóm', color: 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20' },
              { type: 'Excel', icon: '📊', name: 'Bảng điểm chi tiết', desc: 'Điểm từng task, giai đoạn, tổng kết', color: 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20' },
              { type: 'ZIP', icon: '📦', name: 'Minh chứng dự án', desc: 'Tổng hợp file nộp & tài nguyên', color: 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20' },
            ].map((r, i) => (
              <div key={i} className={`rounded-lg border p-3 flex items-center gap-3 ${r.color}`}>
                <span className="text-lg">{r.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{r.name}</p>
                    <span className="text-[9px] font-bold bg-background/80 px-1.5 py-0.5 rounded">{r.type}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5" style={{ animation: 'fade-in 0.4s ease-out 400ms both' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5 inline mr-1.5" />
            Sao lưu & Bảo mật
          </p>
          <div className="space-y-3">
            {/* Backup visual */}
            <div className="bg-background rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Backup toàn bộ</p>
                  <p className="text-[10px] text-muted-foreground">Xuất file ZIP chứa mọi dữ liệu</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {['Tasks', 'Scores', 'Files', 'Logs'].map((item) => (
                  <span key={item} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{item}</span>
                ))}
              </div>
            </div>
            {/* Security layers */}
            <div className="space-y-1.5">
              {[
                { label: 'Row Level Security', desc: 'Bảo vệ dữ liệu ở cấp database' },
                { label: 'Role-based Access', desc: 'Phân quyền Admin / Leader / Member' },
                { label: 'Activity Logging', desc: 'Ghi log mọi thay đổi hệ thống' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-foreground">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">— {s.desc}</span>
                  </div>
                </div>
              ))}
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
  const [showIntro, setShowIntro] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<'next' | 'prev'>('next');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Fetch video background settings
  useEffect(() => {
    const fetchVideoSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'dashboard_video_bg')
        .maybeSingle();
      if (data?.value) {
        const val = data.value as { enabled?: boolean; landing_opacity?: number; opacity?: number; url?: string };
        setVideoEnabled(val.enabled ?? false);
        setVideoOpacity(val.landing_opacity ?? val.opacity ?? 0.2);
        setVideoUrl(val.url ?? '');
      }
    };
    fetchVideoSettings();
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
                <PageComponent />
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
