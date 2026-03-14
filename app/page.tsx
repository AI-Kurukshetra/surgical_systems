import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/src/lib/supabaseServer";
import { LandingPage } from "@/components/landing/landing-page";

export default async function HomePage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
