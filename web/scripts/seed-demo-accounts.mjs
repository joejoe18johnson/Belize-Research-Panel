import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

const DEMO_PASSWORD = "DemoPass1!";

const DEMO_ACCOUNTS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    first_name: "Johannes",
    last_name: "Johnson",
    email: "demo@belizepanel.test",
    password_salt: "demo-salt-registration01",
    email_verified: "true",
    verification_token: "",
    panelist_registered: "false",
    citizenship_status: "Citizen of Belize",
    commonwealth_country: "",
    dob: "1990-06-15",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    first_name: "Johannes",
    last_name: "Johnson",
    email: "johannesjohnsonj@gmail.com",
    password_salt: "demo-salt-registered01",
    email_verified: "true",
    verification_token: "",
    panelist_registered: "true",
    citizenship_status: "Citizen of Belize",
    commonwealth_country: "",
    dob: "1998-05-12",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    first_name: "Maria",
    last_name: "Casas",
    email: "demo.unverified@belizepanel.test",
    password_salt: "demo-salt-unverified01",
    email_verified: "true",
    verification_token: "",
    panelist_registered: "true",
    citizenship_status: "Citizen of Belize",
    commonwealth_country: "",
    dob: "1995-08-22",
  },
];

const LEGACY_DEMO_EMAILS = new Set([
  "demo@belizepanel.test",
  "demo.registered@belizepanel.test",
  "johannesjohnsonj@gmail.com",
  "demo.verified@belizepanel.test",
  "demo.unverified@belizepanel.test",
]);

function hashPassword(password, salt) {
  return createHash("sha256").update(salt + password).digest("hex");
}

async function main() {
  let accounts = [];
  try {
    accounts = JSON.parse(await readFile(ACCOUNTS_FILE, "utf-8"));
    if (!Array.isArray(accounts)) accounts = [];
  } catch {
    accounts = [];
  }

  const preserved = accounts.filter((account) => !LEGACY_DEMO_EMAILS.has(String(account.email).toLowerCase()));
  const now = "2026-01-01T00:00:00.000Z";

  const seeded = DEMO_ACCOUNTS.map((account) => ({
    ...account,
    password_hash: hashPassword(DEMO_PASSWORD, account.password_salt),
    verification_sent_at: now,
    created_at: now,
  }));

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ACCOUNTS_FILE, JSON.stringify([...preserved, ...seeded], null, 2), "utf-8");

  console.log("Demo accounts seeded.");
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.email} (${account.panelist_registered === "true" ? "registered panelist" : "ready for /register"})`);
  }
  console.log(`Password: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
