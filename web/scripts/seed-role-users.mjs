import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const STAFF_USERS_FILE = path.join(DATA_DIR, "staff-users.json");
const PANELISTS_FILE = path.join(DATA_DIR, "panelists.csv");

const STAFF_PASSWORD = "RoleTest1!";
const PANELIST_PASSWORD = "DemoPass1!";

const STAFF_USERS = [
  {
    id: "staff-00000000-0000-0000-0000-000000000001",
    email: "super.admin@belizepanel.test",
    first_name: "Super",
    last_name: "Admin",
    role: "super_admin",
    password_salt: "super-admin",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000002",
    email: "ops.manager@belizepanel.test",
    first_name: "Operations",
    last_name: "Manager",
    role: "operations_manager",
    password_salt: "ops-manager",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000003",
    email: "research.analyst@belizepanel.test",
    first_name: "Research",
    last_name: "Analyst",
    role: "research_analyst",
    password_salt: "research-analyst",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000004",
    email: "field.supervisor@belizepanel.test",
    first_name: "Field",
    last_name: "Supervisor",
    role: "field_supervisor",
    password_salt: "field-supervisor",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000005",
    email: "finance.officer@belizepanel.test",
    first_name: "Finance",
    last_name: "Officer",
    role: "finance_officer",
    password_salt: "finance-officer",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000006",
    email: "client.viewer@belizepanel.test",
    first_name: "Client",
    last_name: "Viewer",
    role: "client_viewer",
    password_salt: "client-viewer",
  },
];

const PANELIST_PERSONAS = [
  {
    id: "persona-00000000-0000-0000-0000-000000000001",
    email: "panelist.signup@belizepanel.test",
    first_name: "Signup",
    last_name: "Only",
    password_salt: "demo-salt-panelist-signup",
    panelist_registered: "false",
    account_status: "active",
    hold_reason: "",
    username: "",
    verification_status: "",
  },
  {
    id: "persona-00000000-0000-0000-0000-000000000002",
    email: "panelist.pending@belizepanel.test",
    first_name: "Pending",
    last_name: "Panelist",
    password_salt: "demo-salt-panelist-pending",
    panelist_registered: "true",
    account_status: "active",
    hold_reason: "",
    username: "panelist.pending",
    verification_status: "Pending",
  },
  {
    id: "persona-00000000-0000-0000-0000-000000000003",
    email: "panelist.verified@belizepanel.test",
    first_name: "Verified",
    last_name: "Panelist",
    password_salt: "demo-salt-panelist-verified",
    panelist_registered: "true",
    account_status: "active",
    hold_reason: "",
    username: "panelist.verified",
    verification_status: "Verified",
  },
  {
    id: "persona-00000000-0000-0000-0000-000000000004",
    email: "panelist.onhold@belizepanel.test",
    first_name: "On Hold",
    last_name: "Panelist",
    password_salt: "demo-salt-panelist-onhold",
    panelist_registered: "true",
    account_status: "on_hold",
    hold_reason: "fraud_review",
    username: "panelist.onhold",
    verification_status: "Pending",
  },
];

function hashPassword(password, salt) {
  return createHash("sha256").update(salt + password).digest("hex");
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildPanelistRow(persona, columns) {
  const values = Object.fromEntries(columns.map((column) => [column, ""]));
  values.registration_date = "01/06/2026 12:00";
  values.first_name = persona.first_name;
  values.last_name = persona.last_name;
  values.dob = "1992-03-15";
  values.age = "34";
  values.citizenship_status = "Citizen of Belize";
  values.voter_status = "Registered voter";
  values.district = "Belize District";
  values.city_town_village = "Belize City";
  values.constituency = "Albert";
  values.sex = "Female";
  values.education = "Bachelor's Degree";
  values.ethnicity = "Mestizo";
  values.email = persona.email;
  values.phone_whatsapp = "501-600-0000";
  values.username = persona.username;
  values.password_salt = "persona_salt";
  values.password_hash = "persona_hash";
  values.verification_status = persona.verification_status;
  values.admin_email_approved = persona.verification_status === "Verified" ? "true" : "";
  values.admin_phone_approved = persona.verification_status === "Verified" ? "true" : "";
  values.admin_photo_id_approved = persona.verification_status === "Verified" ? "true" : "";
  values.consent_research = "True";
  values.consent_contact = "True";
  values.consent_privacy = "True";
  values.status = "Active";
  return columns.map((column) => escapeCsv(values[column])).join(",");
}

async function seedStaffUsers(now) {
  let users = [];
  try {
    users = JSON.parse(await readFile(STAFF_USERS_FILE, "utf-8"));
    if (!Array.isArray(users)) users = [];
  } catch {
    users = [];
  }

  const demoEmails = new Set(STAFF_USERS.map((user) => user.email.toLowerCase()));
  const preserved = users.filter((user) => !demoEmails.has(String(user.email).toLowerCase()));
  const seeded = STAFF_USERS.map((user) => ({
    ...user,
    password_hash: hashPassword(STAFF_PASSWORD, user.password_salt),
    status: "active",
    created_at: now,
  }));

  await writeFile(STAFF_USERS_FILE, JSON.stringify([...preserved, ...seeded], null, 2), "utf-8");
}

async function seedPanelistPersonas(now) {
  let accounts = [];
  try {
    accounts = JSON.parse(await readFile(ACCOUNTS_FILE, "utf-8"));
    if (!Array.isArray(accounts)) accounts = [];
  } catch {
    accounts = [];
  }

  const personaEmails = new Set(PANELIST_PERSONAS.map((persona) => persona.email.toLowerCase()));
  const preserved = accounts.filter((account) => !personaEmails.has(String(account.email).toLowerCase()));

  const personaAccounts = PANELIST_PERSONAS.map((persona) => ({
    id: persona.id,
    first_name: persona.first_name,
    last_name: persona.last_name,
    email: persona.email,
    password_salt: persona.password_salt,
    password_hash: hashPassword(PANELIST_PASSWORD, persona.password_salt),
    email_verified: "true",
    verification_token: "",
    verification_sent_at: now,
    created_at: now,
    panelist_registered: persona.panelist_registered,
    citizenship_status: "Citizen of Belize",
    commonwealth_country: "",
    dob: "1992-03-15",
    account_status: persona.account_status,
    hold_reason: persona.hold_reason,
  }));

  await writeFile(
    ACCOUNTS_FILE,
    JSON.stringify([...preserved, ...personaAccounts], null, 2),
    "utf-8"
  );
}

async function seedPanelistCsvRows() {
  const content = await readFile(PANELISTS_FILE, "utf-8");
  const lines = content.trim().split("\n");
  const columns = parseCsvLine(lines[0]);
  const emailIndex = columns.indexOf("email");
  const personaEmails = new Set(
    PANELIST_PERSONAS.filter((persona) => persona.username).map((persona) => persona.email.toLowerCase())
  );

  const kept = lines.slice(1).filter((line) => {
    const cells = parseCsvLine(line);
    const email = String(cells[emailIndex] ?? "").toLowerCase();
    return !personaEmails.has(email);
  });

  const added = PANELIST_PERSONAS.filter((persona) => persona.username).map((persona) =>
    buildPanelistRow(persona, columns)
  );

  await writeFile(PANELISTS_FILE, [lines[0], ...kept, ...added].join("\n"), "utf-8");
}

async function main() {
  const now = "2026-01-01T00:00:00.000Z";
  await mkdir(DATA_DIR, { recursive: true });
  await seedStaffUsers(now);
  await seedPanelistPersonas(now);
  await seedPanelistCsvRows();

  console.log("Role test users seeded.");
  console.log("\nStaff accounts (admin login):");
  for (const user of STAFF_USERS) {
    console.log(`  ${user.email} — ${user.role}`);
  }
  console.log(`Staff password: ${STAFF_PASSWORD}`);
  console.log("\nPanelist personas (public /login):");
  for (const persona of PANELIST_PERSONAS) {
    console.log(`  ${persona.email}`);
  }
  console.log(`Panelist password: ${PANELIST_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
