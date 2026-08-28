import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  removeCampaignBrandingAsset,
  saveCampaignBrandingAsset,
} from "@/lib/campaign-branding-server";
import { findCampaignById, updateCampaignBranding } from "@/lib/campaigns";
import { cleanText } from "@/lib/validation";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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
    const removeLogo = cleanText(String(formData.get("removeLogo") ?? "")) === "true";
    const cover = formData.get("cover");
    const logo = formData.get("logo");

    let coverImageFile = campaign.coverImageFile ?? "";
    let logoFile = campaign.logoFile ?? "";

    if (removeCover) {
      await removeCampaignBrandingAsset(id, "cover");
      coverImageFile = "";
    }

    if (removeLogo) {
      await removeCampaignBrandingAsset(id, "logo");
      logoFile = "";
    }

    if (cover instanceof File && cover.size > 0) {
      if (cover.size > MAX_COVER_BYTES) {
        return NextResponse.json({ ok: false, message: "Cover image must be 5 MB or smaller." }, { status: 400 });
      }
      const buffer = Buffer.from(await cover.arrayBuffer());
      coverImageFile = await saveCampaignBrandingAsset(id, "cover", buffer, cover.name);
    }

    if (logo instanceof File && logo.size > 0) {
      if (logo.size > MAX_LOGO_BYTES) {
        return NextResponse.json({ ok: false, message: "Logo must be 2 MB or smaller." }, { status: 400 });
      }
      const buffer = Buffer.from(await logo.arrayBuffer());
      logoFile = await saveCampaignBrandingAsset(id, "logo", buffer, logo.name);
    }

    const updated = await updateCampaignBranding(id, { coverImageFile, logoFile });
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/campaigns/create");
    revalidatePath("/dashboard/surveys");

    return NextResponse.json({ ok: true, campaign: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update campaign branding.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
