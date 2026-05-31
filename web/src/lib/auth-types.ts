export type AccountStatus = "active" | "on_hold";
export type AccountHoldReason = "" | "email_change" | "phone_change" | "email_and_phone";

export interface AccountRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_salt: string;
  password_hash: string;
  email_verified: string;
  verification_token: string;
  verification_sent_at: string;
  created_at: string;
  panelist_registered: string;
  citizenship_status: string;
  commonwealth_country: string;
  dob: string;
  account_status?: AccountStatus;
  hold_reason?: AccountHoldReason;
  pending_email?: string;
  email_change_token?: string;
  email_change_sent_at?: string;
  email_change_requested_at?: string;
  pending_phone_whatsapp?: string;
  phone_change_requested_at?: string;
}

export interface SessionAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  panelistRegistered: boolean;
  citizenshipStatus: string;
  commonwealthCountry: string;
  dob: string;
  accountStatus: AccountStatus;
  holdReason: AccountHoldReason;
  pendingEmail: string;
  pendingPhone: string;
}

export interface SignupFormData {
  citizenshipStatus: string;
  commonwealthCountry: string;
  dob: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AccountContactHoldState {
  accountStatus: AccountStatus;
  holdReason: AccountHoldReason;
  pendingEmail: string;
  pendingPhone: string;
  phoneChangeRequestedAt: string;
  emailChangeRequestedAt: string;
  emailChangeSentAt: string;
}
