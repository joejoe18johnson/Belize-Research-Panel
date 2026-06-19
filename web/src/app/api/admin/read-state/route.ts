import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminSessionActive } from "@/lib/admin-auth";
import { unreadCompletedCampaignIds } from "@/lib/admin-nav-badges";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { unreadAdminNotificationIds, unreadNewPayoutIds } from "@/lib/admin-nav-badges";
import {
  loadAdminReadState,
  markAdminCampaignsRead,
  markAdminNotificationsRead,
  markAdminPayoutsRead,
} from "@/lib/admin-read-state";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { staffCanAccessModule } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await isAdminSessionActive()) return true;
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided === adminKey;
}

function revalidateAdminShell() {
  revalidatePath("/admin", "layout");
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const session = await getAdminSession();

  try {
    const body = (await request.json()) as {
      scope?: string;
      ids?: string[];
      markAll?: boolean;
    };
    const scope = cleanText(body.scope);
    const ids = Array.isArray(body.ids) ? body.ids.map((id) => cleanText(id)).filter(Boolean) : [];

    if (scope === "notifications") {
      if (session && !staffCanAccessModule(session.role, "notifications")) {
        return NextResponse.json({ message: "Access denied." }, { status: 403 });
      }

      const hub = await loadAdminDataHub();
      const readState = await loadAdminReadState();
      const targetIds = body.markAll ? unreadAdminNotificationIds(hub, readState) : ids;
      const updated = await markAdminNotificationsRead(targetIds);
      revalidateAdminShell();
      return NextResponse.json({ ok: true, unreadNotifications: unreadAdminNotificationIds(hub, updated).length });
    }

    if (scope === "payouts") {
      if (session && !staffCanAccessModule(session.role, "payouts")) {
        return NextResponse.json({ message: "Access denied." }, { status: 403 });
      }

      const hub = await loadAdminDataHub();
      const readState = await loadAdminReadState();
      const targetIds = body.markAll ? unreadNewPayoutIds(hub, readState) : ids;
      const updated = await markAdminPayoutsRead(targetIds);
      revalidateAdminShell();
      return NextResponse.json({ ok: true, unreadPayouts: unreadNewPayoutIds(hub, updated).length });
    }

    if (scope === "campaigns") {
      if (session && !staffCanAccessModule(session.role, "campaigns")) {
        return NextResponse.json({ message: "Access denied." }, { status: 403 });
      }

      const [campaigns, assignments, readState] = await Promise.all([
        loadCampaignRecords(),
        loadSurveyRecordsFromFile(),
        loadAdminReadState(),
      ]);
      const summaries = buildCampaignSummaries(campaigns, assignments);
      const targetIds = body.markAll ? unreadCompletedCampaignIds(summaries, readState) : ids;
      const updated = await markAdminCampaignsRead(targetIds);
      revalidateAdminShell();
      revalidatePath("/admin/campaigns");
      return NextResponse.json({
        ok: true,
        unreadCampaigns: unreadCompletedCampaignIds(summaries, updated).length,
      });
    }

    return NextResponse.json({ message: "Scope must be notifications, payouts, or campaigns." }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Read state could not be updated." }, { status: 500 });
  }
}
