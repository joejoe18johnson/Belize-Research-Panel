import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { getSessionAccount } from "@/lib/auth";
import { findSurveyBrandingAsset, type SurveyBrandingAssetKind } from "@/lib/survey-branding-server";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { cleanText } from "@/lib/validation";

function parseKind(value: string): SurveyBrandingAssetKind | null {
  if (value === "logo" || value === "cover") return value;
  return null;
}

async function canAccessSurveyBranding(surveyId: string): Promise<boolean> {
  if (await isAdminSessionActive()) return true;

  const account = await getSessionAccount();
  if (!account) return false;

  const definition = await findSurveyDefinitionById(surveyId);
  if (!definition) return false;

  const email = cleanText(account.email).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  return assignments.some(
    (record) =>
      cleanText(record.surveyDefinitionId ?? "") === surveyId &&
      cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; asset: string }> }
) {
  const { id, asset: assetParam } = await context.params;
  const kind = parseKind(cleanText(assetParam).toLowerCase());
  if (!kind) {
    return NextResponse.json({ ok: false, message: "Invalid asset." }, { status: 400 });
  }

  if (!(await canAccessSurveyBranding(id))) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const asset = await findSurveyBrandingAsset(id, kind);
  if (!asset) {
    return NextResponse.json({ ok: false, message: "Asset not found." }, { status: 404 });
  }

  const buffer = await readFile(asset.absolutePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Disposition": `inline; filename="${asset.filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
