import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Lock,
  Search,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  Mail,
} from 'lucide-react';
import { ActivePage } from './Navbar';

interface LandingPageProps {
  onNavigate: (page: ActivePage) => void;
  onQuickSearch: (query: string, state: string, level: string) => void;
  onOpenAuth: (mode?: 'student' | 'admin') => void;
}

const FAQS = [
  {
    q: 'How does ScholarShield verify whether a scholarship is genuine?',
    a: 'Every scholarship undergoes multi-point verification checks covering the provider identity, official .gov.in or institutional domain, published scheme circular, eligibility rules, benefits, and application link. Records are only marked VERIFIED when primary official sources are confirmed by an administrator. If any official detail is incomplete, the record stays marked NEEDS REVIEW.',
  },
  {
    q: 'Does ScholarShield guarantee that a scanned URL is 100% safe?',
    a: 'No automated scanner can guarantee complete website safety. ScholarShield combines structural typosquatting checks, HTTPS inspection, controlled redirect checks, Google Safe Browsing, and VirusTotal lookups to flag known threats and suspicious patterns, while clearly stating scan limitations and timestamps.',
  },
  {
    q: 'Do you ask for Aadhaar numbers, bank passwords, or sensitive documents?',
    a: 'Never. ScholarShield enforces strict data minimization. Your student profile only stores academic and eligibility details needed for rule-based matching. We never request Aadhaar numbers, bank credentials, or OTPs, and we do not upload sensitive personal documents by default.',
  },
  {
    q: 'How does the AI assistant work without inventing fake deadlines or links?',
    a: 'ScholarShield runs Gemini strictly on the server and grounds every explanation in the verified database record, deterministic rule-based eligibility output, or scan report. AI never decides verification status or fabricates scholarship URLs.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onQuickSearch,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState('All');
  const [searchLevel, setSearchLevel] = useState('All');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(searchQuery, searchState, searchLevel);
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="bg-[#0B162C] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                <div className="mb-5 inline-flex items-center gap-3 rounded-xl border border-slate-700/90 bg-[#0F1F3D] px-3.5 py-2.5">
                  <img
                    src="/assets/aistudio/image_8457735b.png"
                    alt="Rajeev Institute of Technology Logo"
                    className="h-11 w-11 rounded-lg bg-white object-contain p-1 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      Rajeev Institute of Technology
                    </p>
                    <p className="text-xs font-medium text-cyan-300">
                      Department of Computer Science
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold tracking-wider text-cyan-400">
                  INDIAN SCHOLARSHIP VERIFICATION &amp; CYBERSECURITY PLATFORM
                </p>
                <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:leading-[1.12]">
                  Discover Opportunities. Verify Scholarships. Protect Your Future.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Search curated Indian government and institutional scholarships, check deterministic eligibility rules transparently, and inspect unfamiliar scholarship links for phishing indicators before submitting personal details.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('discover')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0"
                  >
                    Explore Verified Scholarships
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('scanner')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Scan a Scholarship URL
                  </button>
                </div>
              </div>

              <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-400">
                <span>Primary source checks against official .gov.in &amp; institutional portals</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Zero Aadhaar or bank credentials collected</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 lg:h-full">
                <img
                  src="/src/assets/images/hero_scholarshield_1794979303023.jpg"
                  alt="Indian university students researching verified scholarships on laptops in an academic library"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B162C]/90 via-[#0B162C]/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200">
                  <p className="font-semibold text-white">Verified Official Directories</p>
                  <p className="mt-0.5 text-slate-300">
                    NSP, AICTE, DST INSPIRE, UGC, MahaDBT &amp; Karnataka SSP portals cross-checked before listing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-column verifiable metric strip */}
          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-slate-800 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-[#0F1F3D] p-4">
              <div className="font-mono text-2xl font-bold text-white tabular-nums">3-Tier</div>
              <div className="mt-1 text-xs font-medium text-cyan-300">Verification Status Engine</div>
              <p className="mt-1 text-xs text-slate-400">VERIFIED, NEEDS REVIEW, and SUSPICIOUS with primary source trails.</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0F1F3D] p-4">
              <div className="font-mono text-2xl font-bold text-white tabular-nums">100%</div>
              <div className="mt-1 text-xs font-medium text-cyan-300">Rule-Based Eligibility</div>
              <p className="mt-1 text-xs text-slate-400">Transparent criterion matching with zero black-box AI decisions.</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0F1F3D] p-4">
              <div className="font-mono text-2xl font-bold text-white tabular-nums">SSRF-Safe</div>
              <div className="mt-1 text-xs font-medium text-cyan-300">Backend URL Scanner</div>
              <p className="mt-1 text-xs text-slate-400">Domain typosquatting, redirect hops, Safe Browsing &amp; VirusTotal checks.</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0F1F3D] p-4">
              <div className="font-mono text-2xl font-bold text-white tabular-nums">0</div>
              <div className="mt-1 text-xs font-medium text-cyan-300">Sensitive IDs Collected</div>
              <p className="mt-1 text-xs text-slate-400">Never asks for Aadhaar numbers, bank passwords, or OTPs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK SEARCH SCHOLARSHIPS SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Search Verified Scholarships</h2>
              <p className="mt-1 text-sm text-slate-600">
                Filter Indian central, state, and institutional schemes by academic level and domicile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Open full discovery filters →
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <label htmlFor="landing-search" className="sr-only">
                Search scholarship name, provider, or course
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="landing-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AICTE, NSP, INSPIRE, Engineering..."
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="landing-level" className="sr-only">
                Education Level
              </label>
              <select
                id="landing-level"
                value={searchLevel}
                onChange={(e) => setSearchLevel(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="All">All Education Levels</option>
                <option value="Diploma">Diploma</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="landing-state" className="sr-only">
                State
              </label>
              <select
                id="landing-state"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="All">All India</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="North East">North East Region</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                Find Schemes
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. HOW SCHOLARSHIELD WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How ScholarShield Works</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            A structured workflow separating verified scholarship discovery, deterministic eligibility matching, and cybersecurity verification.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01. Build Academic Profile',
              desc: 'Enter state, education level, stream, marks, and family income bracket—without Aadhaar or banking credentials.',
            },
            {
              step: '02. Evaluate Rule Eligibility',
              desc: 'Compare your profile side-by-side against mandatory scheme rules with clear Matched or Missing explanations.',
            },
            {
              step: '03. Inspect Application Links',
              desc: 'Scan any WhatsApp, SMS, or portal URL for lookalike domains, phishing terms, redirects, and threat intelligence hits.',
            },
            {
              step: '04. Track Documents & Status',
              desc: 'Review why each official certificate is required and log application references from Started through Selected.',
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-bold text-slate-900">{item.step}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SCHOLARSHIP VERIFICATION EXPLANATION */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Transparent Multi-Source Scholarship Verification
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                ScholarShield never marks a scholarship verified from AI output alone. Every listing requires traceable official announcements, domain checks, and administrator audit records.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    GREEN: VERIFIED
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900/90">
                    Provider identity, official .gov.in / institutional portal, eligibility criteria, and application link have been corroborated with primary evidence and logged by an administrator.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    YELLOW: NEEDS REVIEW
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
                    Displayed whenever official cycle dates, primary gazette links, or source evidence are incomplete or awaiting administrator review.
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-900">
                    <ShieldAlert className="h-4 w-4 text-red-700" />
                    RED: SUSPICIOUS
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-red-900/90">
                    Flagged for domain impersonation, upfront UPI/registration fee demands, or corroborated fraud indicators. Never submit sensitive details.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <img
                  src="/src/assets/images/verify_engine_visual_1794979302473.jpg"
                  alt="Isometric illustration of multi-layer academic scholarship source verification"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CYBERSECURITY PROTECTION FEATURES */}
      <section className="bg-[#0B162C] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-6">
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                <img
                  src="/src/assets/images/cyber_scanner_visual_1794979304539.jpg"
                  alt="Isometric cybersecurity URL inspection pipeline analyzing domain spelling and threat intelligence"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-6">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Server-Side URL Security &amp; Phishing Scanner
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Scholarship scams frequently circulate via forwarded messages mimicking <span className="font-mono text-cyan-300">scholarships.gov.in</span> or <span className="font-mono text-cyan-300">aicte-india.org</span>. Paste any link into ScholarShield before clicking.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span>Detects lookalike spelling, punycode homographs, and suspicious subdomains.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span>Inspects HTTPS availability and controlled redirect chains with SSRF protection.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span>Queries Google Safe Browsing and VirusTotal server-side without exposing student data.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span>Never auto-opens suspicious links and reports clear timestamps and scan limitations.</span>
                </li>
              </ul>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
                >
                  Launch URL Security Scanner
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SAMPLE STUDENT TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Student Perspectives</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sample student scenarios illustrating how verification and document guidance prevent costly mistakes.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Sample Content · Illustrative Testimonials
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <img
                src="/src/assets/images/student_avatar_ananya_1794979304794.jpg"
                alt="Sample portrait of Ananya Nair, B.Tech student"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ananya Nair (Sample Profile)</h3>
                <p className="text-xs text-slate-500">B.Tech Computer Science · Kerala (Sample Content)</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              &ldquo;Before ScholarShield, a forwarded WhatsApp message asked for a ₹499 scholarship processing fee via UPI. The URL scanner flagged the domain mismatch immediately and pointed me to the official AICTE Pragati portal on scholarships.gov.in.&rdquo;
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <img
                src="/src/assets/images/student_avatar_rohan_1794979304462.jpg"
                alt="Sample portrait of Rohan Deshmukh, M.Sc. Physics student"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rohan Deshmukh (Sample Profile)</h3>
                <p className="text-xs text-slate-500">Integrated M.Sc. Physics · Maharashtra (Sample Content)</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              &ldquo;The rule-based eligibility checklist showed exactly which MahaDBT income brackets and DST INSPIRE documents I needed to prepare weeks before deadlines opened, without guessing.&rdquo;
            </p>
          </article>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 py-1 text-left text-sm font-semibold text-slate-900 sm:text-base"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-800 bg-[#0B162C] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_8457735b.png"
                  alt="Rajeev Institute of Technology Logo"
                  className="h-10 w-10 rounded-lg bg-white object-contain p-1 shrink-0"
                />
                <div>
                  <p className="text-base font-bold text-white">ScholarShield</p>
                  <p className="text-xs font-medium text-cyan-300">
                    Rajeev Institute of Technology · Department of Computer Science
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Discover Opportunities. Verify Scholarships. Protect Your Future. Designed for Indian students with strict data minimization and verifiable source transparency.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Modules</p>
              <div className="mt-3 flex flex-col gap-2 text-xs">
                <button type="button" onClick={() => onNavigate('discover')} className="text-left hover:text-white">
                  Scholarship Discovery Engine
                </button>
                <button type="button" onClick={() => onNavigate('scanner')} className="text-left hover:text-white">
                  Cybersecurity URL Scanner
                </button>
                <button type="button" onClick={() => onNavigate('report')} className="text-left hover:text-white">
                  Report Suspicious Scholarship / Scam
                </button>
                <button type="button" onClick={() => onOpenAuth('admin')} className="text-left hover:text-white">
                  Administrator Portal Login
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Privacy &amp; Contact</p>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  <span>security-desk@scholarshield.org</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="font-medium text-cyan-300 hover:underline"
                >
                  Read Privacy &amp; Data Minimization Policy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} ScholarShield. Informational verification &amp; security screening platform. Always confirm final deadlines on official government portals.
          </div>
        </div>
      </footer>

      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl">
            <h3 className="text-lg font-bold">ScholarShield Privacy &amp; Data Minimization Policy</h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                <strong>1. Strict Data Minimization:</strong> ScholarShield collects only academic and eligibility attributes (state, education level, stream, percentage, and income bracket) needed to run deterministic matching. We never request Aadhaar numbers, bank passwords, or financial credentials.
              </p>
              <p>
                <strong>2. Private Student Records:</strong> Your saved scholarships, application notes, and profile fields are isolated to your authenticated user ID on the backend.
              </p>
              <p>
                <strong>3. Third-Party Security Scanning:</strong> When scanning URLs via Google Safe Browsing or VirusTotal, only the submitted URL is evaluated—never your name, email, or academic profile.
              </p>
              <p>
                <strong>4. Document Safety:</strong> Document checklists are educational guides only; sensitive certificates are not uploaded or stored by default.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
