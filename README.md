# SmartOR

SmartOR is an **Intelligent Surgical Operations Management Platform** for hospitals.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Shadcn-style UI components
- TanStack Query + Zustand
- Recharts analytics + @dnd-kit scheduling drag/drop
- Supabase (Auth, Postgres, Realtime, Storage, RLS)

## Folder Structure

```txt
app/
components/
hooks/
lib/
services/
supabase/
types/
utils/
```

## MVP Features Included

- Authentication pages (`/login`) with Supabase Auth integration
- Role-aware middleware route protection
- Hospital/OR domain schema with full SQL migration
- OR real-time dashboard scaffolding
- Drag-and-drop surgery scheduler board
- Staff management + assignment UI scaffold
- Equipment tracking + selector
- Patient table + pre-op/lab status display
- Analytics dashboard with utilization metrics chart
- API routes:
  - `/api/auth`
  - `/api/users`
  - `/api/patients`
  - `/api/surgeries`
  - `/api/schedules`
  - `/api/staff`
  - `/api/equipment`
  - `/api/notifications`
  - `/api/analytics`

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Project Setup

1. Create a Supabase project.
2. Enable Email auth in **Authentication > Providers**.
3. Run migration SQL in **SQL Editor**:
   - `supabase/migrations/20260314123000_init_smartor.sql`
4. Run seed SQL:
   - `supabase/seed.sql`
5. In **Database > Replication**, ensure these tables are included for realtime:
   - `surgeries`, `operating_rooms`, `staff_assignments`, `notifications`
6. Verify storage bucket exists:
   - `surgical-documents`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## RLS + RBAC Notes

- All domain tables have RLS enabled.
- Policies are hospital-scoped via `user_hospital_id()`.
- Admin and Scheduler roles have broader access.
- Route middleware protects UI pages; RLS remains the source of truth for data access.

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variables from `.env.example`.
4. Deploy.
5. Confirm Supabase URL and keys are set per environment.

## Next Build Steps

1. Replace placeholder UI data with live queries from API routes.
2. Add optimistic updates and conflict resolution workflow in scheduler.
3. Add robust auth cookie/session handling with SSR-safe Supabase helper pattern.
4. Add e2e tests for scheduling conflict detection and role access checks.
