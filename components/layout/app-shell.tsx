"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, Building2, CalendarClock, ChartColumnBig, Settings, Stethoscope, Users, Wrench } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/or-dashboard", label: "OR Board", icon: Stethoscope },
  { href: "/surgeries", label: "Surgeries", icon: CalendarClock },
  { href: "/case-requests", label: "Case Requests", icon: CalendarClock },
  { href: "/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/surgeons", label: "Surgeons", icon: Users },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/equipment", label: "Equipment", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: ChartColumnBig },
];

const adminLinks = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/settings", label: "Operation room", icon: Settings },
];

const links = [...primaryLinks, ...adminLinks];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = links.find((link) => pathname.startsWith(link.href));

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[220px_1fr] md:p-6">
        <aside className="rounded-xl border bg-white/80 p-3 backdrop-blur">
          <h2 className="mb-3 px-2 text-lg font-semibold">SmartOR</h2>
          <nav className="space-y-3">
            <div className="space-y-1">
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                      pathname === link.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 pl-5 text-sm",
                      pathname === link.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border bg-white/80 px-4 py-3 backdrop-blur">
            <h1 className="text-base font-semibold">{current?.label ?? "SmartOR"}</h1>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
                Logout
              </Button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
