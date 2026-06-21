import { BRAND } from "@/lib/brand";

export interface BrandedEmailCta {
  label: string;
  href: string;
}

export interface BrandedEmailOptions {
  preheader?: string;
  title: string;
  bodyHtml: string;
  cta?: BrandedEmailCta;
  footerNote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(text)}</p>`;
}

export function mutedParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#71717a;">${escapeHtml(text)}</p>`;
}

export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#71717a;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

export function detailTable(rows: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;">${rows}</table>`;
}

export function buildBrandedEmailHtml(options: BrandedEmailOptions): string {
  const preheader = options.preheader ?? options.title;
  const ctaBlock = options.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
        <tr>
          <td style="border-radius:12px;background:${BRAND.teal[700]};">
            <a href="${escapeHtml(options.cta.href)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(options.cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const footerNote = options.footerNote
    ? mutedParagraph(options.footerNote)
    : mutedParagraph("Belize Research Panel · Confidential panel communications");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.teal[800]} 0%,${BRAND.teal[950]} 100%);padding:28px 32px;">
              <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#99f6e4;">Belize Research Panel</div>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;">${escapeHtml(options.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${options.bodyHtml}
              ${ctaBlock}
              ${footerNote}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#a1a1aa;max-width:560px;">
          You received this message because you are registered with the Belize Research Panel.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
