import { createClient } from "@supabase/supabase-js";
import { AdminInitializationError, initializeAdmin } from "../src/lib/adminInitialization";

const DEFAULT_ADMIN_EMAIL = "admin@smartor.com";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Admin seeder can only run in development (set NODE_ENV=development).");
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const result = await initializeAdmin(supabase, {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      name: "SmartOR Admin",
    });

    console.log("Admin seed completed.");
    console.log(`auth.users id: ${result.userId}`);
    console.log(`email: ${result.email}`);
    console.log("role: admin");
    console.log(`public.users write mode: ${result.usersWriteMode}`);
    console.log(`profiles synced: ${result.profilesSynced}`);
  } catch (error) {
    if (error instanceof AdminInitializationError && error.code === "ADMIN_ALREADY_INITIALIZED") {
      console.log("Admin already initialized");
      return;
    }

    throw error;
  }
}

main().catch((error) => {
  console.error("[seed/admin] failed:", (error as Error).message);
  process.exit(1);
});
