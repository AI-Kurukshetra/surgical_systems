import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Shield,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-cyan-50/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,hsl(173_80%_40%/0.08),transparent)]" />
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/40" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Nav */}
      <header className="relative z-10 border-b border-border/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">{APP_NAME}</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/login?signup=true">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-4 pb-24 pt-16 sm:px-6 sm:pt-24 md:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            Intelligent Surgical Operations
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-tight">
            Orchestrate your OR with{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
              clarity and control
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Real-time scheduling, live dashboards, and streamlined workflows for operating rooms. 
            SmartOR keeps your team in sync so surgery runs smoothly.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="min-w-[160px] text-base" asChild>
              <Link href="/login?signup=true">Get started</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-w-[160px] text-base" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: CalendarCheck,
              title: "Smart scheduling",
              description: "Drag-and-drop calendar, conflict detection, and role-based views.",
            },
            {
              icon: Zap,
              title: "Live operations",
              description: "Real-time OR status, delays, and alerts at a glance.",
            },
            {
              icon: Shield,
              title: "Secure & compliant",
              description: "Role-based access and audit trails for your facility.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-primary/20 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mx-auto mt-28 max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Get from setup to live scheduling in three simple steps.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Set up your facility",
                description:
                  "Add hospitals, operating rooms, equipment, and staff. Define roles and permissions so everyone sees only what they need.",
                icon: Building2,
              },
              {
                step: "2",
                title: "Schedule surgeries",
                description:
                  "Create case requests, assign surgeons and teams, and build your OR calendar. Conflict detection helps avoid double-booking and resource clashes.",
                icon: ClipboardList,
              },
              {
                step: "3",
                title: "Run the day live",
                description:
                  "Use the live dashboard to track room status, delays, and turnover. Keep admins, schedulers, and surgeons aligned in real time.",
                icon: LayoutDashboard,
              },
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mt-4 text-sm font-semibold text-primary">Step {step}</span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{description}</p>
                {step !== "3" && (
                  <ArrowRight className="absolute -right-4 top-7 hidden h-5 w-5 text-muted-foreground/50 sm:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto mt-28 max-w-4xl">
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm sm:grid-cols-3 sm:gap-8">
            {[
              { value: "Real-time", label: "Live OR status and delay alerts" },
              { value: "Role-based", label: "Views tailored to admins, schedulers & staff" },
              { value: "One place", label: "Schedules, cases, patients & analytics" },
            ].map(({ value, label }) => (
              <div key={value} className="text-center">
                <p className="text-2xl font-bold text-primary sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="mx-auto mt-28 max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for your entire team
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            SmartOR adapts to each role so everyone can focus on what matters.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                role: "Administrators",
                description: "Manage hospitals, users, roles, and facility-wide settings with full control and visibility.",
              },
              {
                icon: CalendarCheck,
                role: "Schedulers",
                description: "Build and adjust the OR calendar, handle case requests, and resolve conflicts quickly.",
              },
              {
                icon: Stethoscope,
                role: "Surgeons",
                description: "View your cases and schedule, stay updated on room status and timing changes.",
              },
              {
                icon: Users,
                role: "Staff",
                description: "Access assignments, equipment, and daily workflows in one place.",
              },
            ].map(({ icon: Icon, role, description }) => (
              <div
                key={role}
                className="rounded-2xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-primary/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{role}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* More features list */}
        <section className="mx-auto mt-28 max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything you need to run the OR
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            From case requests to analytics, SmartOR brings it together.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              "Operating room management and live status boards",
              "Surgery scheduling with drag-and-drop and conflict detection",
              "Case request workflow and approval tracking",
              "Patient and surgeon management",
              "Staff and equipment assignments",
              "Real-time notifications and delay alerts",
              "Analytics and utilization insights",
              "Secure, role-based access control",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-white/60 px-4 py-3 backdrop-blur-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Final CTA */}
        <section className="mx-auto mt-28 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to streamline your operating room?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join teams who use SmartOR to keep surgery on track. Get started in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="min-w-[160px] text-base" asChild>
              <Link href="/login?signup=true">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-w-[160px] text-base" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">{APP_NAME}</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Intelligent surgical operations management. Real-time scheduling, live dashboards, and workflows built for modern operating rooms.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login?signup=true">Sign up</Link>
              </Button>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
