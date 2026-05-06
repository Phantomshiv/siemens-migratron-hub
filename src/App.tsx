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
import BackstageDashboard from "./pages/BackstageDashboard.tsx";
import CommunicationGrowth from "./pages/CommunicationGrowth.tsx";
import ClientManagement from "./pages/ClientManagement.tsx";
import BudgetDashboard from "./pages/BudgetDashboard.tsx";
import PeopleDashboard from "./pages/PeopleDashboard.tsx";
import CybersecurityDashboard from "./pages/CybersecurityDashboard.tsx";
import ArchitectureDashboard from "./pages/ArchitectureDashboard.tsx";
import SnapshotAI from "./pages/SnapshotAI.tsx";
import OKRsDashboard from "./pages/OKRs.tsx";
import SREIncidents from "./pages/SREIncidents.tsx";
import NotFound from "./pages/NotFound.tsx";
import { RepoProvenanceSettingsProvider } from "./contexts/RepoProvenanceSettingsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <RepoProvenanceSettingsProvider>
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
            <Route path="/backstage" element={<BackstageDashboard />} />
            <Route path="/communication" element={<CommunicationGrowth />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/budget" element={<BudgetDashboard />} />
            <Route path="/people" element={<PeopleDashboard />} />
            <Route path="/cybersecurity" element={<CybersecurityDashboard />} />
            <Route path="/architecture" element={<ArchitectureDashboard />} />
            <Route path="/snapshots" element={<SnapshotAI />} />
            <Route path="/okrs" element={<OKRsDashboard />} />
            <Route path="/sre" element={<SREIncidents />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </RepoProvenanceSettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
