import { promises as fs } from "fs";
import path from "path";
import { useSupabase } from "./supabase/data-source";

const UPLOADS_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads", "campaigns");
const STORAGE_BUCKET = "survey-assets";
export const CAMPAIGN_COVER_BASENAME = "cover-image";
export const CAMPAIGN_LOGO_BASENAME = "company-logo";

export type CampaignBrandingAssetKind = "logo" | "cover";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export interface CampaignBrandingAsset {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export type CampaignCoverAsset = CampaignBrandingAsset;

function campaignDir(campaignId: string): string {
  return path.join(UPLOADS_ROOT, campaignId);
}

function storageFolder(campaignId: string): string {
  return `campaigns/${campaignId}`;
}

function basenameForKind(kind: CampaignBrandingAssetKind): string {
  return kind === "logo" ? CAMPAIGN_LOGO_BASENAME : CAMPAIGN_COVER_BASENAME;
}

function normalizeExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : ".png";
}

function contentTypeFor(filename: string): string {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

async function findLocalAsset(
  campaignId: string,
  kind: CampaignBrandingAssetKind
): Promise<{ absolutePath: string; filename: string } | null> {
  const dir = campaignDir(campaignId);
  const prefix = basenameForKind(kind);
  try {
    const entries = await fs.readdir(dir);
    const match = entries.find((entry) => entry.startsWith(`${prefix}.`));
    if (!match) return null;
    return { absolutePath: path.join(dir, match), filename: match };
  } catch {
    return null;
  }
}

export async function saveCampaignBrandingAsset(
  campaignId: string,
  kind: CampaignBrandingAssetKind,
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  const ext = normalizeExtension(originalFilename);
  const filename = `${basenameForKind(kind)}${ext}`;
  const prefix = basenameForKind(kind);

  if (useSupabase()) {
    const { getSupabaseAdmin } = await import("./supabase/server");
    const db = getSupabaseAdmin();
    const folder = storageFolder(campaignId);
    const { data: existing } = await db.storage.from(STORAGE_BUCKET).list(folder);
    const stale = (existing ?? [])
      .filter((item) => item.name.startsWith(`${prefix}.`) && item.name !== filename)
      .map((item) => `${folder}/${item.name}`);
    if (stale.length) {
      await db.storage.from(STORAGE_BUCKET).remove(stale);
    }
    const { error } = await db.storage.from(STORAGE_BUCKET).upload(`${folder}/${filename}`, buffer, {
      contentType: contentTypeFor(filename),
      upsert: true,
    });
    if (error) throw new Error(error.message);
    return filename;
  }

  const dir = campaignDir(campaignId);
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${prefix}.`))
      .map((entry) => fs.unlink(path.join(dir, entry)).catch(() => undefined))
  );
  await fs.writeFile(path.join(dir, filename), buffer);
  return filename;
}

export async function removeCampaignBrandingAsset(
  campaignId: string,
  kind: CampaignBrandingAssetKind
): Promise<void> {
  const prefix = basenameForKind(kind);
  if (useSupabase()) {
    const { getSupabaseAdmin } = await import("./supabase/server");
    const db = getSupabaseAdmin();
    const folder = storageFolder(campaignId);
    const { data: existing } = await db.storage.from(STORAGE_BUCKET).list(folder);
    const paths = (existing ?? [])
      .filter((item) => item.name.startsWith(`${prefix}.`))
      .map((item) => `${folder}/${item.name}`);
    if (paths.length) {
      await db.storage.from(STORAGE_BUCKET).remove(paths);
    }
    return;
  }

  const asset = await findLocalAsset(campaignId, kind);
  if (!asset) return;
  await fs.unlink(asset.absolutePath).catch(() => undefined);
}

export async function loadCampaignBrandingAsset(
  campaignId: string,
  kind: CampaignBrandingAssetKind,
  storedFilename = ""
): Promise<CampaignBrandingAsset | null> {
  const prefix = basenameForKind(kind);
  if (useSupabase()) {
    const { getSupabaseAdmin } = await import("./supabase/server");
    const db = getSupabaseAdmin();
    const folder = storageFolder(campaignId);
    let filename = storedFilename;
    if (!filename) {
      const { data: existing } = await db.storage.from(STORAGE_BUCKET).list(folder);
      filename = (existing ?? []).find((item) => item.name.startsWith(`${prefix}.`))?.name ?? "";
    }
    if (!filename) return null;
    const { data, error } = await db.storage.from(STORAGE_BUCKET).download(`${folder}/${filename}`);
    if (error || !data) return null;
    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      filename,
      contentType: contentTypeFor(filename),
    };
  }

  const asset = await findLocalAsset(campaignId, kind);
  if (!asset) return null;
  return {
    buffer: await fs.readFile(asset.absolutePath),
    filename: asset.filename,
    contentType: contentTypeFor(asset.filename),
  };
}

export async function saveCampaignCoverAsset(
  campaignId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  return saveCampaignBrandingAsset(campaignId, "cover", buffer, originalFilename);
}

export async function removeCampaignCoverAsset(campaignId: string): Promise<void> {
  return removeCampaignBrandingAsset(campaignId, "cover");
}

export async function loadCampaignCoverAsset(
  campaignId: string,
  storedFilename = ""
): Promise<CampaignCoverAsset | null> {
  return loadCampaignBrandingAsset(campaignId, "cover", storedFilename);
}
