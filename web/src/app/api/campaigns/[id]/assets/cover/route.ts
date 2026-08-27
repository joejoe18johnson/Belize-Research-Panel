import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { getSessionAccount } from "@/lib/auth";
import { loadCampaignCoverAsset } from "@/lib/campaign-branding-server";
import { findCampaignById } from "@/lib/campaigns";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { cleanText } from "@/lib/validation";

async function canAccessCampaignCover(campaignId: string): Promise<boolean> {
  if (await isAdminSessionActive()) return true;

  const account = await getSessionAccount();
  if (!account) return false;

  const email = cleanText(account.email).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  return assignments.some(
    (record) => record.id === campaignId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!(await canAccessCampaignCover(id))) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const campaign = await findCampaignById(id);
  const asset = await loadCampaignCoverAsset(id, campaign?.coverImageFile ?? "");
  if (!asset) {
    return NextResponse.json({ ok: false, message: "Cover image not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.buffer), {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Disposition": `inline; filename="${asset.filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
