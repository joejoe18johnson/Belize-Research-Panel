import { promises as fs } from "fs";
import path from "path";
import { ADMIN_MODULES } from "./admin-modules";
import {
  DEFAULT_ROLE_MODULE_ACCESS,
  STAFF_ROLE_DESCRIPTIONS,
  STAFF_ROLES,
  isStaffRole,
  type StaffRole,
} from "./staff-roles";

const DATA_FILE = path.join(process.cwd(), "data", "staff-role-access.json");
const VALID_MODULE_SLUGS = new Set(ADMIN_MODULES.map((module) => module.slug));

export interface StaffRoleAccessStore {
  modules: Partial<Record<StaffRole, string[]>>;
  descriptions?: Partial<Record<StaffRole, string>>;
}

function normalizeModuleSlugs(slugs: string[]): string[] {
  return slugs.filter((slug) => VALID_MODULE_SLUGS.has(slug));
}

function normalizeStore(raw: StaffRoleAccessStore): StaffRoleAccessStore {
  const modules: Partial<Record<StaffRole, string[]>> = {};
  for (const role of STAFF_ROLES) {
    const list = raw.modules?.[role];
    if (list) modules[role] = normalizeModuleSlugs(list);
  }

  const descriptions: Partial<Record<StaffRole, string>> = {};
  for (const role of STAFF_ROLES) {
    const value = raw.descriptions?.[role]?.trim();
    if (value) descriptions[role] = value;
  }

  return { modules, descriptions };
}

async function loadStaffRoleAccessStore(): Promise<StaffRoleAccessStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as StaffRoleAccessStore;
    return normalizeStore(parsed);
  } catch {
    return { modules: {}, descriptions: {} };
  }
}

async function saveStaffRoleAccessStore(store: StaffRoleAccessStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalizeStore(store), null, 2), "utf-8");
}

export function defaultRoleModuleSlugs(role: StaffRole): string[] {
  if (role === "super_admin") return ADMIN_MODULES.map((module) => module.slug);
  return [...DEFAULT_ROLE_MODULE_ACCESS[role]];
}

export async function getRoleModuleSlugs(role: StaffRole): Promise<string[]> {
  if (role === "super_admin") return defaultRoleModuleSlugs(role);
  const store = await loadStaffRoleAccessStore();
  return store.modules[role] ?? defaultRoleModuleSlugs(role);
}

export async function getAllRoleModuleAccess(): Promise<Record<StaffRole, string[]>> {
  const store = await loadStaffRoleAccessStore();
  return Object.fromEntries(
    STAFF_ROLES.map((role) => [
      role,
      role === "super_admin"
        ? defaultRoleModuleSlugs(role)
        : (store.modules[role] ?? defaultRoleModuleSlugs(role)),
    ])
  ) as Record<StaffRole, string[]>;
}

export async function getRoleDescription(role: StaffRole): Promise<string> {
  const store = await loadStaffRoleAccessStore();
  return store.descriptions?.[role]?.trim() || STAFF_ROLE_DESCRIPTIONS[role];
}

export async function getAllRoleDescriptions(): Promise<Record<StaffRole, string>> {
  const store = await loadStaffRoleAccessStore();
  return Object.fromEntries(
    STAFF_ROLES.map((role) => [role, store.descriptions?.[role]?.trim() || STAFF_ROLE_DESCRIPTIONS[role]])
  ) as Record<StaffRole, string>;
}

export async function saveRoleAccess(
  role: StaffRole,
  input: { modules?: string[]; description?: string }
): Promise<Record<StaffRole, string[]>> {
  if (!isStaffRole(role)) throw new Error("Select a valid staff role.");

  const store = await loadStaffRoleAccessStore();

  if (input.modules !== undefined) {
    if (role === "super_admin") throw new Error("Super Admin module access cannot be modified.");
    store.modules[role] = normalizeModuleSlugs(input.modules);
  }

  if (input.description !== undefined) {
    const description = input.description.trim();
    if (!store.descriptions) store.descriptions = {};
    if (description) store.descriptions[role] = description;
    else delete store.descriptions[role];
  }

  await saveStaffRoleAccessStore(store);
  return getAllRoleModuleAccess();
}

export async function resetRoleAccess(role: StaffRole): Promise<Record<StaffRole, string[]>> {
  if (!isStaffRole(role)) throw new Error("Select a valid staff role.");
  if (role === "super_admin") throw new Error("Super Admin permissions cannot be reset.");

  const store = await loadStaffRoleAccessStore();
  delete store.modules[role];
  if (store.descriptions) delete store.descriptions[role];
  await saveStaffRoleAccessStore(store);
  return getAllRoleModuleAccess();
}
