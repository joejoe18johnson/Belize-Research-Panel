import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { createAndLaunchCampaign } from "@/lib/campaigns";
import type { CampaignTargeting, CreateCampaignInput } from "@/lib/campaign-targeting";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { loadPanelists } from "@/lib/panelists";
import { cleanText } from "@/lib/validation";

function parseTargeting(body: Record<string, unknown>): CampaignTargeting {
  const mode = cleanText(String(body.targetMode ?? "all_verified")) as CampaignTargeting["mode"];
  const constituency = cleanText(String(body.constituency ?? ""));
  const districts = Array.isArray(body.districts)
    ? body.districts.map((value) => cleanText(String(value))).filter(Boolean)
    : [];
  const constituencies = Array.isArray(body.constituencies)
    ? body.constituencies.map((value) => cleanText(String(value))).filter(Boolean)
    : [];
  const emails = String(body.emails ?? "")
    .split(/[\n,;]+/)
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean);

  return {
    mode,
    constituency: constituency || undefined,
    districts: districts.length ? districts : undefined,
    constituencies: constituencies.length ? constituencies : undefined,
    emails: emails.length ? emails : undefined,
  };
}

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: CreateCampaignInput = {
      title: cleanText(String(body.title ?? "")),
      description: cleanText(String(body.description ?? "")),
      category: (cleanText(String(body.category ?? "civic")) || "civic") as SurveyCategory,
      deliveryType: cleanText(String(body.deliveryType ?? "external")) === "internal" ? "internal" : "external",
      surveyDefinitionId: cleanText(String(body.surveyDefinitionId ?? "")),
      surveyUrl: cleanText(String(body.surveyUrl ?? "")),
      points: Number(body.points ?? 100),
      assignedDate: cleanText(String(body.assignedDate ?? "")),
      completeByDate: cleanText(String(body.completeByDate ?? "")),
      deliveryMethod: cleanText(String(body.deliveryMethod ?? "External Survey Link")),
      targeting: parseTargeting(body),
    };

    const panelists = await loadPanelists();
    const result = await createAndLaunchCampaign(input, panelists);

    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/campaigns/create");
    revalidatePath("/dashboard/surveys");

    return NextResponse.json({
      ok: true,
      campaign: result.campaign,
      assignedCount: result.assignedCount,
      skippedCount: result.skippedCount,
      message: `Campaign launched to ${result.assignedCount} panelist(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create campaign.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
