export const CLIENT_DEMO_PASSWORD = "ClientDemo1!";

export interface DemoClientUser {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
}

/** Demo client for the coastal tourism market research campaign. */
export const DEMO_CLIENT_USERS: DemoClientUser[] = [
  {
    id: "client-belize-tourism-board",
    organizationName: "Belize Tourism Board",
    contactName: "Maria Castillo",
    email: "client.tourism@belizepanel.test",
    passwordSalt: "belize-tourism-client",
    passwordHash: "0855ae5558ecad516f0a4be996e168d1a0a5cb5193f4cc8fe8ec7d2c38b478d1",
  },
];
