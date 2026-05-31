import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

// Zustand Store & API
import { useAppStore } from "./lib/store";
import { authApi } from "./lib/api";

// Layout & Frame
import Layout from "./components/Layout";

// Platform Pages
import Index from "./pages/Index";
import DirectoryPage from "./pages/DirectoryPage";
import MentorsPage from "./pages/MentorsPage";
import ChatPage from "./pages/ChatPage";
import RoadmapPage from "./pages/RoadmapPage";
import EventsPage from "./pages/EventsPage";
import JobsPage from "./pages/JobsPage";
import AuthPage from "./pages/AuthPage";
import OnboardingWizard from "./pages/OnboardingWizard";
import AIChatbot from "./pages/AIChatbot";
import StoriesPage from "./pages/StoriesPage";
import MockInterviewsPage from "./pages/MockInterviewsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Route Guard: Protected Routes requiring Login
const ProtectedRoute = () => {
  const { user } = useAppStore();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Force onboarding wizard if profile incomplete
  if (!user.is_profile_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

// Route Guard: Admin only
const AdminRoute = () => {
  const { user } = useAppStore();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Session Checker on App Mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const me = await authApi.getMe();
        setUser(me);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center items-center gap-4 text-[#9ca3af]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366f1]" />
        <p className="text-xs font-bold uppercase tracking-widest">Checking session auth...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routing */}
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
        
        {/* Onboarding Wizard (Required for incomplete profiles) */}
        <Route path="/onboarding" element={user && !user.is_profile_complete ? <OnboardingWizard /> : <Navigate to="/" replace />} />

        {/* Protected Platforms Core Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/events" element={<EventsPage />} />
            
            {/* Real-time Socket DMs chat page */}
            <Route path="/chat" element={<ChatPage />} />
            
            {/* AI Advisor Chat bot & Resume analysis page */}
            <Route path="/ai-chat" element={<AIChatbot />} />
            
            {/* Timeline career roadmaps progress check-offs */}
            <Route path="/roadmap" element={<RoadmapPage />} />
            
            {/* Rich text blogs story wall */}
            <Route path="/stories" element={<StoriesPage />} />
            
            {/* Mock interviews booking marketplace */}
            <Route path="/mock-interviews" element={<MockInterviewsPage />} />
            
            {/* Placement trends analytic charts */}
            <Route path="/analytics" element={<AnalyticsPage />} />
            
            {/* Gamification scoreboard points badges shelf */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
            {/* Project Collaboration teams list boards */}
            <Route path="/projects" element={<ProjectsPage />} />
            
            {/* User configs settings profile edits */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Protected Administrator Dashboard Routing */}
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
