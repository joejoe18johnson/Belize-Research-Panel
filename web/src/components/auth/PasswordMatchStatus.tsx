"use client";

import { passwordsMatch } from "@/lib/signup-validation";

export function PasswordMatchStatus({
  password,
  confirmPassword,
  show,
}: {
  password: string;
  confirmPassword: string;
  show: boolean;
}) {
  if (!show || !passwordsMatch(password, confirmPassword)) return null;

  return (
    <p className="mt-1.5 text-sm text-green-600" role="status">
      Passwords match.
    </p>
  );
}
