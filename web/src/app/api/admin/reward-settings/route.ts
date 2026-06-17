import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { loadRewardSettings, saveRewardSettings } from "@/lib/reward-settings-store";
import { validateRewardSettingsInput } from "@/lib/reward-settings";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const settings = await loadRewardSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateRewardSettingsInput({
      registrationRewardPoints: Number(body.registrationRewardPoints),
      verificationRewardPoints: Number(body.verificationRewardPoints),
      redemptionMinimumPoints: Number(body.redemptionMinimumPoints),
      pointsPerBzDollar: Number(body.pointsPerBzDollar),
      surveyRewardPresets: Array.isArray(body.surveyRewardPresets)
        ? body.surveyRewardPresets
        : typeof body.surveyRewardPresets === "string"
          ? body.surveyRewardPresets
              .split(/[,\s]+/)
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value))
          : undefined,
    });

    if (!validation.ok) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    const settings = await saveRewardSettings(validation.settings, session.displayName);
    revalidatePath("/admin/campaigns/reward-settings");
    revalidatePath("/dashboard/rewards");
    revalidatePath("/dashboard/rewards/redeem");

    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not save reward settings." }, { status: 500 });
  }
}
