const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g;
const ASSIGNED_SECRET_RE =
  /\b(password|passwd|token|secret|api[_-]?key|authorization|cookie|session|bearer|salt|hash)\b\s*[:=]\s*\S+/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const KEY_RE = /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b|\bsb_secret_[A-Za-z0-9_-]{8,}\b/gi;

/** Strip addresses, phones, and credential-shaped text before anything is written to logs. */
export function redactSensitiveText(value: string): string {
  return value
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[phone]")
    .replace(ASSIGNED_SECRET_RE, "$1=[redacted]")
    .replace(JWT_RE, "[token]")
    .replace(KEY_RE, "[secret]")
    .slice(0, 500);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

/** Log a failure without the raw error object, which can carry emails, tokens, or request data. */
export function logServerError(context: string, error?: unknown): void {
  const safeContext = redactSensitiveText(context) || "Server error";
  const message = redactSensitiveText(errorMessage(error));
  if (message) console.error(safeContext, message);
  else console.error(safeContext);
}
