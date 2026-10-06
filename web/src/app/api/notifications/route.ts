import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import {
  buildDashboardNotifications,
  panelistRowToDashboardProfile,
} from "@/lib/panelist-dashboard";
import { findPanelistByEmail } from "@/lib/panelists";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
import { getPanelistSurveys } from "@/lib/panelist-surveys";
import {
  loadNotificationReadState,
  markAllNotificationsRead,
  setNotificationRead,
} from "@/lib/notification-state";
import { cleanText } from "@/lib/validation";
import { requirementNoticesForPanelist } from "@/lib/verification-notices";
import type { SessionAccount } from "@/lib/auth-types";
import type { PanelistRow } from "@/lib/panelists";

async function requireRegisteredPanelist() {
  const session = await getSessionAccount();
  if (!session) {
    return { error: NextResponse.json({ message: "You must be logged in." }, { status: 401 }) };
  }
  if (!session.panelistRegistered) {
    return { error: NextResponse.json({ message: "Complete panelist registration first." }, { status: 403 }) };
  }
  const panelist = await findPanelistByEmail(session.email);
  if (!panelist) {
    return { error: NextResponse.json({ message: "Panelist profile not found." }, { status: 404 }) };
  }
  return { session, panelist };
}

function requirementNotices(session: SessionAccount, panelist: PanelistRow) {
  return requirementNoticesForPanelist(panelist, {
    emailVerified: session.emailVerified,
    pendingPhone: Boolean(session.pendingPhone?.trim()),
    hasPhotoUpload: Boolean(cleanText(panelist.photo_id_path) || cleanText(panelist.photo_id_type)),
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireRegisteredPanelist();
    if ("error" in result) return result.error;

    const body = (await request.json()) as {
      notificationId?: string;
      read?: boolean;
      markAllRead?: boolean;
    };

    const profile = panelistRowToDashboardProfile(result.panelist);
    const readState = await loadNotificationReadState(result.session.email);
    const redemptionRequests = await loadRedemptionRequests(result.session.email);
    const { inbox } = await getPanelistSurveys(result.session.email);
    const notifications = buildDashboardNotifications(profile, {
      readState,
      redemptionRequests,
      inboxSurveys: inbox,
      requirements: requirementNotices(result.session, result.panelist),
    });

    if (body.markAllRead) {
      await markAllNotificationsRead(
        result.session.email,
        notifications.map((notification) => notification.id)
      );
    } else {
      const notificationId = cleanText(body.notificationId);
      if (!notificationId) {
        return NextResponse.json({ message: "Notification id is required." }, { status: 400 });
      }
      if (!notifications.some((notification) => notification.id === notificationId)) {
        return NextResponse.json({ message: "Notification not found." }, { status: 404 });
      }
      await setNotificationRead(result.session.email, notificationId, body.read !== false);
    }

    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");

    const updatedReadState = await loadNotificationReadState(result.session.email);
    const updatedNotifications = buildDashboardNotifications(profile, {
      readState: updatedReadState,
      redemptionRequests,
      inboxSurveys: inbox,
      requirements: requirementNotices(result.session, result.panelist),
    });

    return NextResponse.json({ ok: true, notifications: updatedNotifications });
  } catch {
    return NextResponse.json({ message: "Notification state could not be updated." }, { status: 500 });
  }
}
