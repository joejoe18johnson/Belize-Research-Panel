export const DEMO_ACCOUNT_PASSWORD = "DemoPass1!";

export interface DemoAccountInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  panelistRegistered: boolean;
  verificationToken: string;
  passwordSalt: string;
  passwordHash: string;
  citizenshipStatus?: string;
  dob?: string;
}

/** Verified email, panelist registration not yet completed — ready for /register */
export const DEMO_REGISTRATION_READY_ACCOUNT: DemoAccountInfo = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "demo@belizepanel.test",
  firstName: "Johannes",
  lastName: "Johnson",
  emailVerified: true,
  panelistRegistered: false,
  verificationToken: "",
  passwordSalt: "demo-salt-registration01",
  passwordHash: "aee387288470fd44015b19a9e135a4bd7e5e32fa2d1f179371d9d5c0e355f9f4",
  citizenshipStatus: "Citizen of Belize",
  dob: "1990-06-15",
};

/** Verified email with completed panelist registration — ready for /dashboard */
export const DEMO_REGISTERED_ACCOUNT: DemoAccountInfo = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "johannesjohnsonj@gmail.com",
  firstName: "Johannes",
  lastName: "Johnson",
  emailVerified: true,
  panelistRegistered: true,
  verificationToken: "",
  passwordSalt: "demo-salt-registered01",
  passwordHash: "7a87a0b0a42b5a666475ad542c5d505c7b9ca7ec90c3fa1ba5f7026b5355c01a",
  citizenshipStatus: "Citizen of Belize",
  dob: "1998-05-12",
};

/** Registered panelist with pending admin verification — dashboard access, not yet verified */
export const DEMO_UNVERIFIED_REGISTERED_ACCOUNT: DemoAccountInfo = {
  id: "33333333-3333-3333-3333-333333333333",
  email: "demo.unverified@belizepanel.test",
  firstName: "Maria",
  lastName: "Casas",
  emailVerified: true,
  panelistRegistered: true,
  verificationToken: "",
  passwordSalt: "demo-salt-unverified01",
  passwordHash: "7627d44973506948359b8bbbba0be4ce7d0696398f90058dc190eb8219ecdbf1",
  citizenshipStatus: "Citizen of Belize",
  dob: "1995-08-22",
};

/** Full-access verified panelist — primary admin / QA demo for dashboard testing */
export const DEMO_ADMIN_ACCOUNT: DemoAccountInfo = {
  id: "44444444-4444-4444-4444-444444444444",
  email: "glen.avilez@belizepanel.test",
  firstName: "Glen",
  lastName: "Avilez",
  emailVerified: true,
  panelistRegistered: true,
  verificationToken: "",
  passwordSalt: "demo-salt-glen01",
  passwordHash: "69ad7ef6365972e1e0faea06dfd68af986aec29b44aa9c95502ccd2ea25c840d",
  citizenshipStatus: "Citizen of Belize",
  dob: "1982-04-10",
};

export const DEMO_ACCOUNTS = [
  DEMO_REGISTRATION_READY_ACCOUNT,
  DEMO_REGISTERED_ACCOUNT,
  DEMO_UNVERIFIED_REGISTERED_ACCOUNT,
  DEMO_ADMIN_ACCOUNT,
] as const;

export function isDemoAccountsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_ACCOUNTS === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true"
  );
}

export function getDemoAccountEmails(): Set<string> {
  return new Set(DEMO_ACCOUNTS.map((account) => account.email.toLowerCase()));
}
