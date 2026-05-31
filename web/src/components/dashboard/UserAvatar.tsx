function avatarInitial(firstName: string, email: string): string {
  const fromName = firstName.trim().charAt(0);
  if (fromName) return fromName.toUpperCase();
  const fromEmail = email.trim().charAt(0);
  return fromEmail ? fromEmail.toUpperCase() : "?";
}

export function UserAvatar({
  firstName,
  email,
  size = "md",
}: {
  firstName: string;
  email: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = avatarInitial(firstName, email);
  const sizeClass =
    size === "lg"
      ? "h-14 w-14 text-lg ring-4 ring-white/20"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : "h-9 w-9 text-sm ring-2 ring-teal-100";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-teal-600 font-semibold text-white ${sizeClass}`}
      title={firstName.trim() || email}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
