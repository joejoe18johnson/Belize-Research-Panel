import { NextResponse } from "next/server";
import { canAccessCampaignBranding } from "@/lib/campaign-branding-access";
import { loadCampaignCoverAsset } from "@/lib/campaign-branding-server";
import { findCampaignById } from "@/lib/campaigns";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!(await canAccessCampaignBranding(id))) {
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
