import type { EmailTemplateId } from "./email-templates";
import { renderEmailTemplate } from "./email-templates";
import { sendTransactionalEmail } from "./send-transactional-email";

export async function sendTemplateEmail(input: {
  templateId: EmailTemplateId;
  to: string;
  data?: Record<string, string>;
  context?: string;
}): Promise<{ sent: boolean; logged: boolean }> {
  const rendered = renderEmailTemplate(input.templateId, input.data ?? {});
  const result = await sendTransactionalEmail({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    context: input.context ?? input.templateId,
  });
  return { sent: result.sent, logged: result.logged };
}

function panelistFirstName(firstName?: string): string {
  return firstName?.trim() || "there";
}

function originDashboard(origin: string, path = "/dashboard"): string {
  return `${origin.replace(/\/$/, "")}${path}`;
}

export async function sendSignupVerifyEmail(input: {
  to: string;
  firstName: string;
  verifyUrl: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "signup-verify-email",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      verifyUrl: input.verifyUrl,
    },
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  firstName: string;
  resetUrl: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "password-reset",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      resetUrl: input.resetUrl,
    },
  });
}

export async function sendRegistrationSubmittedEmail(input: {
  to: string;
  firstName: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "registration-submitted",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      dashboardUrl: originDashboard(input.origin),
    },
  });
}

export async function sendPanelistVerifiedEmail(input: {
  to: string;
  firstName: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "panelist-verified",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      dashboardUrl: originDashboard(input.origin),
    },
  });
}

export async function sendPanelistOnHoldEmail(input: {
  to: string;
  firstName: string;
  reason: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "panelist-on-hold",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      reason: input.reason,
      dashboardUrl: originDashboard(input.origin, "/dashboard/account-on-hold"),
    },
  });
}

export async function sendEmailChangeRequestedEmail(input: {
  to: string;
  firstName: string;
  pendingEmail: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "email-change-requested",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      pendingEmail: input.pendingEmail,
      dashboardUrl: originDashboard(input.origin, "/dashboard/account-on-hold"),
    },
  });
}

export async function sendEmailChangeApprovedEmail(input: {
  to: string;
  firstName: string;
  newEmail: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "email-change-approved",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      newEmail: input.newEmail,
      dashboardUrl: originDashboard(input.origin, "/login"),
    },
  });
}

export async function sendPhoneChangeRequestedEmail(input: {
  to: string;
  firstName: string;
  pendingPhone: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "phone-change-requested",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      pendingPhone: input.pendingPhone,
      dashboardUrl: originDashboard(input.origin, "/dashboard/account-on-hold"),
    },
  });
}

export async function sendPhoneChangeApprovedEmail(input: {
  to: string;
  firstName: string;
  newPhone: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "phone-change-approved",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      newPhone: input.newPhone,
      dashboardUrl: originDashboard(input.origin),
    },
  });
}

export async function sendSurveyInvitationEmail(input: {
  to: string;
  firstName: string;
  campaignTitle: string;
  points: number;
  completeByDate: string;
  surveyLink: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "survey-invitation",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      campaignTitle: input.campaignTitle,
      points: String(input.points),
      completeByDate: input.completeByDate,
      surveyLink: input.surveyLink,
      dashboardUrl: originDashboard(input.origin, "/dashboard/surveys"),
    },
  });
}

export async function sendSurveyCompletedEmail(input: {
  to: string;
  firstName: string;
  campaignTitle: string;
  points: number;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "survey-completed",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      campaignTitle: input.campaignTitle,
      points: String(input.points),
      dashboardUrl: originDashboard(input.origin, "/dashboard/surveys"),
    },
  });
}

export async function sendRedemptionSubmittedEmail(input: {
  to: string;
  firstName: string;
  optionLabel: string;
  amount: string;
  referenceId: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "redemption-submitted",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      optionLabel: input.optionLabel,
      amount: input.amount,
      referenceId: input.referenceId,
      dashboardUrl: originDashboard(input.origin, "/dashboard/payouts"),
    },
  });
}

export async function sendPayoutStatusEmail(input: {
  to: string;
  firstName: string;
  optionLabel: string;
  amount: string;
  referenceId: string;
  origin: string;
  action: "start" | "complete" | "reject";
}): Promise<void> {
  const templateId =
    input.action === "start"
      ? "payout-processing"
      : input.action === "complete"
        ? "payout-completed"
        : "payout-rejected";

  await sendTemplateEmail({
    templateId,
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      optionLabel: input.optionLabel,
      amount: input.amount,
      referenceId: input.referenceId,
      dashboardUrl: originDashboard(input.origin, "/dashboard/payouts"),
    },
    context: `payout-${input.action}`,
  });
}

export async function sendAccountDeletedEmail(input: {
  to: string;
  firstName: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "account-deleted",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
    },
  });
}

export async function sendStaffWelcomeEmail(input: {
  to: string;
  firstName: string;
  roleLabel: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "staff-welcome",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      roleLabel: input.roleLabel,
      email: input.to,
      loginUrl: originDashboard(input.origin, "/admin/login"),
    },
  });
}

export async function sendStaffPasswordResetEmail(input: {
  to: string;
  firstName: string;
  resetUrl: string;
  origin: string;
}): Promise<void> {
  await sendTemplateEmail({
    templateId: "staff-password-reset",
    to: input.to,
    data: {
      firstName: panelistFirstName(input.firstName),
      resetUrl: input.resetUrl,
      loginUrl: originDashboard(input.origin, "/admin/login"),
    },
  });
}

function supportReferenceId(id: string): string {
  return `SUP-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export async function sendSupportContactEmails(input: {
  origin: string;
  record: {
    id: string;
    name: string;
    email: string;
    topicLabel: string;
    message: string;
  };
  supportInboxEmail: string;
}): Promise<void> {
  const referenceId = supportReferenceId(input.record.id);
  const messagePreview =
    input.record.message.length > 240 ? `${input.record.message.slice(0, 240)}…` : input.record.message;
  const firstName = input.record.name.split(" ")[0] ?? "there";

  await Promise.all([
    sendTemplateEmail({
      templateId: "support-request-received",
      to: input.record.email,
      data: {
        firstName: panelistFirstName(firstName),
        topicLabel: input.record.topicLabel,
        referenceId,
        helpUrl: originDashboard(input.origin, "/help"),
      },
      context: "support-request-received",
    }),
    sendTemplateEmail({
      templateId: "support-inbox-notification",
      to: input.supportInboxEmail,
      data: {
        name: input.record.name,
        email: input.record.email,
        topicLabel: input.record.topicLabel,
        referenceId,
        messagePreview,
        adminInboxUrl: originDashboard(input.origin, "/admin/support-inbox"),
      },
      context: "support-inbox-notification",
    }),
  ]);
}

export async function sendCampaignInvitationEmails(input: {
  origin: string;
  campaignTitle: string;
  points: number;
  completeByDate: string;
  assignments: Array<{ email: string; firstName: string; surveyLink: string }>;
}): Promise<void> {
  await Promise.all(
    input.assignments.map((assignment) =>
      sendSurveyInvitationEmail({
        to: assignment.email,
        firstName: assignment.firstName,
        campaignTitle: input.campaignTitle,
        points: input.points,
        completeByDate: input.completeByDate,
        surveyLink: assignment.surveyLink,
        origin: input.origin,
      })
    )
  );
}
