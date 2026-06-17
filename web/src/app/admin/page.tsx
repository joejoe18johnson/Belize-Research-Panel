import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/mvp-status");
}
