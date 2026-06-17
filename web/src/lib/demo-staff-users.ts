import type { StaffRole } from "./staff-roles";

export const STAFF_DEMO_PASSWORD = "RoleTest1!";

export interface DemoStaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  passwordSalt: string;
  passwordHash: string;
}

export const DEMO_STAFF_USERS: DemoStaffUser[] = [
  {
    id: "staff-00000000-0000-0000-0000-000000000001",
    email: "super.admin@belizepanel.test",
    firstName: "Super",
    lastName: "Admin",
    role: "super_admin",
    passwordSalt: "super-admin",
    passwordHash: "d36feec56f50b724f12750c1b38ec5b520c7f2439b42bc8ae488676b82e34722",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000002",
    email: "ops.manager@belizepanel.test",
    firstName: "Operations",
    lastName: "Manager",
    role: "operations_manager",
    passwordSalt: "ops-manager",
    passwordHash: "2acc0dc715cd477e93854eabf5a735ef0f8377cfcd9a6959df11a9cc6dc403fc",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000003",
    email: "research.analyst@belizepanel.test",
    firstName: "Research",
    lastName: "Analyst",
    role: "research_analyst",
    passwordSalt: "research-analyst",
    passwordHash: "8a0ad885172c9b06ae7ccb82d96ffb497478c31f7a6f3feca4985cc291c73e37",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000004",
    email: "field.supervisor@belizepanel.test",
    firstName: "Field",
    lastName: "Supervisor",
    role: "field_supervisor",
    passwordSalt: "field-supervisor",
    passwordHash: "6bc0d82baeae7740f5aa81a4f786b80137211c43544400a69e4df530606c29cf",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000005",
    email: "finance.officer@belizepanel.test",
    firstName: "Finance",
    lastName: "Officer",
    role: "finance_officer",
    passwordSalt: "finance-officer",
    passwordHash: "d625447934583a5992f483d75dec13269807f35bed77076ec9026ed51b104252",
  },
  {
    id: "staff-00000000-0000-0000-0000-000000000006",
    email: "client.viewer@belizepanel.test",
    firstName: "Client",
    lastName: "Viewer",
    role: "client_viewer",
    passwordSalt: "client-viewer",
    passwordHash: "70b4c4cfc01a1ecd24dabce8b20470968f31597c3a8916b90a4c0be4b93aacc0",
  },
];

export function getDemoStaffEmails(): Set<string> {
  return new Set(DEMO_STAFF_USERS.map((user) => user.email.toLowerCase()));
}
