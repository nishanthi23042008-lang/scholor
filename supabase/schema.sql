-- ScholarShield Reference PostgreSQL + Supabase Row Level Security (RLS) Schema
-- Covers all 12 core relational tables with private student record isolation and admin RBAC.

create extension if not exists "pgcrypto";

-- 1. profiles
create table if not exists public.profiles (
  id serial primary key,
  uid text not null unique,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  full_name text default '',
  phone text default '',
  state text default '',
  district text default '',
  education_level text default '',
  institution text default 'Rajeev Institute of Technology',
  course text default 'Computer Science',
  gdg_url text default 'https://gdg.community.dev',
  academic_year text default '',
  previous_percentage numeric(5, 2),
  family_income_range text default '',
  category text default '',
  preferences jsonb default '[]'::jsonb,
  consent_accepted boolean not null default false,
  email_reminders boolean not null default false,
  deadline_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. scholarships
create table if not exists public.scholarships (
  id serial primary key,
  slug text not null unique,
  title text not null,
  provider text not null,
  provider_type text not null,
  amount_text text not null,
  amount_numeric integer not null default 0,
  education_level text not null,
  course_stream text not null,
  state_scope text not null,
  max_income_inr integer,
  min_percentage numeric(5, 2),
  category_eligibility text not null default 'All Categories',
  deadline_date text not null,
  official_url text not null,
  application_url text not null,
  description text not null,
  summary text not null,
  verification_status text not null default 'NEEDS_REVIEW' check (verification_status in ('VERIFIED', 'NEEDS_REVIEW', 'SUSPICIOUS')),
  verification_reason text not null,
  verification_evidence text not null,
  last_checked_at timestamptz not null default now(),
  is_archived boolean not null default false,
  is_sample boolean not null default false,
  created_by_uid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. scholarship_sources
create table if not exists public.scholarship_sources (
  id serial primary key,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  source_type text not null,
  credibility_note text not null,
  checked_at timestamptz not null default now()
);

-- 4. eligibility_criteria
create table if not exists public.eligibility_criteria (
  id serial primary key,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  criterion_key text not null,
  label text not null,
  operator text not null,
  expected_value text not null,
  is_mandatory boolean not null default true,
  description text not null
);

-- 5. scholarship_documents
create table if not exists public.scholarship_documents (
  id serial primary key,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  document_name text not null,
  purpose_reason text not null,
  is_mandatory boolean not null default true,
  format_hint text default 'PDF / Official Copy'
);

-- 6. saved_scholarships
create table if not exists public.saved_scholarships (
  id serial primary key,
  user_uid text not null references public.profiles(uid) on delete cascade,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_uid, scholarship_id)
);

-- 7. applications
create table if not exists public.applications (
  id serial primary key,
  user_uid text not null references public.profiles(uid) on delete cascade,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  status text not null default 'Not Applied',
  application_ref text default '',
  personal_notes text default '',
  history jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_uid, scholarship_id)
);

-- 8. notifications
create table if not exists public.notifications (
  id serial primary key,
  user_uid text not null references public.profiles(uid) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link_target text default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. security_scans
create table if not exists public.security_scans (
  id serial primary key,
  user_uid text,
  target_url text not null,
  normalized_host text not null,
  verdict text not null check (verdict in ('GREEN', 'YELLOW', 'RED')),
  reasons jsonb not null default '[]'::jsonb,
  heuristic_findings jsonb not null default '[]'::jsonb,
  safe_browsing_status text not null,
  virus_total_status text not null,
  redirect_chain jsonb not null default '[]'::jsonb,
  https_available boolean not null default false,
  limitations_note text not null,
  scanned_at timestamptz not null default now()
);

-- 10. scam_reports
create table if not exists public.scam_reports (
  id serial primary key,
  reporter_uid text,
  reporter_email text default '',
  scholarship_id integer references public.scholarships(id) on delete set null,
  reported_title text not null,
  suspicious_url text default '',
  category text not null,
  description text not null,
  status text not null default 'Pending Review',
  admin_notes text default '',
  reviewed_by_uid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. verification_history
create table if not exists public.verification_history (
  id serial primary key,
  scholarship_id integer not null references public.scholarships(id) on delete cascade,
  previous_status text not null,
  new_status text not null,
  reason text not null,
  evidence text not null,
  actor_uid text not null,
  actor_email text not null,
  created_at timestamptz not null default now()
);

-- 12. admin_audit_logs
create table if not exists public.admin_audit_logs (
  id serial primary key,
  actor_uid text not null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE DEPLOYMENT
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_sources enable row level security;
alter table public.eligibility_criteria enable row level security;
alter table public.scholarship_documents enable row level security;
alter table public.saved_scholarships enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;
alter table public.security_scans enable row level security;
alter table public.scam_reports enable row level security;
alter table public.verification_history enable row level security;
alter table public.admin_audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where uid = auth.uid()::text and role = 'admin'
  );
$$;

-- Profiles: own profile only (or admin read)
create policy "profiles_select_own" on public.profiles
  for select using (uid = auth.uid()::text or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (uid = auth.uid()::text);
create policy "profiles_update_own" on public.profiles
  for update using (uid = auth.uid()::text);

-- Public read for curated scholarship directory & child metadata; admin write only
create policy "scholarships_public_read" on public.scholarships
  for select using (is_archived = false or public.is_admin());
create policy "scholarships_admin_write" on public.scholarships
  for all using (public.is_admin()) with check (public.is_admin());

create policy "sources_public_read" on public.scholarship_sources for select using (true);
create policy "sources_admin_write" on public.scholarship_sources for all using (public.is_admin());

create policy "criteria_public_read" on public.eligibility_criteria for select using (true);
create policy "criteria_admin_write" on public.eligibility_criteria for all using (public.is_admin());

create policy "docs_public_read" on public.scholarship_documents for select using (true);
create policy "docs_admin_write" on public.scholarship_documents for all using (public.is_admin());

-- Saved scholarships, applications, notifications: private to student UID
create policy "saved_own_all" on public.saved_scholarships
  for all using (user_uid = auth.uid()::text) with check (user_uid = auth.uid()::text);

create policy "applications_own_all" on public.applications
  for all using (user_uid = auth.uid()::text) with check (user_uid = auth.uid()::text);

create policy "notifications_own_read_update" on public.notifications
  for select using (user_uid = auth.uid()::text);
create policy "notifications_own_update" on public.notifications
  for update using (user_uid = auth.uid()::text);

-- Security scans: users can read their own scans
create policy "scans_own_read" on public.security_scans
  for select using (user_uid = auth.uid()::text or public.is_admin());

-- Scam reports: insert allowed; read restricted to reporter or admin
create policy "scam_reports_insert" on public.scam_reports
  for insert with check (true);
create policy "scam_reports_read_own_or_admin" on public.scam_reports
  for select using (reporter_uid = auth.uid()::text or public.is_admin());
create policy "scam_reports_admin_update" on public.scam_reports
  for update using (public.is_admin());

-- Verification history & audit logs: admin write; verification history public read
create policy "verification_history_read" on public.verification_history for select using (true);
create policy "verification_history_admin_write" on public.verification_history for all using (public.is_admin());
create policy "admin_audit_logs_admin_only" on public.admin_audit_logs for all using (public.is_admin());
