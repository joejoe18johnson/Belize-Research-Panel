"use client";

import { validUsername } from "@/lib/validation";

export type UsernameAvailability = "idle" | "checking" | "invalid" | "available" | "taken";

export function UsernameAvailabilityStatus({
  username,
  availability,
}: {
  username: string;
  availability: UsernameAvailability;
}) {
  if (!username) return null;

  if (availability === "invalid" || !validUsername(username)) {
    return (
      <p className="mt-1.5 text-sm text-amber-700" role="status">
        Use 4–20 letters, numbers, underscores, hyphens, or periods.
      </p>
    );
  }

  if (availability === "checking") {
    return (
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500" role="status">
        Checking availability…
      </p>
    );
  }

  if (availability === "available") {
    return (
      <p className="mt-1.5 text-sm font-medium text-emerald-700" role="status">
        Username is available.
      </p>
    );
  }

  if (availability === "taken") {
    return (
      <p className="mt-1.5 text-sm font-medium text-red-600" role="status">
        Username is taken. Please choose another.
      </p>
    );
  }

  return null;
}
