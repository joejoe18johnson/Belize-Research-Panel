export interface PlatformTestingSettings {
  allowDuplicateEmails: boolean;
  allowDuplicatePhones: boolean;
  /** When false, phone OTP is WhatsApp-only (no SMS button or SMS fallback). */
  smsPhoneOtpEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PLATFORM_TESTING_SETTINGS: PlatformTestingSettings = {
  allowDuplicateEmails: false,
  allowDuplicatePhones: false,
  smsPhoneOtpEnabled: false,
};

export function normalizePlatformTestingSettings(
  raw: Partial<PlatformTestingSettings> | null | undefined
): PlatformTestingSettings {
  return {
    allowDuplicateEmails: Boolean(raw?.allowDuplicateEmails),
    allowDuplicatePhones: Boolean(raw?.allowDuplicatePhones),
    // Default off so WhatsApp-only until an admin turns SMS on.
    smsPhoneOtpEnabled: Boolean(raw?.smsPhoneOtpEnabled),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : "",
    updatedBy: typeof raw?.updatedBy === "string" ? raw.updatedBy : "",
  };
}
