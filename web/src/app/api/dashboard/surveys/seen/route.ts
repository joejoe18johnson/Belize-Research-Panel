import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { getPanelistSurveys } from "@/lib/panelist-surveys";
import { markSurveyInvitationsSeen } from "@/lib/survey-notifications-server";

export async function POST() {
  try {
    const account = await getSessionAccount();
    if (!account) {
      return NextResponse.json({ message: "You must be logged in." }, { status: 401 });
    }
    if (!account.panelistRegistered) {
      return NextResponse.json({ message: "Complete panelist registration first." }, { status: 403 });
    }

    const { inbox } = await getPanelistSurveys(account.email);
    await markSurveyInvitationsSeen(account.email, inbox);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard/profile");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Could not update survey notification state." }, { status: 500 });
  }
}
