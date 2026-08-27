const DEFAULT_SIGNUP_NOTIFY_EMAIL = "johannesjohnsonj@gmail.com";

function isPlaceholderApplicantEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return lower.endsWith(".test") || lower.endsWith("example.com") || lower.endsWith("resend.dev");
}

export function getSignupNotifyEmail(): string {
  return process.env.SIGNUP_NOTIFY_EMAIL?.trim() || DEFAULT_SIGNUP_NOTIFY_EMAIL;
}

export function shouldSendSignupAdminNotification(applicantEmail: string): boolean {
  const notify = getSignupNotifyEmail().toLowerCase();
  const applicant = applicantEmail.trim().toLowerCase();
  if (!notify || !applicant) return false;
  if (isPlaceholderApplicantEmail(applicant)) return false;
  return true;
}
