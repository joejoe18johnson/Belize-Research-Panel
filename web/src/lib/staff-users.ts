import { createHash, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { DEMO_STAFF_USERS } from "./demo-staff-users";
import type { StaffRole } from "./staff-roles";
import { cleanText } from "./validation";

export interface StaffUserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
  password_salt: string;
  password_hash: string;
  status: "active" | "inactive";
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STAFF_USERS_FILE = path.join(DATA_DIR, "staff-users.json");

async function loadStaffUsersRaw(): Promise<StaffUserRecord[]> {
  try {
    const content = await fs.readFile(STAFF_USERS_FILE, "utf-8");
    const parsed = JSON.parse(content) as StaffUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveStaffUsersRaw(users: StaffUserRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STAFF_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function hashStaffPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function verifyStaffPassword(password: string, user: StaffUserRecord): boolean {
  const provided = Buffer.from(hashStaffPassword(password, user.password_salt));
  const expected = Buffer.from(user.password_hash);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function findStaffUserByEmail(email: string): Promise<StaffUserRecord | null> {
  const normalized = cleanText(email).toLowerCase();
  const users = await loadStaffUsersRaw();
  return users.find((user) => cleanText(user.email).toLowerCase() === normalized) ?? null;
}

export async function listStaffUsers(): Promise<StaffUserRecord[]> {
  return loadStaffUsersRaw();
}

export async function verifyStaffUserLogin(
  email: string,
  password: string
): Promise<StaffUserRecord | null> {
  const user = await findStaffUserByEmail(email);
  if (!user || user.status !== "active") return null;
  if (!password || !verifyStaffPassword(password, user)) return null;
  return user;
}

export async function seedStaffUsers(): Promise<{ created: number; updated: number }> {
  const users = await loadStaffUsersRaw();
  const demoEmails = new Set(DEMO_STAFF_USERS.map((user) => user.email.toLowerCase()));
  const preserved = users.filter((user) => !demoEmails.has(cleanText(user.email).toLowerCase()));
  const existingDemoCount = users.filter((user) => demoEmails.has(cleanText(user.email).toLowerCase())).length;
  const now = "2026-01-01T00:00:00.000Z";

  const seeded: StaffUserRecord[] = DEMO_STAFF_USERS.map((demo) => ({
    id: demo.id,
    email: demo.email,
    first_name: demo.firstName,
    last_name: demo.lastName,
    role: demo.role,
    password_salt: demo.passwordSalt,
    password_hash: demo.passwordHash,
    status: "active",
    created_at: now,
  }));

  await saveStaffUsersRaw([...preserved, ...seeded]);
  return {
    created: DEMO_STAFF_USERS.length - existingDemoCount,
    updated: existingDemoCount,
  };
}
