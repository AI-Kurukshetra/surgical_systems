import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";

export default async function LoginPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
