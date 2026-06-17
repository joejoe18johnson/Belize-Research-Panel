import Link from "next/link";
import { DashboardAlert } from "./DashboardShell";
import { formatHeadingCase } from "@/lib/sentence-case";

export function NewSurveyProfileBanner({ newSurveyCount }: { newSurveyCount: number }) {
  if (newSurveyCount <= 0) return null;

  return (
    <div className="mb-6">
      <DashboardAlert tone="warning" title={newSurveyCount === 1 ? "New survey invitation" : "New survey invitations"}>
        <p>
          {formatHeadingCase(
            newSurveyCount === 1
              ? "You have 1 new survey waiting in your inbox."
              : `You have ${newSurveyCount} new surveys waiting in your inbox.`
          )}{" "}
          <Link href="/dashboard/surveys" className="font-semibold underline">
            {formatHeadingCase("Go to surveys")}
          </Link>
        </p>
      </DashboardAlert>
    </div>
  );
}
