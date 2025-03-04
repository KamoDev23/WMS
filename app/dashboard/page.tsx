// app/dashboard/page.tsx
import React from "react";
import AnalyticsSection from "../components/analytics/analytics-section";
import ProjectHistoryTable from "../components/project/project-history-table";

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen   p-6">
      {/* Future Sidebar will be added here */}
      <main>
        <AnalyticsSection />
        <ProjectHistoryTable />
      </main>
    </div>
  );
};

export default DashboardPage;
