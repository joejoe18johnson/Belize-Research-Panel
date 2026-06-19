import { createHash, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { DEMO_CLIENT_USERS } from "./demo-clients";
import { cleanText } from "./validation";

export interface ClientUserRecord {
  id: string;
  organization_name: string;
  contact_name: string;
  email: string;
  password_salt: string;
  password_hash: string;
  status: "active" | "inactive";
  created_at: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "clients.json");

async function loadClientsRaw(): Promise<ClientUserRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as ClientUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveClientsRaw(clients: ClientUserRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(clients, null, 2), "utf-8");
}

function hashClientPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function verifyClientPassword(password: string, client: ClientUserRecord): boolean {
  const provided = Buffer.from(hashClientPassword(password, client.password_salt));
  const expected = Buffer.from(client.password_hash);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function listClientUsers(): Promise<ClientUserRecord[]> {
  return loadClientsRaw();
}

export async function findClientUserByEmail(email: string): Promise<ClientUserRecord | null> {
  const normalized = cleanText(email).toLowerCase();
  const clients = await loadClientsRaw();
  return clients.find((client) => cleanText(client.email).toLowerCase() === normalized) ?? null;
}

export async function findClientUserById(id: string): Promise<ClientUserRecord | null> {
  const normalized = cleanText(id);
  const clients = await loadClientsRaw();
  return clients.find((client) => client.id === normalized) ?? null;
}

export async function verifyClientUserLogin(
  email: string,
  password: string
): Promise<ClientUserRecord | null> {
  const client = await findClientUserByEmail(email);
  if (!client || client.status !== "active") return null;
  if (!password || !verifyClientPassword(password, client)) return null;
  return client;
}

export async function seedClientUsers(): Promise<{ created: number; updated: number }> {
  const clients = await loadClientsRaw();
  const demoEmails = new Set(DEMO_CLIENT_USERS.map((client) => client.email.toLowerCase()));
  const preserved = clients.filter((client) => !demoEmails.has(cleanText(client.email).toLowerCase()));
  const existingDemoCount = clients.filter((client) =>
    demoEmails.has(cleanText(client.email).toLowerCase())
  ).length;
  const now = "2026-01-01T00:00:00.000Z";

  const seeded: ClientUserRecord[] = DEMO_CLIENT_USERS.map((demo) => ({
    id: demo.id,
    organization_name: demo.organizationName,
    contact_name: demo.contactName,
    email: demo.email,
    password_salt: demo.passwordSalt,
    password_hash: demo.passwordHash,
    status: "active",
    created_at: now,
  }));

  await saveClientsRaw([...preserved, ...seeded]);
  return {
    created: DEMO_CLIENT_USERS.length - existingDemoCount,
    updated: existingDemoCount,
  };
}
