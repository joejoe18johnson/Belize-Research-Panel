export function campaignCoverAssetUrl(campaignId: string): string {
  return `/api/campaigns/${encodeURIComponent(campaignId)}/assets/cover`;
}

export function campaignLogoAssetUrl(campaignId: string): string {
  return `/api/campaigns/${encodeURIComponent(campaignId)}/assets/logo`;
}

export function campaignHasCover(campaign: { coverImageFile?: string } | null | undefined): boolean {
  return Boolean(campaign?.coverImageFile);
}

export function campaignHasLogo(campaign: { logoFile?: string } | null | undefined): boolean {
  return Boolean(campaign?.logoFile);
}
