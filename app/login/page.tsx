import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";

type Props = { searchParams: Promise<{ reset?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;
  return <LoginForm resetSuccess={params.reset === "success"} errorMessage={errorMessage} />;
}
