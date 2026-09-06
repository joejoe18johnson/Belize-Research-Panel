import { NextRequest, NextResponse } from "next/server";
import { createOrLinkFacebookAccount } from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";
import { isFacebookLoginConfigured } from "@/lib/facebook-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isFacebookLoginConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Facebook login is not configured on this site yet." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      accessToken?: string;
      citizenshipStatus?: string;
      commonwealthCountry?: string;
      dob?: string;
    };

    const accessToken = cleanText(body.accessToken);
    if (!accessToken) {
      return NextResponse.json({ ok: false, message: "Missing Facebook session." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(accessToken);
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, message: error?.message || "Could not verify Facebook sign-in." },
        { status: 401 }
      );
    }

    const user = data.user;
    const identities = user.identities ?? [];
    const facebookIdentity = identities.find((identity) => identity.provider === "facebook");
    const facebookUserId =
      cleanText(facebookIdentity?.id) ||
      cleanText(String(user.user_metadata?.provider_id ?? "")) ||
      cleanText(user.id);

    if (!facebookUserId) {
      return NextResponse.json({ ok: false, message: "Facebook user id was not returned." }, { status: 400 });
    }

    const meta = user.user_metadata ?? {};
    const fullName = cleanText(String(meta.full_name ?? meta.name ?? ""));
    const firstName = cleanText(String(meta.given_name ?? meta.first_name ?? ""));
    const lastName = cleanText(String(meta.family_name ?? meta.last_name ?? ""));

    const result = await createOrLinkFacebookAccount(
      {
        facebookUserId,
        email: user.email ?? undefined,
        firstName,
        lastName,
        fullName,
      },
      {
        citizenshipStatus: body.citizenshipStatus,
        commonwealthCountry: body.commonwealthCountry,
        dob: body.dob,
      }
    );

    await setSessionCookie(result.account.id);

    return NextResponse.json({
      ok: true,
      created: result.created,
      account: {
        emailVerified: result.account.email_verified === "true",
        panelistRegistered: result.account.panelist_registered === "true",
        accountStatus: result.account.account_status ?? "active",
        email: result.account.email,
        needsContactDetails: result.account.email.endsWith("@facebook.oauth.local"),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "storage_not_configured") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Account storage is not configured. Add Supabase environment variables in the hosting dashboard.",
        },
        { status: 503 }
      );
    }
    console.error("Facebook complete failed:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Facebook sign-in failed." },
      { status: 500 }
    );
  }
}
