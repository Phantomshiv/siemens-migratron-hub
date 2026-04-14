import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CloudUsage from "./pages/CloudUsage.tsx";
import JiraDashboard from "./pages/JiraDashboard.tsx";
import Capabilities from "./pages/Capabilities.tsx";
import ReleasesPage from "./pages/Releases.tsx";
import RoadmapPage from "./pages/RoadmapPage.tsx";
import RisksPage from "./pages/Risks.tsx";
import GitHubDashboard from "./pages/GitHubDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/metrics" element={<CloudUsage />} />
            <Route path="/jira" element={<JiraDashboard />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/releases" element={<ReleasesPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/risks" element={<RisksPage />} />
            <Route path="/github" element={<GitHubDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
