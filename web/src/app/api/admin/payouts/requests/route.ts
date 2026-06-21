import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminSessionActive } from "@/lib/admin-auth";
import { notifyPanelistOfPayoutUpdate } from "@/lib/payout-panelist-notify";
import { markAdminPayoutsRead } from "@/lib/admin-read-state";
import { processRedemptionRequest } from "@/lib/redemption-requests";
import type { PayoutProcessAction } from "@/lib/reward-redemption";
import { sessionCanAccessModule } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await isAdminSessionActive()) return true;
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided === adminKey;
}

function parseAction(value: string | undefined): PayoutProcessAction | null {
  const action = cleanText(value);
  if (action === "start" || action === "complete" || action === "reject") return action;
  return null;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const session = await getAdminSession();
  if (session && !sessionCanAccessModule(session, "payouts")) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { requestId?: string; action?: string };
    const requestId = cleanText(body.requestId);
    const action = parseAction(body.action);

    if (!requestId || !action) {
      return NextResponse.json({ message: "Request id and action are required." }, { status: 400 });
    }

    const updated = await processRedemptionRequest({
      requestId,
      action,
      processedBy: session?.email,
    });

    if (!updated) {
      return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
    }

    await notifyPanelistOfPayoutUpdate(updated, action, request.nextUrl.origin);
    await markAdminPayoutsRead([updated.id]);

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/payouts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard/rewards");
    revalidatePath("/dashboard/payouts");

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_transition") {
      return NextResponse.json({ message: "This payout request cannot be updated in its current state." }, { status: 409 });
    }
    return NextResponse.json({ message: "Payout request could not be processed." }, { status: 500 });
  }
}
