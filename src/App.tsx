import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { FilePreviewProvider } from "@/contexts/FilePreviewContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import MemberManagement from "./pages/MemberManagement";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import AdminActivity from "./pages/AdminActivity";
import AdminBackup from "./pages/AdminBackup";
import AdminSystem from "./pages/AdminSystem";
import Communication from "./pages/Communication";
import PublicProjectView from "./pages/PublicProjectView";
import FilePreview from "./pages/FilePreview";
import PersonalInfo from "./pages/PersonalInfo";
import ResetPassword from "./pages/ResetPassword";
import Utilities from "./pages/Utilities";
import PublicProfile from "./pages/PublicProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isApproved, profile } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  // If profile loaded and not approved, redirect to auth page which shows pending screen
  if (profile && !profile.is_approved) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Semantic URLs - clean, readable format */}
      <Route path="/p/:projectSlug" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/p/:projectSlug/t/:taskSlug" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/p/:projectSlug/t/:taskSlug/f/:fileIndex" element={<ProtectedRoute><FilePreview /></ProtectedRoute>} />
      <Route path="/s/:shareToken" element={<PublicProjectView />} />
      <Route path="/s/:shareToken/t/:taskSlug/f/:fileIndex" element={<FilePreview />} />
      {/* Legacy URLs - backward compatibility */}
      <Route path="/public/project/:shareToken" element={<PublicProjectView />} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/groups/:groupId/tasks/:taskId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      {/* Legacy file preview - backward compatibility */}
      <Route path="/file-preview" element={<FilePreview />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/member" element={<Navigate to="/auth" replace />} />
      <Route path="/auth/admin" element={<Navigate to="/auth" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MemberManagement /></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute><AdminActivity /></ProtectedRoute>} />
      <Route path="/admin/backup" element={<ProtectedRoute><AdminBackup /></ProtectedRoute>} />
      <Route path="/admin/system" element={<ProtectedRoute><AdminSystem /></ProtectedRoute>} />
      <Route path="/utilities" element={<ProtectedRoute><Utilities /></ProtectedRoute>} />
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NavigationProvider>
              <FilePreviewProvider>
                <AppRoutes />
              </FilePreviewProvider>
            </NavigationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
