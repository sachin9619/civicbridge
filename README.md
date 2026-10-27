# CivicBridge

**One City. One Platform. Accountable Action.**

A full-stack civic grievance management platform connecting citizens, government administrators, and field employees through one accountable system.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom design system with CVA variants
- **Icons:** Lucide React
- **Auth:** Supabase Auth (email/password, email verification, password reset)
- **Database:** Supabase PostgreSQL with RLS
- **Storage:** Supabase Storage (complaint & resolution photos)
- **Forms:** React Hook Form + Zod v4 validation
- **PWA:** Web App Manifest + Service Worker

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone and Install

```bash
git clone <repo-url>
cd civicbridge
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase Database

Run the SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — Tables, indexes, triggers
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security
3. `supabase/migrations/003_seed_data.sql` — Demo departments & wards
4. `supabase/migrations/004_storage.sql` — Storage buckets & policies

### 4. Configure Supabase Auth

In the Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** Add:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://your-domain.vercel.app/auth/callback` (production)
  - `https://your-domain.vercel.app/reset-password` (production)

### 5. Create Admin & Employee Accounts

**Admin account:** Create a user in Supabase Auth → Users, then update their profile role:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

**Employee accounts:** Create users, then set their role and department:

```sql
UPDATE profiles
SET role = 'employee',
    department_id = 'd1000000-0000-0000-0000-000000000001'
WHERE email = 'employee@example.com';
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Forgot/Reset Password
│   ├── admin/           # Admin dashboard, complaints, assignments, analytics
│   ├── dashboard/       # Citizen portal: report, track complaints, profile
│   ├── employee/        # Employee tasks, resolution submission, profile
│   └── auth/callback/   # Auth callback handler
├── components/
│   ├── layouts/         # Dashboard shell with responsive sidebar
│   ├── providers/       # Auth context provider
│   └── ui/              # Design system components
├── lib/
│   ├── supabase/        # Client, server, middleware helpers
│   ├── constants.ts     # App constants
│   ├── utils.ts         # Utility functions
│   └── validations.ts   # Zod schemas
├── types/               # TypeScript interfaces
└── proxy.ts             # Auth-aware routing proxy
supabase/
└── migrations/          # SQL migrations (schema, RLS, seed, storage)
public/
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
└── icons/               # App icons
```

## Three Portals

| Portal | URL | Role | Purpose |
|--------|-----|------|---------|
| Citizen | `/dashboard` | `citizen` | Report issues, track complaints |
| Admin | `/admin` | `admin` | Manage complaints, assign work, verify resolutions |
| Employee | `/employee` | `employee` | View tasks, submit resolution evidence |

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables in Vercel project settings
4. Deploy

## Team Ownership

- **Developer 1:** Citizen PWA, complaint reporting (`/dashboard/*`)
- **Developer 2:** Admin dashboard, management (`/admin/*`)
- **Developer 3:** Supabase, security, employee portal (`/employee/*`, `supabase/*`)

## Disclaimer

This is a demonstration platform for a hackathon. For real emergencies, contact local emergency services (112). This platform does not replace police services or emergency hotlines.
