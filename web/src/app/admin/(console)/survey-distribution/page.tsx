import { AdminSurveyDistributionDashboard } from "@/components/admin/survey-distribution/AdminSurveyDistributionDashboard";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Survey Distribution | Admin | Belize Research Panel",
};

export default async function AdminSurveyDistributionPage() {
  const [records, panelists] = await Promise.all([loadSurveyRecordsFromFile(), loadPanelists()]);

  if (records.length === 0 && panelists.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        No survey assignments or panelists available yet.
      </div>
    );
  }

  return <AdminSurveyDistributionDashboard records={records} panelists={panelists} />;
}
