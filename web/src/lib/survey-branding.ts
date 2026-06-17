import { promises as fs } from "fs";
import path from "path";
import type { SurveyDefinition } from "./survey-types";

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads", "surveys");

export const SURVEY_LOGO_BASENAME = "company-logo";
export const SURVEY_COVER_BASENAME = "cover-image";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export type SurveyBrandingAssetKind = "logo" | "cover";

function surveyDir(surveyId: string): string {
  return path.join(UPLOADS_ROOT, surveyId);
}

function basenameForKind(kind: SurveyBrandingAssetKind): string {
  return kind === "logo" ? SURVEY_LOGO_BASENAME : SURVEY_COVER_BASENAME;
}

function normalizeExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : ".png";
}

export function surveyBrandingAssetUrl(surveyId: string, kind: SurveyBrandingAssetKind): string {
  return `/api/surveys/${encodeURIComponent(surveyId)}/assets/${kind}`;
}

export function surveyHasLogo(definition: Pick<SurveyDefinition, "companyLogoFile">): boolean {
  return Boolean(definition.companyLogoFile);
}

export function surveyHasCover(definition: Pick<SurveyDefinition, "coverImageFile">): boolean {
  return Boolean(definition.coverImageFile);
}

export async function findSurveyBrandingAsset(
  surveyId: string,
  kind: SurveyBrandingAssetKind
): Promise<{ absolutePath: string; filename: string; contentType: string } | null> {
  const dir = surveyDir(surveyId);
  const prefix = basenameForKind(kind);

  try {
    const entries = await fs.readdir(dir);
    const match = entries.find((entry) => entry.startsWith(`${prefix}.`));
    if (!match) return null;

    const ext = path.extname(match).toLowerCase();
    return {
      absolutePath: path.join(dir, match),
      filename: match,
      contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function saveSurveyBrandingAsset(
  surveyId: string,
  kind: SurveyBrandingAssetKind,
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  const dir = surveyDir(surveyId);
  await fs.mkdir(dir, { recursive: true });

  const ext = normalizeExtension(originalFilename);
  const filename = `${basenameForKind(kind)}${ext}`;
  const absolutePath = path.join(dir, filename);

  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${basenameForKind(kind)}.`))
      .map((entry) => fs.unlink(path.join(dir, entry)).catch(() => undefined))
  );

  await fs.writeFile(absolutePath, buffer);
  return filename;
}

export async function removeSurveyBrandingAsset(surveyId: string, kind: SurveyBrandingAssetKind): Promise<void> {
  const asset = await findSurveyBrandingAsset(surveyId, kind);
  if (!asset) return;
  await fs.unlink(asset.absolutePath).catch(() => undefined);
}
