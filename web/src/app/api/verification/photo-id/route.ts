import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { replaceDeniedPhotoId } from "@/lib/panelists";

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ message: "You must be logged in." }, { status: 401 });
  }
  if (!session.panelistRegistered) {
    return NextResponse.json({ message: "Complete panelist registration first." }, { status: 403 });
  }

  const formData = await request.formData();
  const photoIdType = String(formData.get("photoIdType") ?? "");
  const uploaded = formData.get("photoIdFile");
  const file = uploaded instanceof File ? uploaded : null;
  if (!file) {
    return NextResponse.json({ message: "Upload a PNG, JPG, or PDF." }, { status: 400 });
  }

  const result = await replaceDeniedPhotoId(session.email, { photoIdType, file });
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/admin/panelists");
  revalidatePath("/admin/under-review");

  return NextResponse.json({
    ok: true,
    message: "Your new photo ID was submitted. Our team will review it.",
  });
}
