import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findClientUserById } from "@/lib/client-users";
import { createAndLaunchCampaign } from "@/lib/campaigns";
import type { CampaignRecord, CampaignTargeting, CreateCampaignInput } from "@/lib/campaign-targeting";
import { buildCampaignAssignmentLinks } from "@/lib/campaign-survey-links";
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

  const groupId = cleanText(String(body.groupId ?? ""));
  const groupName = cleanText(String(body.groupName ?? ""));

  return {
    mode,
    constituency: constituency || undefined,
    districts: districts.length ? districts : undefined,
    constituencies: constituencies.length ? constituencies : undefined,
    emails: emails.length ? emails : undefined,
    groupId: groupId || undefined,
    groupName: groupName || undefined,
  };
}

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const clientId = cleanText(String(body.clientId ?? ""));
    if (clientId) {
      const client = await findClientUserById(clientId);
      if (!client || client.status !== "active") {
        return NextResponse.json({ ok: false, message: "Selected client account was not found." }, { status: 400 });
      }
    }

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
      clientId,
    };

    const panelists = await loadPanelists();
    const result = await createAndLaunchCampaign(input, panelists);
    const origin = new URL(request.url).origin;
    const surveyLinks = buildCampaignAssignmentLinks(origin, result.campaign, result.assignedPanelists);

    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/campaigns/create");
    revalidatePath("/dashboard/surveys");

    return NextResponse.json({
      ok: true,
      campaign: result.campaign,
      assignedCount: result.assignedCount,
      skippedCount: result.skippedCount,
      surveyLinks,
      message: `Campaign launched to ${result.assignedCount} panelist(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create campaign.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
