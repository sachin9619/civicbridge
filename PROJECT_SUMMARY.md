# CivicBridge — Complete Architecture & Developer Handoff Guide

> **Tagline:** One City. One Platform. Accountable Action.  
> **Repository Target:** `civicbridge` (Next.js 16.4.3 App Router, TypeScript, Tailwind CSS 4, Supabase)  
> **Status:** Production-ready MVP built, tested, and actively running on port 3000.

---

## 1. System Overview & Core Mission
CivicBridge is an integrated civic grievance management platform connecting **citizens**, **municipal administrators**, and **field workers** into a single transparent workflow:

1. **Citizen reports issue** with instant live camera snap/upload, auto-reverse geocoded GPS coordinates, and category tags.
2. **Deterministic Auto-Router** maps category to responsible department (Sanitation, Public Works, Electrical, etc.) and coordinates to ward.
3. **Admin assigns** grievance to specific field employees with priority & SLA deadlines.
4. **Field Worker starts work** (`IN_PROGRESS`), completes physical repair, uploads completion evidence photo + work notes, and submits for verification.
5. **Admin approves or rejects** work with audit feedback.
6. **Citizen follows progress** via a real-time live timeline that updates automatically without refreshing the browser.

---

## 2. Tech Stack Reference
- **Framework:** Next.js 16.4.3 (App Router, Turbopack, React 19.3)
- **Styling:** Tailwind CSS 4 (`@tailwindcss/postcss`, `postcss.config.mjs`)
- **Icons:** Lucide React (`lucide-react`)
- **Backend / DB:** Supabase PostgreSQL + Supabase Auth + Supabase Storage + Realtime Subscriptions
- **Forms & Validation:** React Hook Form + Zod v4 schemas (`@hookform/resolvers/zod`)
- **Maps:** Leaflet & OpenStreetMap (`react-leaflet`, dynamically imported client-side)
- **PWA:** Installable standalone PWA (`manifest.json`, `sw.js` precache & network-first)

---

## 3. The 3 Specialized Portals & Routes

### A. Citizen Portal (Mobile-First PWA) — Prefix: `/dashboard`
- `/` — High-converting public landing page explaining grievance process.
- `/dashboard` — Citizen overview: Active complaints count, resolved stats, recent grievances. Auto-redirects admins to `/admin` and workers to `/employee`.
- `/dashboard/report` — **Grievance reporting form**:
  - Live Camera Modal (`LiveCameraModal` via WebRTC/canvas capture) with flip front/rear camera.
  - GPS Geolocation with OpenStreetMap Nominatim reverse geocoding.
  - Deterministic auto-department preselection.
  - Confidentiality shielding for `WOMEN_SAFETY` issues.
- `/dashboard/complaints` — Filterable complaint feed with search & status tags.
- `/dashboard/complaints/[id]` — **Live timeline view**: Subscribed to Supabase Realtime channel (`complaint_channel_${id}_${timestamp}`). Auto-updates on status/evidence changes.
- `/dashboard/profile` — Name update, profile settings.

### B. Admin Command Center — Prefix: `/admin`
- `/admin` — High-density KPI dashboard (Total, Awaiting Review, In Progress, Pending Verification, Resolved, Category breakdown).
- `/admin/complaints` — Master complaint table with search, category filters, and priority tags.
- `/admin/complaints/[id]` — Full inspection view:
  - **Assignment Dialog**: Select department, employee, deadline, assignment notes.
  - **Resolution Verification**: Review completion evidence photos, approve or reject with comments.
  - **Status Transitions**: State machine buttons (`ASSIGNED`, `IN_PROGRESS`, `PENDING_VERIFICATION`, `RESOLVED`, `REJECTED`).
- `/admin/map` — **Interactive Incident Heatmap** powered by Leaflet:
  - Live coordinates plotted as pins with click-to-inspect popups.
  - **Privacy Guard**: Automatically hides exact locations for sensitive Women's Safety complaints.
- `/admin/assignments` — Master active assignment matrix.
- `/admin/departments` — Municipal department directory.
- `/admin/employees` — Field staff roster.
- `/admin/analytics` — SLA resolution charts and workload distribution.
- `/admin/audit` — Immutable timestamped audit log of all administrative actions.

### C. Field Employee Portal — Prefix: `/employee`
- `/employee` — Task queue for logged-in field worker (Active, Pending Review, Total).
- `/employee/task/[id]` — Field task interface:
  - Task specs, before-photos, deadline indicator.
  - Rejection feedback alerts from admin.
  - **"Start Work"** trigger (transitions status to `IN_PROGRESS`).
  - **"Submit Resolution"** form with after-photos and resolution notes.
- `/employee/completed` — Work history log.
- `/employee/profile` — Field worker account profile.

---

## 4. Database Schema & Supabase Setup

### Database Tables:
- `profiles` — Linked to Supabase Auth (`id`, `full_name`, `role: citizen|admin|employee`, `department_id`, `ward_id`).
- `departments` — 6 seeded departments (Sanitation, Roads, Electrical, Water, Drainage, Safety Cell).
- `wards` — 5 city wards with spatial labels (Central, North, South, East, West).
- `complaints` — Core grievance entity (`tracking_id`, `category`, `status`, `priority`, `reporter_id`, `department_id`, `ward_id`, `assigned_employee_id`, `latitude`, `longitude`, `photo_urls`, `is_sensitive`, `deadline`).
- `status_history` — Immutable state transitions (`old_status`, `new_status`, `changed_by`, `notes`).
- `assignments` — Employee assignment logs.
- `resolution_evidence` — Proof of work (`photo_urls`, `notes`, `is_approved`, `reviewer_id`, `review_notes`).
- `audit_logs` — Administrative security actions.

### Storage Buckets:
- `complaint-photos` (Public enabled for complaint image previews)
- `resolution-photos` (Public enabled for completion proof)

---

## 5. Directory Structure Quick Reference

```text
src/
├── app/
│   ├── (auth)/             # login, register, forgot-password, reset-password
│   ├── admin/              # Admin dashboard, map, complaints, analytics, audit
│   ├── dashboard/          # Citizen PWA portal & complaint report form
│   ├── employee/           # Field worker task queue & evidence submission
│   └── proxy.ts            # Next.js 16 edge route protection & role redirection
├── components/
│   ├── layouts/            # Responsive dashboard shell & role-aware sidebar
│   ├── map/                # Dynamic Leaflet OpenStreetMap wrapper
│   ├── providers/          # Supabase AuthProvider & session state
│   └── ui/                 # Design system (LiveCameraModal, Button, Input, Card, Badge, etc.)
├── lib/
│   ├── supabase/           # Browser, server, and middleware Supabase SSR clients
│   ├── utils.ts            # Formatting, tracking ID generator, category/ward routing
│   └── validations.ts      # Shared Zod v4 schemas
└── types/                  # Strict TypeScript interfaces
```

---

## 6. How Your Teammates Can Set Up in 2 Minutes

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies
npm install

# 3. Create .env.local with these credentials
NEXT_PUBLIC_SUPABASE_URL=https://xpxhvfyiqnbanvadsael.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweGh2ZnlpcW5iYW52YWRzYWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODA4MjIsImV4cCI6MjEwODY1NjgyMn0.Sb0O7w3PTpbqKg2Eie9dYg0_LopS8Ry5j60Kcu-GD2k
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. Start local server
npm run dev
```

---

## 7. Recommended Next Features for Parallel Teammate Work

Now that the core loop is functional, each teammate can pick one of these high-impact features:

1. **Teammate A (Citizen Experience & Offline Queue)**:
   - Add IndexedDB offline sync via Workbox/idb in `src/app/dashboard/report/page.tsx` so citizens can snap photos offline and auto-sync when connection restores.
   - Add citizen feedback/star rating after resolution approval.

2. **Teammate B (Admin Analytics & CSV Export)**:
   - Upgrade `/admin/analytics` with Recharts components (Average SLA resolution times, ward incident bar graphs).
   - Add a "Export to CSV / PDF" button in `/admin/complaints` for municipal reports.

3. **Teammate C (Push & In-App Notifications)**:
   - Build a real-time Notification Bell dropdown in `src/components/layouts/dashboard-layout.tsx` fetching from the `notifications` table on status changes.
   - Sound or vibration trigger on field worker portal when a new task is assigned.
