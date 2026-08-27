import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { removeCampaignCoverAsset, saveCampaignCoverAsset } from "@/lib/campaign-branding-server";
import { findCampaignById, updateCampaignCoverImage } from "@/lib/campaigns";
import { cleanText } from "@/lib/validation";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const campaign = await findCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const removeCover = cleanText(String(formData.get("removeCover") ?? "")) === "true";
    const cover = formData.get("cover");

    let coverImageFile = campaign.coverImageFile ?? "";

    if (removeCover) {
      await removeCampaignCoverAsset(id);
      coverImageFile = "";
    }

    if (cover instanceof File && cover.size > 0) {
      if (cover.size > MAX_COVER_BYTES) {
        return NextResponse.json({ ok: false, message: "Cover image must be 5 MB or smaller." }, { status: 400 });
      }
      const buffer = Buffer.from(await cover.arrayBuffer());
      coverImageFile = await saveCampaignCoverAsset(id, buffer, cover.name);
    }

    const updated = await updateCampaignCoverImage(id, coverImageFile);
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/campaigns/create");
    revalidatePath("/dashboard/surveys");

    return NextResponse.json({ ok: true, campaign: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update campaign cover.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
