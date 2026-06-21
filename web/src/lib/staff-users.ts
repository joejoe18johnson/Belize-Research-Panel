import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { DEMO_STAFF_USERS } from "./demo-staff-users";
import { PASSWORD_RESET_TTL_MS } from "./accounts";
import { STAFF_ROLES, isStaffRole, type StaffRole } from "./staff-roles";
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
  updated_at?: string;
  password_reset_token?: string;
  password_reset_sent_at?: string;
}

export type StaffUserPublic = Omit<StaffUserRecord, "password_salt" | "password_hash">;

const DATA_DIR = path.join(process.cwd(), "data");
const STAFF_USERS_FILE = path.join(DATA_DIR, "staff-users.json");

function normalizeStaffUserRecord(user: StaffUserRecord): StaffUserRecord {
  return {
    id: cleanText(user.id),
    email: cleanText(user.email).toLowerCase(),
    first_name: cleanText(user.first_name),
    last_name: cleanText(user.last_name),
    role: isStaffRole(user.role) ? user.role : "operations_manager",
    password_salt: user.password_salt,
    password_hash: user.password_hash,
    status: user.status === "inactive" ? "inactive" : "active",
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function toPublicStaffUser(user: StaffUserRecord): StaffUserPublic {
  const { password_salt: _salt, password_hash: _hash, ...publicUser } = normalizeStaffUserRecord(user);
  return publicUser;
}

async function loadStaffUsersRaw(): Promise<StaffUserRecord[]> {
  try {
    const content = await fs.readFile(STAFF_USERS_FILE, "utf-8");
    const parsed = JSON.parse(content) as StaffUserRecord[];
    return Array.isArray(parsed) ? parsed.map(normalizeStaffUserRecord) : [];
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

function createPasswordCredentials(password: string): { password_salt: string; password_hash: string } {
  const password_salt = randomUUID().replace(/-/g, "").slice(0, 16);
  return {
    password_salt,
    password_hash: hashStaffPassword(password, password_salt),
  };
}

function verifyStaffPassword(password: string, user: StaffUserRecord): boolean {
  const provided = Buffer.from(hashStaffPassword(password, user.password_salt));
  const expected = Buffer.from(user.password_hash);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function countActiveSuperAdmins(users: StaffUserRecord[], excludeId?: string): number {
  return users.filter(
    (user) => user.role === "super_admin" && user.status === "active" && user.id !== excludeId
  ).length;
}

function assertSuperAdminPreserved(users: StaffUserRecord[], targetId: string, next: Partial<StaffUserRecord>): void {
  const current = users.find((user) => user.id === targetId);
  if (!current || current.role !== "super_admin") return;

  const nextRole = next.role ?? current.role;
  const nextStatus = next.status ?? current.status;
  const remaining = countActiveSuperAdmins(users, targetId);

  if (nextRole !== "super_admin" || nextStatus !== "active") {
    if (remaining === 0) {
      throw new Error("At least one active Super Admin account is required.");
    }
  }
}

export async function findStaffUserByEmail(email: string): Promise<StaffUserRecord | null> {
  const normalized = cleanText(email).toLowerCase();
  const users = await loadStaffUsersRaw();
  return users.find((user) => cleanText(user.email).toLowerCase() === normalized) ?? null;
}

export async function findStaffUserById(id: string): Promise<StaffUserRecord | null> {
  const users = await loadStaffUsersRaw();
  return users.find((user) => user.id === id) ?? null;
}

export function isStaffPasswordResetTokenValid(user: StaffUserRecord): boolean {
  const token = cleanText(user.password_reset_token ?? "");
  const sentAt = cleanText(user.password_reset_sent_at ?? "");
  if (!token || !sentAt) return false;
  const sent = Date.parse(sentAt);
  if (Number.isNaN(sent)) return false;
  return Date.now() - sent <= PASSWORD_RESET_TTL_MS;
}

export async function findStaffUserByPasswordResetToken(token: string): Promise<StaffUserRecord | null> {
  if (!token) return null;
  const users = await loadStaffUsersRaw();
  const user = users.find((row) => cleanText(row.password_reset_token ?? "") === token) ?? null;
  if (!user || user.status !== "active" || !isStaffPasswordResetTokenValid(user)) return null;
  return user;
}

export async function createStaffPasswordResetToken(
  email: string
): Promise<{ user: StaffUserRecord; resetToken: string } | null> {
  const user = await findStaffUserByEmail(email);
  if (!user || user.status !== "active") return null;

  const resetToken = randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();
  const users = await loadStaffUsersRaw();
  const index = users.findIndex((row) => row.id === user.id);
  if (index < 0) return null;

  users[index] = {
    ...users[index],
    password_reset_token: resetToken,
    password_reset_sent_at: now,
    updated_at: now,
  };
  await saveStaffUsersRaw(users);
  return { user: users[index], resetToken };
}

export async function resetStaffUserPassword(
  token: string,
  password: string
): Promise<{ ok: true; user: StaffUserRecord } | { ok: false; error: string }> {
  const user = await findStaffUserByPasswordResetToken(token);
  if (!user) {
    return { ok: false, error: "This password reset link is invalid or has expired." };
  }

  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const users = await loadStaffUsersRaw();
  const index = users.findIndex((row) => row.id === user.id);
  if (index < 0) {
    return { ok: false, error: "Staff account not found." };
  }

  const now = new Date().toISOString();
  users[index] = {
    ...users[index],
    ...createPasswordCredentials(trimmed),
    password_reset_token: "",
    password_reset_sent_at: "",
    updated_at: now,
  };
  await saveStaffUsersRaw(users);
  return { ok: true, user: users[index] };
}

export async function listStaffUsers(): Promise<StaffUserRecord[]> {
  const users = await loadStaffUsersRaw();
  return users.sort((a, b) => {
    const nameA = `${a.first_name} ${a.last_name}`.trim().toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.trim().toLowerCase();
    return nameA.localeCompare(nameB) || a.email.localeCompare(b.email);
  });
}

export async function listPublicStaffUsers(): Promise<StaffUserPublic[]> {
  const users = await listStaffUsers();
  return users.map(toPublicStaffUser);
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

export async function createStaffUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  password: string;
  status?: "active" | "inactive";
}): Promise<StaffUserRecord> {
  const email = cleanText(input.email).toLowerCase();
  const first_name = cleanText(input.firstName);
  const last_name = cleanText(input.lastName);
  const role = input.role;
  const password = input.password.trim();
  const status = input.status === "inactive" ? "inactive" : "active";

  if (!email) throw new Error("Staff email is required.");
  if (!first_name || !last_name) throw new Error("First and last name are required.");
  if (!STAFF_ROLES.includes(role)) throw new Error("Select a valid staff role.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const users = await loadStaffUsersRaw();
  if (users.some((user) => cleanText(user.email).toLowerCase() === email)) {
    throw new Error("A staff account with this email already exists.");
  }

  const now = new Date().toISOString();
  const user: StaffUserRecord = {
    id: `staff-${randomUUID()}`,
    email,
    first_name,
    last_name,
    role,
    status,
    created_at: now,
    updated_at: now,
    ...createPasswordCredentials(password),
  };

  users.push(user);
  await saveStaffUsersRaw(users);
  return user;
}

export async function updateStaffUser(
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    role?: StaffRole;
    status?: "active" | "inactive";
    password?: string;
  }
): Promise<StaffUserRecord> {
  const users = await loadStaffUsersRaw();
  const index = users.findIndex((user) => user.id === id);
  if (index < 0) throw new Error("Staff account not found.");

  const current = users[index];
  const next: StaffUserRecord = {
    ...current,
    first_name: input.firstName !== undefined ? cleanText(input.firstName) : current.first_name,
    last_name: input.lastName !== undefined ? cleanText(input.lastName) : current.last_name,
    role: input.role !== undefined ? input.role : current.role,
    status: input.status !== undefined ? (input.status === "inactive" ? "inactive" : "active") : current.status,
    updated_at: new Date().toISOString(),
  };

  if (!next.first_name || !next.last_name) throw new Error("First and last name are required.");
  if (!STAFF_ROLES.includes(next.role)) throw new Error("Select a valid staff role.");

  if (input.password !== undefined) {
    const password = input.password.trim();
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    Object.assign(next, createPasswordCredentials(password));
  }

  assertSuperAdminPreserved(users, id, next);
  users[index] = next;
  await saveStaffUsersRaw(users);
  return next;
}

export async function deleteStaffUser(id: string): Promise<void> {
  const users = await loadStaffUsersRaw();
  const target = users.find((user) => user.id === id);
  if (!target) throw new Error("Staff account not found.");

  assertSuperAdminPreserved(users, id, { role: "operations_manager", status: "inactive" });

  const next = users.filter((user) => user.id !== id);
  await saveStaffUsersRaw(next);
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
