import { getSupabaseServerClient } from "@/src/lib/supabaseServer";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Reset link expired or invalid. Please request a new one.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm />
    </div>
  );
}
