import { redirect } from "next/navigation";
import { STAFF_HOME_PATH } from "@/lib/staff-roles";

export default function AdminIndexPage() {
  redirect(STAFF_HOME_PATH);
}
