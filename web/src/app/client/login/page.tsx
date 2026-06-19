import { Suspense } from "react";
import { ClientLoginForm } from "@/components/client/ClientLoginForm";

export const metadata = {
  title: "Client login | Belize Research Panel",
};

export default function ClientLoginPage() {
  return (
    <Suspense fallback={null}>
      <ClientLoginForm />
    </Suspense>
  );
}
