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

/** Same inbox, unique stored address (Gmail/Outlook plus-addressing). */
export function testingAliasEmail(email: string, attempt: number): string {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return value;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const tag = attempt <= 1 ? "brp" : `brp${attempt}`;
  return `${local}+${tag}@${domain}`;
}
