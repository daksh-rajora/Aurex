import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import TopNavbar from '../components/dashboard/TopNavbar.jsx';
import HeroWelcomeCard from '../components/dashboard/HeroWelcomeCard.jsx';
import StatsCards from '../components/dashboard/StatsCards.jsx';
import ActivityChart from '../components/dashboard/ActivityChart.jsx';
import RecentAnalysesTable from '../components/dashboard/RecentAnalysesTable.jsx';
import LanguageDistributionChart from '../components/dashboard/LanguageDistributionChart.jsx';
import AiHealthCard from '../components/dashboard/AiHealthCard.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import AiSuggestions from '../components/dashboard/AiSuggestions.jsx';
import DashboardFooter from '../components/dashboard/DashboardFooter.jsx';
import RepositoriesPage from './Repositories/RepositoriesPage.jsx';
import AnalysisReportPage from './Analysis/AnalysisReportPage.jsx';
import AnalysisLoadingPage from './Analysis/AnalysisLoadingPage.jsx';

export const Dashboard = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const isRepositoriesRoute = location.pathname.includes('/repositories');
  const isProgressRoute = location.pathname.includes('/progress');
  const isAnalysisRoute = location.pathname.includes('/analysis') && !isProgressRoute;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0B1020] text-slate-100 flex font-sans select-none">
      {/* 1. Fixed Left Sidebar (280px width) */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* 2. Main Layout Container (Offset by 280px sidebar width on desktop) */}
      <div className="flex-1 lg:ml-[280px] h-screen flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Navbar */}
        <TopNavbar
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          isMobileOpen={isMobileOpen}
        />

        {/* 3. Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 space-y-6">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            {isRepositoriesRoute ? (
              <RepositoriesPage />
            ) : isProgressRoute ? (
              <AnalysisLoadingPage />
            ) : isAnalysisRoute ? (
              <AnalysisReportPage />
            ) : (
              <>
                {/* Repository Analyzer Hero Card */}
                <HeroWelcomeCard />

                {/* Stats Cards (4) */}
                <StatsCards />

                {/* Main Section Split Grid (70% Left / 30% Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT (70% -> col-span-8) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Repository Activity Chart */}
                    <ActivityChart />

                    {/* Recent Repository Analyses Table */}
                    <RecentAnalysesTable />
                  </div>

                  {/* RIGHT (30% -> col-span-4) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Language Distribution Donut Chart */}
                    <LanguageDistributionChart />

                    {/* Overall AI Health Card */}
                    <AiHealthCard />

                    {/* Quick Actions */}
                    <QuickActions />

                    {/* Recent AI Suggestions */}
                    <AiSuggestions />
                  </div>
                </div>

                {/* Footer */}
                <DashboardFooter />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
