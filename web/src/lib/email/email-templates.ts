import {
  buildBrandedEmailHtml,
  detailRow,
  detailTable,
  htmlToPlainText,
  mutedParagraph,
  paragraph,
} from "./branded-email-layout";

export type EmailTemplateCategory =
  | "account"
  | "verification"
  | "surveys"
  | "rewards"
  | "staff";

export type EmailTemplateId =
  | "signup-verify-email"
  | "password-reset"
  | "registration-submitted"
  | "panelist-verified"
  | "panelist-on-hold"
  | "email-change-requested"
  | "email-change-approved"
  | "phone-change-requested"
  | "phone-change-approved"
  | "survey-invitation"
  | "survey-reminder"
  | "survey-completed"
  | "redemption-submitted"
  | "payout-processing"
  | "payout-completed"
  | "payout-rejected"
  | "account-deleted"
  | "staff-welcome"
  | "staff-password-reset"
  | "support-request-received"
  | "support-inbox-notification";

export interface EmailTemplateMeta {
  id: EmailTemplateId;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  trigger: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const EMAIL_TEMPLATE_CATEGORIES: Record<EmailTemplateCategory, string> = {
  account: "Account & onboarding",
  verification: "Verification & profile",
  surveys: "Surveys & campaigns",
  rewards: "Rewards & payouts",
  staff: "Staff & admin",
};

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  {
    id: "signup-verify-email",
    name: "Verify email address",
    description: "Sent after signup with a link to confirm the panelist email.",
    category: "account",
    trigger: "POST /api/auth/signup",
  },
  {
    id: "password-reset",
    name: "Password reset",
    description: "Sent when a panelist requests a link to reset their password.",
    category: "account",
    trigger: "POST /api/auth/forgot-password",
  },
  {
    id: "registration-submitted",
    name: "Registration submitted",
    description: "Confirms panelist registration was received and is under review.",
    category: "account",
    trigger: "POST /api/register",
  },
  {
    id: "panelist-verified",
    name: "Panelist verified",
    description: "Sent when an administrator fully verifies a panelist.",
    category: "verification",
    trigger: "PATCH /api/admin/panelists/[email]",
  },
  {
    id: "panelist-on-hold",
    name: "Account on hold",
    description: "Sent when a profile change puts the account on hold pending review.",
    category: "verification",
    trigger: "Email or phone change request",
  },
  {
    id: "email-change-requested",
    name: "Email change requested",
    description: "Acknowledges a pending email change awaiting admin approval.",
    category: "verification",
    trigger: "POST /api/profile/request-email-change",
  },
  {
    id: "email-change-approved",
    name: "Email change approved",
    description: "Confirms the new email address is active on the account.",
    category: "verification",
    trigger: "POST /api/admin/approve-email-change",
  },
  {
    id: "phone-change-requested",
    name: "Phone change requested",
    description: "Acknowledges a pending phone change awaiting admin approval.",
    category: "verification",
    trigger: "POST /api/profile/request-phone-change",
  },
  {
    id: "phone-change-approved",
    name: "Phone change approved",
    description: "Confirms the new phone number is verified on the account.",
    category: "verification",
    trigger: "POST /api/admin/approve-phone-change",
  },
  {
    id: "survey-invitation",
    name: "Survey invitation",
    description: "Invites a verified panelist to a new survey campaign.",
    category: "surveys",
    trigger: "POST /api/admin/campaigns",
  },
  {
    id: "survey-reminder",
    name: "Survey reminder",
    description: "Reminds a panelist about an open survey before the due date.",
    category: "surveys",
    trigger: "Scheduled reminder (manual / future automation)",
  },
  {
    id: "survey-completed",
    name: "Survey completed",
    description: "Thanks a panelist after they complete a survey assignment.",
    category: "surveys",
    trigger: "Survey submission",
  },
  {
    id: "redemption-submitted",
    name: "Redemption submitted",
    description: "Confirms a reward redemption request was received.",
    category: "rewards",
    trigger: "POST /api/rewards/redeem",
  },
  {
    id: "payout-processing",
    name: "Payout processing",
    description: "Notifies a panelist their payout is being processed.",
    category: "rewards",
    trigger: "POST /api/admin/payouts/requests (start)",
  },
  {
    id: "payout-completed",
    name: "Payout completed",
    description: "Confirms a payout has been completed.",
    category: "rewards",
    trigger: "POST /api/admin/payouts/requests (complete)",
  },
  {
    id: "payout-rejected",
    name: "Payout declined",
    description: "Notifies a panelist their redemption was not approved.",
    category: "rewards",
    trigger: "POST /api/admin/payouts/requests (reject)",
  },
  {
    id: "account-deleted",
    name: "Account deleted",
    description: "Confirms account deletion and opt-out from the panel.",
    category: "account",
    trigger: "POST /api/account/delete",
  },
  {
    id: "staff-welcome",
    name: "Staff welcome",
    description: "Welcome email for new admin staff accounts.",
    category: "staff",
    trigger: "POST /api/admin/staff-users",
  },
  {
    id: "staff-password-reset",
    name: "Staff password reset",
    description: "Sent when an admin staff member requests a password reset link.",
    category: "staff",
    trigger: "POST /api/admin/forgot-password",
  },
  {
    id: "support-request-received",
    name: "Support request received",
    description: "Confirms a panelist help request was received and gives expected response time.",
    category: "account",
    trigger: "POST /api/support/contact",
  },
  {
    id: "support-inbox-notification",
    name: "Support inbox notification",
    description: "Alerts the monitored support inbox when a new help request is submitted.",
    category: "staff",
    trigger: "POST /api/support/contact",
  },
];

export const EMAIL_TEMPLATE_SAMPLE_DATA: Record<EmailTemplateId, Record<string, string>> = {
  "signup-verify-email": {
    firstName: "Maria",
    verifyUrl: "https://panel.example.com/verify-email?token=sample-token",
  },
  "password-reset": {
    firstName: "Maria",
    resetUrl: "https://panel.example.com/reset-password?token=sample-token",
  },
  "registration-submitted": {
    firstName: "Maria",
    dashboardUrl: "https://panel.example.com/dashboard",
  },
  "panelist-verified": {
    firstName: "Maria",
    dashboardUrl: "https://panel.example.com/dashboard",
  },
  "panelist-on-hold": {
    firstName: "Maria",
    reason: "Your email change is pending administrator approval.",
    dashboardUrl: "https://panel.example.com/dashboard/account-on-hold",
  },
  "email-change-requested": {
    firstName: "Maria",
    pendingEmail: "maria.new@example.com",
    dashboardUrl: "https://panel.example.com/dashboard/account-on-hold",
  },
  "email-change-approved": {
    firstName: "Maria",
    newEmail: "maria.new@example.com",
    dashboardUrl: "https://panel.example.com/dashboard",
  },
  "phone-change-requested": {
    firstName: "Maria",
    pendingPhone: "+501 612-3456",
    dashboardUrl: "https://panel.example.com/dashboard/account-on-hold",
  },
  "phone-change-approved": {
    firstName: "Maria",
    newPhone: "+501 612-3456",
    dashboardUrl: "https://panel.example.com/dashboard",
  },
  "survey-invitation": {
    firstName: "Maria",
    campaignTitle: "Belize Civic Pulse — June 2026",
    points: "150",
    completeByDate: "June 30, 2026",
    surveyLink: "https://panel.example.com/dashboard/surveys/campaign-demo",
    dashboardUrl: "https://panel.example.com/dashboard/surveys",
  },
  "survey-reminder": {
    firstName: "Maria",
    campaignTitle: "Belize Civic Pulse — June 2026",
    completeByDate: "June 30, 2026",
    surveyLink: "https://panel.example.com/dashboard/surveys/campaign-demo",
  },
  "survey-completed": {
    firstName: "Maria",
    campaignTitle: "Belize Civic Pulse — June 2026",
    points: "150",
    dashboardUrl: "https://panel.example.com/dashboard/surveys",
  },
  "redemption-submitted": {
    firstName: "Maria",
    optionLabel: "Bank transfer",
    amount: "BZ$50.00",
    referenceId: "RD-8F2A1C",
    dashboardUrl: "https://panel.example.com/dashboard/payouts",
  },
  "payout-processing": {
    firstName: "Maria",
    optionLabel: "Bank transfer",
    amount: "BZ$50.00",
    referenceId: "PO-8F2A1C",
    dashboardUrl: "https://panel.example.com/dashboard/payouts",
  },
  "payout-completed": {
    firstName: "Maria",
    optionLabel: "Bank transfer",
    amount: "BZ$50.00",
    referenceId: "PO-8F2A1C",
    dashboardUrl: "https://panel.example.com/dashboard/payouts",
  },
  "payout-rejected": {
    firstName: "Maria",
    optionLabel: "Bank transfer",
    amount: "BZ$50.00",
    referenceId: "PO-8F2A1C",
    dashboardUrl: "https://panel.example.com/dashboard/payouts",
  },
  "account-deleted": {
    firstName: "Maria",
  },
  "staff-welcome": {
    firstName: "Alex",
    roleLabel: "Operations Manager",
    loginUrl: "https://panel.example.com/admin/login",
    email: "alex.admin@example.com",
  },
  "staff-password-reset": {
    firstName: "Alex",
    resetUrl: "https://panel.example.com/admin/reset-password?token=sample-token",
    loginUrl: "https://panel.example.com/admin/login",
  },
  "support-request-received": {
    firstName: "Maria",
    topicLabel: "Rewards & payouts",
    referenceId: "SUP-8F2A1C",
    helpUrl: "https://panel.example.com/help",
  },
  "support-inbox-notification": {
    name: "Maria Lopez",
    email: "maria@example.com",
    topicLabel: "Rewards & payouts",
    referenceId: "SUP-8F2A1C",
    messagePreview: "I submitted a redemption last week and wanted to check the status.",
    adminInboxUrl: "https://panel.example.com/admin/support-inbox",
  },
};

function pick(data: Record<string, string>, key: string, fallback = ""): string {
  return data[key]?.trim() || fallback;
}

function finish(subject: string, bodyHtml: string, cta?: { label: string; href: string }): RenderedEmail {
  const html = buildBrandedEmailHtml({
    title: subject,
    preheader: subject,
    bodyHtml,
    cta,
  });
  return { subject, html, text: htmlToPlainText(html) };
}

function renderSignupVerifyEmail(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const verifyUrl = pick(data, "verifyUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Thanks for joining the Belize Research Panel. Please confirm your email address to continue with registration."),
    mutedParagraph("This link expires after 24 hours. If you did not create an account, you can ignore this message."),
  ].join("");
  return finish("Verify your email address", bodyHtml, { label: "Verify email", href: verifyUrl });
}

function renderPasswordResetEmail(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const resetUrl = pick(data, "resetUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received a request to reset the password for your Belize Research Panel account."),
    paragraph("If you made this request, use the button below to choose a new password."),
    mutedParagraph("This link expires after one hour. If you did not request a password reset, you can ignore this email — your password will stay the same."),
  ].join("");
  return finish("Reset your password", bodyHtml, { label: "Reset password", href: resetUrl });
}

function renderRegistrationSubmitted(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received your panelist registration. Our team will review your details and verify your documents."),
    paragraph("You can sign in anytime to check your status. We will email you when verification is complete."),
  ].join("");
  return finish("Registration received", bodyHtml, { label: "View dashboard", href: dashboardUrl });
}

function renderPanelistVerified(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Great news — your Belize Research Panel account is fully verified."),
    paragraph("You can now participate in surveys and redeem your reward points."),
  ].join("");
  return finish("You are verified", bodyHtml, { label: "Go to dashboard", href: dashboardUrl });
}

function renderPanelistOnHold(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const reason = pick(data, "reason", "A profile change requires administrator review.");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your account is temporarily on hold while our team reviews a recent change."),
    paragraph(reason),
    mutedParagraph("Survey participation and redemptions are paused until review is complete."),
  ].join("");
  return finish("Account on hold", bodyHtml, { label: "View account status", href: dashboardUrl });
}

function renderEmailChangeRequested(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const pendingEmail = pick(data, "pendingEmail", "your new address");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received your request to change the email address on your account."),
    detailTable(detailRow("Pending email", pendingEmail)),
    paragraph("An administrator will review and approve the change. Your account remains on hold until then."),
  ].join("");
  return finish("Email change pending approval", bodyHtml, { label: "View account status", href: dashboardUrl });
}

function renderEmailChangeApproved(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const newEmail = pick(data, "newEmail", "your new address");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your email change has been approved."),
    detailTable(detailRow("Active email", newEmail)),
    paragraph("Your account is active again. Sign in with your new email address."),
  ].join("");
  return finish("Email change approved", bodyHtml, { label: "Sign in", href: dashboardUrl });
}

function renderPhoneChangeRequested(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const pendingPhone = pick(data, "pendingPhone", "your new number");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received your request to update your phone / WhatsApp number."),
    detailTable(detailRow("Pending number", pendingPhone)),
    paragraph("An administrator will verify the number. Your account remains on hold until approval."),
  ].join("");
  return finish("Phone change pending approval", bodyHtml, { label: "View account status", href: dashboardUrl });
}

function renderPhoneChangeApproved(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const newPhone = pick(data, "newPhone", "your new number");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your phone / WhatsApp number has been verified."),
    detailTable(detailRow("Active number", newPhone)),
    paragraph("Your account is active again."),
  ].join("");
  return finish("Phone change approved", bodyHtml, { label: "Go to dashboard", href: dashboardUrl });
}

function renderSurveyInvitation(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const campaignTitle = pick(data, "campaignTitle", "New survey");
  const points = pick(data, "points", "100");
  const completeByDate = pick(data, "completeByDate", "soon");
  const surveyLink = pick(data, "surveyLink", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("You have been invited to participate in a new survey."),
    detailTable(
      detailRow("Survey", campaignTitle) +
        detailRow("Reward", `${points} points`) +
        detailRow("Complete by", completeByDate)
    ),
    paragraph("Your responses help shape research that matters to Belize."),
  ].join("");
  return finish(`New survey: ${campaignTitle}`, bodyHtml, { label: "Start survey", href: surveyLink });
}

function renderSurveyReminder(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const campaignTitle = pick(data, "campaignTitle", "Open survey");
  const completeByDate = pick(data, "completeByDate", "soon");
  const surveyLink = pick(data, "surveyLink", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph(`This is a friendly reminder about "${campaignTitle}".`),
    detailTable(detailRow("Complete by", completeByDate)),
    paragraph("Please complete the survey before the deadline to earn your points."),
  ].join("");
  return finish(`Reminder: ${campaignTitle}`, bodyHtml, { label: "Continue survey", href: surveyLink });
}

function renderSurveyCompleted(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const campaignTitle = pick(data, "campaignTitle", "Survey");
  const points = pick(data, "points", "100");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph(`Thank you for completing "${campaignTitle}".`),
    detailTable(detailRow("Points earned", points)),
    paragraph("Your reward balance has been updated."),
  ].join("");
  return finish("Survey completed — thank you", bodyHtml, { label: "View surveys", href: dashboardUrl });
}

function renderRedemptionSubmitted(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const optionLabel = pick(data, "optionLabel", "Reward");
  const amount = pick(data, "amount", "BZ$0.00");
  const referenceId = pick(data, "referenceId", "—");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received your redemption request."),
    detailTable(
      detailRow("Option", optionLabel) + detailRow("Amount", amount) + detailRow("Reference", referenceId)
    ),
    mutedParagraph("Our team will process your request within 5–7 business days."),
  ].join("");
  return finish("Redemption request received", bodyHtml, { label: "Track payout", href: dashboardUrl });
}

function renderPayoutProcessing(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const optionLabel = pick(data, "optionLabel", "Reward");
  const amount = pick(data, "amount", "BZ$0.00");
  const referenceId = pick(data, "referenceId", "—");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your redemption is now being processed."),
    detailTable(
      detailRow("Option", optionLabel) + detailRow("Amount", amount) + detailRow("Reference", referenceId)
    ),
  ].join("");
  return finish("Payout processing", bodyHtml, { label: "View payout status", href: dashboardUrl });
}

function renderPayoutCompleted(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const optionLabel = pick(data, "optionLabel", "Reward");
  const amount = pick(data, "amount", "BZ$0.00");
  const referenceId = pick(data, "referenceId", "—");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your payout has been completed."),
    detailTable(
      detailRow("Option", optionLabel) + detailRow("Amount", amount) + detailRow("Reference", referenceId)
    ),
    paragraph("Thank you for participating in the Belize Research Panel."),
  ].join("");
  return finish("Payout completed", bodyHtml, { label: "View payout details", href: dashboardUrl });
}

function renderPayoutRejected(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const optionLabel = pick(data, "optionLabel", "Reward");
  const amount = pick(data, "amount", "BZ$0.00");
  const referenceId = pick(data, "referenceId", "—");
  const dashboardUrl = pick(data, "dashboardUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Your redemption request was not approved at this time."),
    detailTable(
      detailRow("Option", optionLabel) + detailRow("Amount", amount) + detailRow("Reference", referenceId)
    ),
    mutedParagraph("Your points remain in your balance. Contact support if you have questions."),
  ].join("");
  return finish("Payout request declined", bodyHtml, { label: "View rewards", href: dashboardUrl });
}

function renderAccountDeleted(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("This confirms your Belize Research Panel account has been deleted and you have opted out of future contact."),
    mutedParagraph("If you did not request this, contact our team immediately."),
  ].join("");
  return finish("Account deleted", bodyHtml);
}

function renderStaffWelcome(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const roleLabel = pick(data, "roleLabel", "Staff");
  const loginUrl = pick(data, "loginUrl", "#");
  const email = pick(data, "email", "your admin email");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("An administrator account has been created for you on the Belize Research Panel admin console."),
    detailTable(detailRow("Role", roleLabel) + detailRow("Login email", email)),
    mutedParagraph("Use the password provided by your administrator when signing in for the first time."),
  ].join("");
  return finish("Welcome to the admin console", bodyHtml, { label: "Admin sign in", href: loginUrl });
}

function renderStaffPasswordResetEmail(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const resetUrl = pick(data, "resetUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("We received a request to reset the password for your Belize Research Panel admin account."),
    paragraph("If you made this request, use the button below to choose a new password."),
    mutedParagraph("This link expires after one hour. If you did not request a password reset, you can ignore this email."),
  ].join("");
  return finish("Reset your admin password", bodyHtml, { label: "Reset password", href: resetUrl });
}

function renderSupportRequestReceived(data: Record<string, string>): RenderedEmail {
  const firstName = pick(data, "firstName", "there");
  const topicLabel = pick(data, "topicLabel", "your enquiry");
  const referenceId = pick(data, "referenceId", "—");
  const helpUrl = pick(data, "helpUrl", "#");
  const bodyHtml = [
    paragraph(`Hi ${firstName},`),
    paragraph("Thanks for contacting the Belize Research Panel support team."),
    detailTable(
      detailRow("Topic", topicLabel) + detailRow("Reference", referenceId)
    ),
    paragraph("We typically respond within 1–2 business days. If your matter is urgent, reply to this email with your reference number."),
    mutedParagraph("Please do not share your password or photo ID in email replies."),
  ].join("");
  return finish("We received your message", bodyHtml, { label: "Visit help centre", href: helpUrl });
}

function renderSupportInboxNotification(data: Record<string, string>): RenderedEmail {
  const name = pick(data, "name", "Panelist");
  const email = pick(data, "email", "unknown");
  const topicLabel = pick(data, "topicLabel", "General enquiry");
  const referenceId = pick(data, "referenceId", "—");
  const messagePreview = pick(data, "messagePreview", "");
  const adminInboxUrl = pick(data, "adminInboxUrl", "#");
  const bodyHtml = [
    paragraph("A new help request was submitted on the Belize Research Panel website."),
    detailTable(
      detailRow("From", name) +
        detailRow("Email", email) +
        detailRow("Topic", topicLabel) +
        detailRow("Reference", referenceId)
    ),
    paragraph(messagePreview ? `"${messagePreview}"` : "Open the admin support inbox for the full message."),
  ].join("");
  return finish(`Support request: ${topicLabel}`, bodyHtml, { label: "Open support inbox", href: adminInboxUrl });
}

const RENDERERS: Record<EmailTemplateId, (data: Record<string, string>) => RenderedEmail> = {
  "signup-verify-email": renderSignupVerifyEmail,
  "password-reset": renderPasswordResetEmail,
  "registration-submitted": renderRegistrationSubmitted,
  "panelist-verified": renderPanelistVerified,
  "panelist-on-hold": renderPanelistOnHold,
  "email-change-requested": renderEmailChangeRequested,
  "email-change-approved": renderEmailChangeApproved,
  "phone-change-requested": renderPhoneChangeRequested,
  "phone-change-approved": renderPhoneChangeApproved,
  "survey-invitation": renderSurveyInvitation,
  "survey-reminder": renderSurveyReminder,
  "survey-completed": renderSurveyCompleted,
  "redemption-submitted": renderRedemptionSubmitted,
  "payout-processing": renderPayoutProcessing,
  "payout-completed": renderPayoutCompleted,
  "payout-rejected": renderPayoutRejected,
  "account-deleted": renderAccountDeleted,
  "staff-welcome": renderStaffWelcome,
  "staff-password-reset": renderStaffPasswordResetEmail,
  "support-request-received": renderSupportRequestReceived,
  "support-inbox-notification": renderSupportInboxNotification,
};

export function isEmailTemplateId(value: string): value is EmailTemplateId {
  return value in RENDERERS;
}

export function getEmailTemplateMeta(id: EmailTemplateId): EmailTemplateMeta | undefined {
  return EMAIL_TEMPLATES.find((template) => template.id === id);
}

export function renderEmailTemplate(
  id: EmailTemplateId,
  data: Record<string, string> = {}
): RenderedEmail {
  const merged = { ...EMAIL_TEMPLATE_SAMPLE_DATA[id], ...data };
  return RENDERERS[id](merged);
}

export function listEmailTemplatesByCategory(): Array<{
  category: EmailTemplateCategory;
  label: string;
  templates: EmailTemplateMeta[];
}> {
  return (Object.keys(EMAIL_TEMPLATE_CATEGORIES) as EmailTemplateCategory[]).map((category) => ({
    category,
    label: EMAIL_TEMPLATE_CATEGORIES[category],
    templates: EMAIL_TEMPLATES.filter((template) => template.category === category),
  }));
}
