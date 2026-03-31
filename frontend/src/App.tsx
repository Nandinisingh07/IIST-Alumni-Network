import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import DirectoryPage from "./pages/DirectoryPage";
import MentorsPage from "./pages/MentorsPage";
import ChatPage from "./pages/ChatPage";
import RoadmapPage from "./pages/RoadmapPage";
import EventsPage from "./pages/EventsPage";
import JobsPage from "./pages/JobsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
