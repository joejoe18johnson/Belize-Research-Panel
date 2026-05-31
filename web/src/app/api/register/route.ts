import { NextRequest, NextResponse } from "next/server";
import { findAccountById, markAccountPanelistRegistered } from "@/lib/accounts";
import { getSessionAccount } from "@/lib/auth";
import { duplicateCheck, loadPanelists, registerPanelist } from "@/lib/panelists";
import type { RegistrationFormData } from "@/lib/registration-types";
import type { RegistrationMode } from "@/lib/constants";
import { deriveAccountUsername, validateRegistrationForm } from "@/lib/validation";

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return String(value).toLowerCase() === "true";
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseRegistrationForm(formData: FormData): RegistrationFormData {
  return {
    registrationMode: String(formData.get("registrationMode") ?? "Self-registration") as RegistrationMode,
    authorisedVerificationCode: String(formData.get("authorisedVerificationCode") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    citizenshipStatus: String(formData.get("citizenshipStatus") ?? ""),
    commonwealthCountry: String(formData.get("commonwealthCountry") ?? ""),
    votingStatus: String(formData.get("votingStatus") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    education: String(formData.get("education") ?? ""),
    ethnicity: String(formData.get("ethnicity") ?? ""),
    placeOfResidence: String(formData.get("placeOfResidence") ?? ""),
    cityTownVillage: String(formData.get("cityTownVillage") ?? ""),
    cityTownVillageOther: String(formData.get("cityTownVillageOther") ?? ""),
    countryIfAbroad: String(formData.get("countryIfAbroad") ?? ""),
    usDiasporaRegion: String(formData.get("usDiasporaRegion") ?? ""),
    constituency: String(formData.get("constituency") ?? ""),
    registeredCtvArea: String(formData.get("registeredCtvArea") ?? ""),
    politicalInterests: parseJsonArray(formData.get("politicalInterests")),
    marketInterests: parseJsonArray(formData.get("marketInterests")),
    civicInterests: parseJsonArray(formData.get("civicInterests")),
    email: String(formData.get("email") ?? ""),
    phoneCountryCode: String(formData.get("phoneCountryCode") ?? "+501"),
    phoneLocalNumber: String(formData.get("phoneLocalNumber") ?? ""),
    facebook: String(formData.get("facebook") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    tiktok: String(formData.get("tiktok") ?? ""),
    otherContactPlatform: String(formData.get("otherContactPlatform") ?? ""),
    otherContactPlatformCustom: String(formData.get("otherContactPlatformCustom") ?? ""),
    otherContact: String(formData.get("otherContact") ?? ""),
    streetAddress: String(formData.get("streetAddress") ?? ""),
    contactDetailsConfirmed: parseBoolean(formData.get("contactDetailsConfirmed")),
    photoIdType: String(formData.get("photoIdType") ?? ""),
    photoIdFile: (() => {
      const file = formData.get("photoIdFile");
      return file instanceof File && file.size > 0 ? file : null;
    })(),
    proofOfBelizeResidenceType: String(formData.get("proofOfBelizeResidenceType") ?? ""),
    proofOfBelizeResidenceFile: (() => {
      const file = formData.get("proofOfBelizeResidenceFile");
      return file instanceof File && file.size > 0 ? file : null;
    })(),
    username: "",
    useRegistrationEmailAsUsername: false,
    loginEmail: "",
    password: "",
    confirmPassword: "",
    consentResearch: parseBoolean(formData.get("consentResearch")),
    consentContact: parseBoolean(formData.get("consentContact")),
    consentPrivacy: parseBoolean(formData.get("consentPrivacy")),
    finalReviewConfirmed: parseBoolean(formData.get("finalReviewConfirmed")),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session) {
      return NextResponse.json({ message: "You must be logged in to register." }, { status: 401 });
    }
    if (!session.emailVerified) {
      return NextResponse.json({ message: "Verify your email before completing registration." }, { status: 403 });
    }
    if (session.panelistRegistered) {
      return NextResponse.json({ message: "You have already completed panelist registration." }, { status: 409 });
    }

    const accountRecord = await findAccountById(session.id);
    if (!accountRecord) {
      return NextResponse.json({ message: "Account not found." }, { status: 401 });
    }

    const formData = await request.formData();
    const data = parseRegistrationForm(formData);
    const rows = await loadPanelists();
    const { hardDuplicate } = duplicateCheck(rows, data);

    const errors = validateRegistrationForm(data, {
      hardDuplicate,
      accountBacked: true,
      accountEmail: session.email,
    });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const username = deriveAccountUsername(session.email, session.id);
    const result = await registerPanelist(data, {
      username,
      passwordSalt: accountRecord.password_salt,
      passwordHash: accountRecord.password_hash,
      accountEmail: session.email,
    });
    await markAccountPanelistRegistered(session.id);
    return NextResponse.json({ ok: true, verificationStatus: result.verificationStatus });
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate") {
      return NextResponse.json(
        {
          errors: {
            submit: "A duplicate registration appears to exist based on email, phone, name + date of birth, or photo ID details.",
          },
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Registration could not be completed." }, { status: 500 });
  }
}
