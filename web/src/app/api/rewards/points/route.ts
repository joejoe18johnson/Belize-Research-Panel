import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { findPanelistByEmail } from "@/lib/panelists";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";
import {
  isPointsOverrideEnabled,
  loadPointsOverride,
  resolveRewardSummary,
  setPointsOverride,
} from "@/lib/panelist-points";

export async function GET() {
  if (!isPointsOverrideEnabled()) {
    return NextResponse.json({ message: "Not available." }, { status: 404 });
  }

  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const panelist = await findPanelistByEmail(session.email);
    if (!panelist) {
      return NextResponse.json({ message: "Panelist profile not found." }, { status: 404 });
    }

    const profile = panelistRowToDashboardProfile(panelist);
    const rewards = await resolveRewardSummary(session.email, profile);
    const override = await loadPointsOverride(session.email);

    return NextResponse.json({
      ok: true,
      totalPoints: rewards.totalPoints,
      calculatedPoints: rewards.calculatedPoints ?? rewards.totalPoints,
      usingOverride: rewards.usingOverride ?? false,
      override,
    });
  } catch {
    return NextResponse.json({ message: "Could not load points." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isPointsOverrideEnabled()) {
    return NextResponse.json({ message: "Not available." }, { status: 404 });
  }

  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { totalPoints?: number | string; clear?: boolean };

    if (body.clear) {
      await setPointsOverride(session.email, null);
    } else {
      const raw = body.totalPoints;
      const parsed =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? Number.parseInt(raw, 10)
            : Number.NaN;

      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json(
          { errors: { totalPoints: "Enter a valid points amount (0 or greater)." } },
          { status: 400 }
        );
      }

      await setPointsOverride(session.email, parsed);
    }

    const panelist = await findPanelistByEmail(session.email);
    const profile = panelist ? panelistRowToDashboardProfile(panelist) : { verificationStatus: "Pending" };
    const rewards = await resolveRewardSummary(session.email, profile);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rewards");

    return NextResponse.json({
      ok: true,
      rewards,
      message: body.clear ? "Points reset to calculated balance." : "Test points updated.",
    });
  } catch {
    return NextResponse.json({ message: "Points could not be updated." }, { status: 500 });
  }
}
