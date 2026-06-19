import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { updateCampaignClientId } from "@/lib/campaigns";
import { findClientUserById } from "@/lib/client-users";
import { cleanText } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { clientId?: string };
    const clientId = cleanText(String(body.clientId ?? ""));

    if (clientId) {
      const client = await findClientUserById(clientId);
      if (!client || client.status !== "active") {
        return NextResponse.json({ ok: false, message: "Selected client account was not found." }, { status: 400 });
      }
    }

    const campaign = await updateCampaignClientId(id, clientId || undefined);
    if (!campaign) {
      return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
    }

    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${id}/results`);
    revalidatePath("/client");

    return NextResponse.json({
      ok: true,
      campaign,
      message: clientId
        ? "Client portal access enabled for this campaign."
        : "Client portal access removed from this campaign.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update campaign.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
