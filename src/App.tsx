import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import RecipesPage from "./pages/RecipesPage";
import GeneratorPage from "./pages/GeneratorPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import AchievementsPage from "./pages/AchievementsPage";
import NotificationsPage from "./pages/NotificationsPage";
import UserProfilePage from "./pages/UserProfilePage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
