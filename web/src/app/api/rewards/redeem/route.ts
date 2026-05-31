import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";
import { findPanelistByEmail } from "@/lib/panelists";
import { resolveRewardSummary } from "@/lib/panelist-points";
import { createRedemptionRequest, loadRedemptionRequests } from "@/lib/redemption-requests";
import { validateRedemptionRequest } from "@/lib/reward-redemption";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (session.accountStatus === "on_hold") {
      return NextResponse.json(
        { errors: { form: "Your account is on hold. Complete verification before redeeming points." } },
        { status: 403 }
      );
    }

    const panelist = await findPanelistByEmail(session.email);
    if (!panelist) {
      return NextResponse.json({ message: "Panelist profile not found." }, { status: 404 });
    }

    const profile = panelistRowToDashboardProfile(panelist);
    const rewards = await resolveRewardSummary(session.email, profile);
    const existingRequests = await loadRedemptionRequests(session.email);

    const body = (await request.json()) as {
      optionId?: string;
      amountBz?: number | string;
      details?: Record<string, string>;
      notes?: string;
    };

    const validation = validateRedemptionRequest({
      optionId: body.optionId ?? "",
      amountBz: body.amountBz,
      details: body.details ?? {},
      notes: body.notes,
      totalPoints: rewards.totalPoints,
      requests: existingRequests,
    });

    if (!validation.ok) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const redemption = await createRedemptionRequest({
      email: session.email,
      optionId: validation.option.id,
      optionLabel: validation.option.label,
      points: validation.points,
      amountBz: validation.amountBz,
      valueLabel: validation.valueLabel,
      details: validation.details,
      notes: validation.notes,
    });

    revalidatePath("/dashboard/rewards");

    return NextResponse.json({
      ok: true,
      request: redemption,
      message: "Your redemption request has been submitted. Our team will process it within 5–7 business days.",
    });
  } catch {
    return NextResponse.json({ message: "Redemption request could not be submitted." }, { status: 500 });
  }
}
