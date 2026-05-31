import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { findPanelistByEmail, updatePanelistProfile } from "@/lib/panelists";
import type { ProfileUpdateFormData } from "@/lib/profile-update-types";
import { validateProfileUpdateForm } from "@/lib/validation";

function parseProfileUpdateBody(body: unknown): ProfileUpdateFormData | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;

  const parseArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map(String).filter(Boolean);
  };

  return {
    education: String(data.education ?? ""),
    citizenshipStatus: String(data.citizenshipStatus ?? ""),
    commonwealthCountry: String(data.commonwealthCountry ?? ""),
    votingStatus: String(data.votingStatus ?? ""),
    constituency: String(data.constituency ?? ""),
    registeredCtvArea: String(data.registeredCtvArea ?? ""),
    facebook: String(data.facebook ?? ""),
    instagram: String(data.instagram ?? ""),
    tiktok: String(data.tiktok ?? ""),
    otherContactPlatform: String(data.otherContactPlatform ?? ""),
    otherContactPlatformCustom: String(data.otherContactPlatformCustom ?? ""),
    otherContact: String(data.otherContact ?? ""),
    streetAddress: String(data.streetAddress ?? ""),
    placeOfResidence: String(data.placeOfResidence ?? ""),
    cityTownVillage: String(data.cityTownVillage ?? ""),
    cityTownVillageOther: String(data.cityTownVillageOther ?? ""),
    countryIfAbroad: String(data.countryIfAbroad ?? ""),
    politicalInterests: parseArray(data.politicalInterests),
    marketInterests: parseArray(data.marketInterests),
    civicInterests: parseArray(data.civicInterests),
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session) {
      return NextResponse.json({ message: "You must be logged in." }, { status: 401 });
    }
    if (!session.panelistRegistered) {
      return NextResponse.json({ message: "Complete panelist registration first." }, { status: 403 });
    }
    if (session.accountStatus === "on_hold") {
      return NextResponse.json(
        {
          message:
            "Your account is on hold while email or phone changes await administrator approval. Other profile fields cannot be edited until approval is complete.",
        },
        { status: 403 }
      );
    }

    const panelist = await findPanelistByEmail(session.email);
    if (!panelist) {
      return NextResponse.json({ message: "Panelist profile not found." }, { status: 404 });
    }

    const body = await request.json();
    const data = parseProfileUpdateBody(body);
    if (!data) {
      return NextResponse.json({ message: "Invalid profile data." }, { status: 400 });
    }

    const errors = validateProfileUpdateForm(data, {
      accountEmail: session.email,
      currentPhone: panelist.phone_whatsapp ?? "",
    });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await updatePanelistProfile(session.email, data, session.email);
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Profile could not be updated." }, { status: 500 });
  }
}
