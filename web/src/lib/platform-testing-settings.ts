export interface PlatformTestingSettings {
  allowDuplicateEmails: boolean;
  allowDuplicatePhones: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PLATFORM_TESTING_SETTINGS: PlatformTestingSettings = {
  allowDuplicateEmails: false,
  allowDuplicatePhones: false,
};

export function normalizePlatformTestingSettings(
  raw: Partial<PlatformTestingSettings> | null | undefined
): PlatformTestingSettings {
  return {
    allowDuplicateEmails: Boolean(raw?.allowDuplicateEmails),
    allowDuplicatePhones: Boolean(raw?.allowDuplicatePhones),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : "",
    updatedBy: typeof raw?.updatedBy === "string" ? raw.updatedBy : "",
  };
}
