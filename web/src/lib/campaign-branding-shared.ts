export function campaignCoverAssetUrl(campaignId: string): string {
  return `/api/campaigns/${encodeURIComponent(campaignId)}/assets/cover`;
}

export function campaignHasCover(campaign: { coverImageFile?: string } | null | undefined): boolean {
  return Boolean(campaign?.coverImageFile);
}
