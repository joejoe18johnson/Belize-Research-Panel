import { Suspense } from "react";
import CheckEmailClient from "./CheckEmailClient";

export const metadata = {
  title: "Verify your email | Belize Research Panel",
};

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-zinc-500">Loading…</p>}>
      <CheckEmailClient />
    </Suspense>
  );
}
