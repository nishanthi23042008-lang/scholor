# ScholarShield

**Discover Opportunities. Verify Scholarships. Protect Your Future.**

ScholarShield is a full-stack Indian scholarship discovery, multi-source verification, and student cybersecurity protection platform.

## Architecture Summary

- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`Plus Jakarta Sans`, `DM Sans`, `JetBrains Mono`).
- **Backend**: Express + TypeScript (`server.ts`, `src/routes/api.ts`), strict server-side SSRF-protected URL scanner, deterministic rule-based eligibility engine, and grounded Gemini AI assistant (`@google/genai`, `gemini-4-hydrogen`).
- **Database**: PostgreSQL with Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`). Provisioned in AI Studio via Cloud SQL for PostgreSQL, with a complete Supabase PostgreSQL + Row Level Security (RLS) schema exported at `supabase/schema.sql`.
- **Authentication & RBAC**: Firebase Authentication (`signInWithPopup` Google OAuth + Email/Password/Reset/Verification) verified server-side via `firebase-admin` and mapped to PostgreSQL `profiles.role` (`student` vs `admin`).

---

## 1. Database Schema & Supabase Configuration

The 12 relational tables are defined in `src/db/schema.ts` (Drizzle ORM) and `supabase/schema.sql` (raw PostgreSQL + Supabase RLS policies):

- `profiles`, `scholarships`, `scholarship_sources`, `eligibility_criteria`, `scholarship_documents`, `saved_scholarships`, `applications`, `notifications`, `security_scans`, `scam_reports`, `verification_history`, `admin_audit_logs`.

### Using Supabase PostgreSQL (External Hosting)
1. Create a new Supabase project and open **SQL Editor**.
2. Execute `supabase/schema.sql` to create all 12 tables, foreign keys, `is_admin()` helper, and Row Level Security policies.
3. Configure **Authentication -> Providers** (Google & Email) and set your Site URL and Redirect URLs.
4. Set `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, and `SQL_PASSWORD` (from Supabase Connection Pooler settings) in your server runtime environment.

---

## 2. Environment Variables (`.env.example`)

Configure secrets in your hosting / AI Studio Secrets panel (never commit secrets or expose keys to client bundles):

- `GEMINI_API_KEY`: Required for server-side Gemini AI explanations (`/api/ai/explain`).
- `GOOGLE_SAFE_BROWSING_API_KEY`: Optional Google Safe Browsing API v4 key for threat intelligence lookups inside `/api/scanner/analyze`.
- `VIRUSTOTAL_API_KEY`: Optional VirusTotal API v3 key (subject to VirusTotal terms; only submitted URLs are queried, never private student data).
- `RESEND_API_KEY` & `EMAIL_FROM`: Optional transactional email configuration for opt-in deadline/status notifications.
- `ADMIN_EMAILS`: Optional comma-separated list of emails granted administrator role upon sign-in.

---

## 3. API Integration Details

- **Google Safe Browsing (`src/services/urlScanner.ts`)**: Server-side POST to `safebrowsing.googleapis.com/v4/threatMatches:find`. If `GOOGLE_SAFE_BROWSING_API_KEY` is absent, the scanner transparently reports `"Not Configured"` and completes structural/SSRF-safe checks without faking threat results.
- **VirusTotal (`src/services/urlScanner.ts`)**: Server-side lookup against `virustotal.com/api/v3/urls/{urlId}` using `x-apikey` header.
- **Gemini API (`src/services/gemini.ts`)**: Server-side `@google/genai` client with `gemini-4-hydrogen` and strict grounding instructions preventing fabrication of deadlines, links, or verification decisions.

---

## 4. Deployment Instructions

```bash
npm install
npm run build
npm run start
```

The Express server listens on `0.0.0.0:3000`, serves API routes at `/api/*`, and serves the built Vite SPA from `dist/` when `NODE_ENV=production`.

---

## 5. Testing Instructions

1. **Type Checking & Build Verification**:
   - `npm run lint` (`tsc --noEmit`)
   - `npm run build` (`vite build`)
2. **Scholarship Discovery & Eligibility**:
   - Open **Discover**, filter by state/income/percentage, click **View Details**, and test the **Eligibility Calculator** with different percentages/states to confirm deterministic `Eligible`, `Potentially Eligible`, `Additional Information Required`, and `Not Eligible` states.
3. **Cybersecurity URL Scanner**:
   - Open **URL Scanner**, test `https://scholarships.gov.in` (returns `GREEN`) and `http://scholarships-gov-in.example.xyz/claim-fee` (returns `RED` with brand impersonation & phishing keyword reasons). Verify private IPs like `http://127.0.0.1` are blocked by SSRF validation.
4. **Authentication, Dashboard & Admin RBAC**:
   - Sign in via Google or Email/Password, update your Student Profile (confirm Aadhaar/bank fields are absent and consent is enforced), bookmark schemes, track applications, and submit a scam report.
   - Sign in with an `admin` role account to verify scholarship CRUD, verification audit logs, and scam report investigation on **Admin**.
