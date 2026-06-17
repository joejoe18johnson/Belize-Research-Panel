import { readFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  findSurveyBrandingAsset,
  removeSurveyBrandingAsset,
  saveSurveyBrandingAsset,
  type SurveyBrandingAssetKind,
} from "@/lib/survey-branding";
import { findSurveyDefinitionById, updateSurveyDefinition } from "@/lib/survey-definitions";
import { cleanText } from "@/lib/validation";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

function parseKind(value: string): SurveyBrandingAssetKind | null {
  if (value === "logo" || value === "cover") return value;
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const survey = await findSurveyDefinitionById(id);
    if (!survey) {
      return NextResponse.json({ ok: false, message: "Survey not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const removeLogo = cleanText(String(formData.get("removeLogo") ?? "")) === "true";
    const removeCover = cleanText(String(formData.get("removeCover") ?? "")) === "true";
    const logo = formData.get("logo");
    const cover = formData.get("cover");

    let companyLogoFile = survey.companyLogoFile;
    let coverImageFile = survey.coverImageFile;

    if (removeLogo) {
      await removeSurveyBrandingAsset(id, "logo");
      companyLogoFile = "";
    }

    if (removeCover) {
      await removeSurveyBrandingAsset(id, "cover");
      coverImageFile = "";
    }

    if (logo instanceof File && logo.size > 0) {
      if (logo.size > MAX_LOGO_BYTES) {
        return NextResponse.json({ ok: false, message: "Company logo must be 2 MB or smaller." }, { status: 400 });
      }
      const buffer = Buffer.from(await logo.arrayBuffer());
      companyLogoFile = await saveSurveyBrandingAsset(id, "logo", buffer, logo.name);
    }

    if (cover instanceof File && cover.size > 0) {
      if (cover.size > MAX_COVER_BYTES) {
        return NextResponse.json({ ok: false, message: "Cover image must be 5 MB or smaller." }, { status: 400 });
      }
      const buffer = Buffer.from(await cover.arrayBuffer());
      coverImageFile = await saveSurveyBrandingAsset(id, "cover", buffer, cover.name);
    }

    const updated = await updateSurveyDefinition(id, { companyLogoFile, coverImageFile });

    revalidatePath("/admin/surveys");
    revalidatePath(`/admin/surveys/${id}/edit`);
    revalidatePath(`/dashboard/surveys`);

    return NextResponse.json({ ok: true, survey: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update survey branding.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const kind = parseKind(cleanText(searchParams.get("kind")).toLowerCase());
  if (!kind) {
    return NextResponse.json({ ok: false, message: "Invalid asset kind." }, { status: 400 });
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
