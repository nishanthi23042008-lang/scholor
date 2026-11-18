import React, { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  HelpCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { EligibilityResult, Scholarship } from '../types';
import { VerificationBadge } from './StatusBadge';
import { DeadlineAlertSignup } from './DeadlineAlertSignup';

interface ScholarshipDiscoveryProps {
  initialQuery?: string;
  initialState?: string;
  initialLevel?: string;
  onOpenAuth: () => void;
  onOpenScannerWithUrl: (url: string) => void;
}

export const ScholarshipDiscovery: React.FC<ScholarshipDiscoveryProps> = ({
  initialQuery = '',
  initialState = 'All',
  initialLevel = 'All',
  onOpenAuth,
  onOpenScannerWithUrl,
}) => {
  const { user, profile, token } = useAuth();

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [q, setQ] = useState(initialQuery);
  const [educationLevel, setEducationLevel] = useState(initialLevel);
  const [courseStream, setCourseStream] = useState('All');
  const [stateFilter, setStateFilter] = useState(initialState);
  const [providerType, setProviderType] = useState('All');
  const [verificationStatus, setVerificationStatus] = useState('All');
  const [maxIncome, setMaxIncome] = useState('');
  const [minPercentage, setMinPercentage] = useState('');
  const [liveCategory, setLiveCategory] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [minAmount, setMinAmount] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [sort, setSort] = useState('verified_first');

  // Detail modal
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<Scholarship | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'eligibility' | 'documents' | 'tracker' | 'ai'
  >('overview');

  // Guest/custom eligibility calculator override
  const [eligState, setEligState] = useState(profile?.state || '');
  const [eligLevel, setEligLevel] = useState(profile?.educationLevel || 'Undergraduate');
  const [eligCourse, setEligCourse] = useState(profile?.course || '');
  const [eligPct, setEligPct] = useState(profile?.previousPercentage || '');
  const [eligIncome, setEligIncome] = useState(profile?.familyIncomeRange || '');
  const [eligCategory, setEligCategory] = useState(profile?.category || '');
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [eligBusy, setEligBusy] = useState(false);

  // Tracker quick save
  const [appStatus, setAppStatus] = useState('Application Started');
  const [appRef, setAppRef] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [trackerMsg, setTrackerMsg] = useState('');
  const [trackerBusy, setTrackerBusy] = useState(false);

  // Gemini AI
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setQ(initialQuery);
    setStateFilter(initialState);
    setEducationLevel(initialLevel);
  }, [initialQuery, initialState, initialLevel]);

  useEffect(() => {
    if (profile) {
      setEligState(profile.state || '');
      setEligLevel(profile.educationLevel || 'Undergraduate');
      setEligCourse(profile.course || '');
      setEligPct(profile.previousPercentage || '');
      setEligIncome(profile.familyIncomeRange || '');
      setEligCategory(profile.category || '');
    }
  }, [profile]);

  const hasTypedEligibility = Boolean(
    maxIncome.trim() ||
      minPercentage.trim() ||
      liveCategory !== 'All' ||
      educationLevel !== 'All' ||
      courseStream !== 'All' ||
      stateFilter !== 'All'
  );

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (educationLevel !== 'All') {
        params.set('educationLevel', educationLevel);
        params.set('eligLevel', educationLevel);
      }
      if (courseStream !== 'All') {
        params.set('courseStream', courseStream);
        params.set('eligCourse', courseStream);
      }
      if (stateFilter !== 'All') {
        params.set('state', stateFilter);
        params.set('eligState', stateFilter);
      }
      if (providerType !== 'All') params.set('providerType', providerType);
      if (verificationStatus !== 'All') params.set('verificationStatus', verificationStatus);
      if (maxIncome.trim()) params.set('eligIncome', maxIncome.trim());
      if (minPercentage.trim()) params.set('eligPercentage', minPercentage.trim());
      if (liveCategory !== 'All') params.set('eligCategory', liveCategory);
      if (onlyEligible && hasTypedEligibility) params.set('onlyEligible', 'true');
      if (minAmount.trim()) params.set('minAmount', minAmount.trim());
      if (providerFilter.trim()) params.set('provider', providerFilter.trim());
      if (sort) params.set('sort', sort);

      const data = await apiRequest<{ scholarships: Scholarship[] }>(
        `/api/scholarships?${params.toString()}`,
        {},
        token
      );
      setScholarships(data.scholarships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch scholarships.');
    } finally {
      setLoading(false);
    }
  }, [
    q,
    educationLevel,
    courseStream,
    stateFilter,
    providerType,
    verificationStatus,
    maxIncome,
    minPercentage,
    liveCategory,
    onlyEligible,
    hasTypedEligibility,
    minAmount,
    providerFilter,
    sort,
    token,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadScholarships();
    }, 150);
    return () => clearTimeout(t);
  }, [loadScholarships]);

  const openDetails = async (id: number) => {
    setSelectedId(id);
    setDetailTab('overview');
    setDetailLoading(true);
    setAiResponse('');
    setAiError('');
    setTrackerMsg('');
    try {
      const res = await apiRequest<{ scholarship: Scholarship }>(
        `/api/scholarships/${id}`,
        {},
        token
      );
      setDetailData(res.scholarship);
      setEligResult(res.scholarship.eligibility || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBookmark = async (sch: Scholarship) => {
    if (!user || !token) {
      onOpenAuth();
      return;
    }
    try {
      if (sch.isBookmarked) {
        await apiRequest(`/api/saved/${sch.id}`, { method: 'DELETE' }, token);
      } else {
        await apiRequest(`/api/saved/${sch.id}`, { method: 'POST' }, token);
      }
      setScholarships((prev) =>
        prev.map((item) =>
          item.id === sch.id ? { ...item, isBookmarked: !sch.isBookmarked } : item
        )
      );
      if (detailData?.id === sch.id) {
        setDetailData({ ...detailData, isBookmarked: !detailData.isBookmarked });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bookmark update failed.');
    }
  };

  const runEligibilityCheck = async () => {
    if (!detailData) return;
    setEligBusy(true);
    try {
      const res = await apiRequest<{ result: EligibilityResult }>(
        '/api/eligibility/evaluate',
        {
          method: 'POST',
          body: JSON.stringify({
            scholarshipId: detailData.id,
            profileOverride: {
              state: eligState,
              educationLevel: eligLevel,
              course: eligCourse,
              previousPercentage: eligPct === '' ? null : Number(eligPct),
              familyIncomeRange: eligIncome,
              category: eligCategory,
            },
          }),
        },
        token
      );
      setEligResult(res.result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Eligibility evaluation failed.');
    } finally {
      setEligBusy(false);
    }
  };

  const handleTrackSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      onOpenAuth();
      return;
    }
    if (!detailData) return;
    setTrackerBusy(true);
    setTrackerMsg('');
    try {
      await apiRequest(
        '/api/applications',
        {
          method: 'POST',
          body: JSON.stringify({
            scholarshipId: detailData.id,
            status: appStatus,
            applicationRef: appRef,
            personalNotes: appNotes,
          }),
        },
        token
      );
      setTrackerMsg('Application tracker updated and saved to your dashboard.');
    } catch (err) {
      setTrackerMsg(err instanceof Error ? err.message : 'Failed to update tracker.');
    } finally {
      setTrackerBusy(false);
    }
  };

  const runAiExplain = async (
    mode: 'eligibility' | 'summary' | 'documents' | 'qa'
  ) => {
    if (!detailData) return;
    setAiLoading(true);
    setAiError('');
    setAiResponse('');
    try {
      const res = await apiRequest<{ explanation: string }>(
        '/api/ai/explain',
        {
          method: 'POST',
          body: JSON.stringify({
            mode,
            scholarshipId: detailData.id,
            eligibilityResult: mode === 'eligibility' ? eligResult : undefined,
            question: mode === 'qa' ? aiQuestion : undefined,
          }),
        },
        token
      );
      setAiResponse(res.explanation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI explanation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const resetFilters = () => {
    setQ('');
    setEducationLevel('All');
    setCourseStream('All');
    setStateFilter('All');
    setProviderType('All');
    setVerificationStatus('All');
    setMaxIncome('');
    setMinPercentage('');
    setLiveCategory('All');
    setOnlyEligible(true);
    setMinAmount('');
    setProviderFilter('');
    setSort('verified_first');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Scholarship Discovery Engine
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search verified Indian government and institutional scholarships. Sample educational records are explicitly labeled.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 tabular-nums">
          Showing {scholarships.length} curated records
        </div>
      </div>

      {/* Filters Panel */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter className="h-4 w-4 text-blue-700" />
            Search &amp; Eligibility Filters
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Reset all filters
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, provider, stream, or state..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            aria-label="Filter by education level"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">Education Level: All</option>
            <option value="High School">High School</option>
            <option value="Diploma">Diploma</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>

          <select
            value={courseStream}
            onChange={(e) => setCourseStream(e.target.value)}
            aria-label="Filter by course stream"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">Course Stream: All</option>
            <option value="Engineering & Technology">Engineering &amp; Technology</option>
            <option value="Science & Research">Science &amp; Research</option>
            <option value="All Streams">General / All Streams</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label="Filter by state"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">State: All India</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="North East">North East Region</option>
          </select>

          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
            aria-label="Filter by provider type"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">Provider Type: All</option>
            <option value="government">Government</option>
            <option value="institutional">Institutional</option>
            <option value="private">Private</option>
          </select>

          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
            aria-label="Filter by verification status"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">Verification: All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="SUSPICIOUS">Suspicious Alerts</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort scholarships"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="verified_first">Sort: Verified First</option>
            <option value="amount_desc">Sort: Highest Award</option>
            <option value="recent">Sort: Recently Checked</option>
          </select>

          <input
            type="number"
            value={maxIncome}
            onChange={(e) => setMaxIncome(e.target.value)}
            placeholder="Your annual family income (₹)"
            aria-label="Filter by annual income in INR"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />

          <input
            type="number"
            value={minPercentage}
            onChange={(e) => setMinPercentage(e.target.value)}
            placeholder="Your academic % (e.g. 82)"
            aria-label="Filter by your academic percentage"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />

          <select
            value={liveCategory}
            onChange={(e) => setLiveCategory(e.target.value)}
            aria-label="Filter by optional category"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="All">Category: Any</option>
            <option value="General">General</option>
            <option value="OBC-NCL">OBC-NCL</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
            <option value="Minority">Minority</option>
            <option value="PwD">PwD</option>
          </select>

          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Minimum award ₹ (e.g. 20000)"
            aria-label="Filter by minimum award amount"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />

          <input
            type="text"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            placeholder="Provider name (e.g. AICTE)"
            aria-label="Filter by provider"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none sm:col-span-2"
          />

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 sm:col-span-2">
            <input
              type="checkbox"
              checked={onlyEligible}
              onChange={(e) => setOnlyEligible(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            <span>Hide &ldquo;Not Eligible&rdquo; schemes for typed eligibility data</span>
          </label>
        </div>
      </div>

      {/* Email Deadline Alert Signup */}
      <div className="mt-6">
        <DeadlineAlertSignup
          compact
          defaultLevel={educationLevel}
          defaultStream={courseStream}
          defaultState={stateFilter === 'All' ? 'All India' : stateFilter}
        />
      </div>

      {/* Results Area */}
      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-60 animate-pulse rounded-xl border border-slate-200 bg-white p-6" />
          ))}
        </div>
      ) : scholarships.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-900">
            No scholarships match your current filters.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Try clearing your income cap or state filter to inspect central All-India schemes.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {scholarships.map((sch) => (
            <article
              key={sch.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
            >
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <VerificationBadge status={sch.verificationStatus} />
                  <div className="flex items-center gap-2">
                    {sch.isSample && (
                      <span className="text-xs font-semibold text-amber-700">
                        Sample Record
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(sch)}
                      aria-label={sch.isBookmarked ? 'Remove bookmark' : 'Bookmark scholarship'}
                      className={`rounded-lg border p-2 transition-colors ${
                        sch.isBookmarked
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Bookmark className="h-4 w-4" fill={sch.isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-900">{sch.title}</h2>
                <p className="mt-1 text-xs font-medium text-slate-600">{sch.provider}</p>

                {/* Zero-pill inline metadata */}
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{sch.amountText}</span>
                  <span aria-hidden="true">·</span>
                  <span>{sch.educationLevel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{sch.stateScope}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{sch.providerType}</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">{sch.summary}</p>

                {/* Explicit Authentic vs Fake Verdict Box */}
                <div
                  className={`mt-4 rounded-lg border p-3 text-xs ${
                    sch.verificationStatus === 'VERIFIED'
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                      : sch.verificationStatus === 'SUSPICIOUS'
                        ? 'border-red-200 bg-red-50 text-red-950'
                        : 'border-amber-200 bg-amber-50/70 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      {sch.verificationStatus === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          Authentic · Verified Official Scholarship
                        </>
                      ) : sch.verificationStatus === 'SUSPICIOUS' ? (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 text-red-700" />
                          Likely Fake / Scam Alert — Do Not Pay Fees
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                          Unverified · Needs Official Review
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenScannerWithUrl(sch.applicationUrl)}
                      className="font-semibold underline hover:no-underline shrink-0"
                    >
                      Scan URL
                    </button>
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">{sch.verificationReason}</p>
                </div>

                {/* Live Rule-Based Eligibility Match Strip */}
                {sch.eligibility && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700">Live Eligibility Match:</span>
                      <span
                        className={`font-bold ${
                          sch.eligibility.status === 'Eligible'
                            ? 'text-emerald-700'
                            : sch.eligibility.status === 'Not Eligible'
                              ? 'text-red-700'
                              : 'text-blue-700'
                        }`}
                      >
                        {sch.eligibility.status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {sch.eligibility.matchedCount} matched · {sch.eligibility.missingCount} missing info · {sch.eligibility.mismatchCount} not met
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Deadline:</span>{' '}
                    <span className="font-semibold text-slate-800">{sch.deadlineDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Checked:</span>{' '}
                    <span className="font-mono text-slate-700 tabular-nums">
                      {new Date(sch.lastCheckedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Documents:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {sch.documents?.length || 0} listed
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Portal Host:</span>{' '}
                    <span className="font-mono text-slate-700">
                      {(() => {
                        try {
                          return new URL(sch.applicationUrl).hostname;
                        } catch {
                          return sch.applicationUrl;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => openDetails(sch.id)}
                  className="min-h-[40px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  View Details, Eligibility &amp; Docs
                </button>

                {sch.verificationStatus === 'SUSPICIOUS' ? (
                  <button
                    type="button"
                    onClick={() => onOpenScannerWithUrl(sch.applicationUrl)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Inspect Risk in Scanner
                  </button>
                ) : (
                  <a
                    href={sch.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Official Application Portal
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#0B162C] p-6 text-white">
              <div>
                {detailData && (
                  <div className="mb-2 flex items-center gap-3">
                    <VerificationBadge status={detailData.verificationStatus} />
                    {detailData.isSample && (
                      <span className="text-xs font-semibold text-amber-300">
                        Sample Demonstration Record
                      </span>
                    )}
                  </div>
                )}
                <h2 className="text-xl font-bold">
                  {detailLoading ? 'Loading scholarship record...' : detailData?.title}
                </h2>
                {detailData && (
                  <p className="mt-1 text-xs text-slate-300">
                    {detailData.provider} · {detailData.amountText}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setDetailData(null);
                }}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Close scholarship details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-6 py-2">
              {(
                [
                  { id: 'overview', label: 'Verification & Sources' },
                  { id: 'eligibility', label: 'Eligibility Calculator' },
                  { id: 'documents', label: 'Document Assistant' },
                  { id: 'tracker', label: 'Track Application' },
                  { id: 'ai', label: 'AI Guide' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    detailTab === tab.id
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading || !detailData ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading official verification trail and criteria...
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & VERIFICATION */}
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Scheme Overview</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                          {detailData.description}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <ShieldCheck className="h-4 w-4 text-blue-700" />
                          Verification Evidence &amp; Reasoning
                        </h3>
                        <p className="mt-2 text-xs text-slate-700">
                          <strong>Reason:</strong> {detailData.verificationReason}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-700">
                          <strong>Primary Evidence:</strong> {detailData.verificationEvidence}
                        </p>
                        <p className="mt-1.5 font-mono text-xs text-slate-500 tabular-nums">
                          Last Verification Check: {new Date(detailData.lastCheckedAt).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Official Sources</h3>
                        <div className="mt-2 space-y-2">
                          {detailData.sources?.map((src) => (
                            <div
                              key={src.id}
                              className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900">{src.sourceName}</p>
                                <p className="text-xs text-slate-600">{src.credibilityNote}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onOpenScannerWithUrl(src.sourceUrl)}
                                  className="text-xs font-medium text-slate-600 hover:text-blue-700 hover:underline"
                                >
                                  Scan URL
                                </button>
                                {detailData.verificationStatus !== 'SUSPICIOUS' && (
                                  <a
                                    href={src.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                                  >
                                    Visit Source
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {detailData.verificationHistory && detailData.verificationHistory.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Verification Audit Trail</h3>
                          <div className="mt-2 space-y-2">
                            {detailData.verificationHistory.map((h) => (
                              <div key={h.id} className="border-b border-slate-100 pb-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">
                                  {h.previousStatus} → {h.newStatus}
                                </span>{' '}
                                · {h.reason} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {new Date(h.createdAt).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: RULE-BASED ELIGIBILITY CALCULATOR */}
                  {detailTab === 'eligibility' && (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-bold text-slate-900">
                          Rule-Based Eligibility Parameters
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          {profile
                            ? 'Pre-filled from your saved profile. Adjust parameters below to test eligibility scenarios transparently.'
                            : 'Enter your academic details below to run transparent rule-based matching.'}
                        </p>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <input
                            type="text"
                            value={eligState}
                            onChange={(e) => setEligState(e.target.value)}
                            placeholder="Domicile State (e.g. Maharashtra)"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          />
                          <select
                            value={eligLevel}
                            onChange={(e) => setEligLevel(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          >
                            <option value="High School">High School</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Undergraduate">Undergraduate</option>
                            <option value="Postgraduate">Postgraduate</option>
                            <option value="PhD">PhD</option>
                          </select>
                          <input
                            type="text"
                            value={eligCourse}
                            onChange={(e) => setEligCourse(e.target.value)}
                            placeholder="Course (e.g. B.Tech Engineering)"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            value={eligPct}
                            onChange={(e) => setEligPct(e.target.value)}
                            placeholder="Previous % (e.g. 84)"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          />
                          <select
                            value={eligIncome}
                            onChange={(e) => setEligIncome(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          >
                            <option value="">Select Annual Family Income</option>
                            <option value="Below 1 Lakh">Below 1 Lakh</option>
                            <option value="1-2.5 Lakhs">1-2.5 Lakhs</option>
                            <option value="2.5-5 Lakhs">2.5-5 Lakhs</option>
                            <option value="5-8 Lakhs">5-8 Lakhs</option>
                            <option value="Above 8 Lakhs">Above 8 Lakhs</option>
                          </select>
                          <select
                            value={eligCategory}
                            onChange={(e) => setEligCategory(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                          >
                            <option value="">Category (Optional)</option>
                            <option value="General">General</option>
                            <option value="OBC-NCL">OBC-NCL</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                            <option value="Minority">Minority</option>
                            <option value="PwD">PwD</option>
                          </select>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={eligBusy}
                            onClick={runEligibilityCheck}
                            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                          >
                            {eligBusy ? 'Evaluating...' : 'Evaluate Eligibility'}
                          </button>
                          {eligResult && (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTab('ai');
                                runAiExplain('eligibility');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                              Explain Result with AI
                            </button>
                          )}
                        </div>
                      </div>

                      {eligResult && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4">
                            <div>
                              <p className="text-xs text-slate-500">Rule-Based Determination</p>
                              <p className="text-lg font-bold text-slate-900">{eligResult.status}</p>
                            </div>
                            <div className="font-mono text-xs text-slate-600 tabular-nums">
                              {eligResult.matchedCount} matched · {eligResult.missingCount} missing · {eligResult.mismatchCount} not met
                            </div>
                          </div>

                          <div className="space-y-2">
                            {eligResult.checks.map((chk, i) => (
                              <div
                                key={`${chk.criterionKey}-${i}`}
                                className="rounded-lg border border-slate-200 p-3 text-xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">{chk.label}</span>
                                  <span
                                    className={`font-semibold ${
                                      chk.outcome === 'match'
                                        ? 'text-emerald-700'
                                        : chk.outcome === 'mismatch'
                                          ? 'text-red-700'
                                          : chk.outcome === 'missing'
                                            ? 'text-amber-700'
                                            : 'text-blue-700'
                                    }`}
                                  >
                                    {chk.outcome === 'match'
                                      ? 'Matched'
                                      : chk.outcome === 'mismatch'
                                        ? 'Does Not Match'
                                        : chk.outcome === 'missing'
                                          ? 'Missing Info'
                                          : 'Check Official Rule'}
                                  </span>
                                </div>
                                <div className="mt-1 text-slate-600">
                                  Required: <strong>{chk.expectedValue}</strong> · Your Value:{' '}
                                  <strong>{chk.studentValue}</strong>
                                </div>
                                <p className="mt-1 text-slate-600">{chk.explanation}</p>
                              </div>
                            ))}
                          </div>

                          <p className="text-xs text-slate-500">{eligResult.disclaimer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: DOCUMENT ASSISTANT */}
                  {detailTab === 'documents' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Required Document Checklist
                          </h3>
                          <p className="text-xs text-slate-600">
                            ScholarShield does not upload or store sensitive certificates. Prepare official copies strictly for submission on the verified government/institution portal.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailTab('ai');
                            runAiExplain('documents');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                          Explain Documents with AI
                        </button>
                      </div>

                      {!detailData.documents || detailData.documents.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600">
                          No official documents listed for this record. Always check the official notification before sharing documents.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {detailData.documents.map((doc) => (
                            <div key={doc.id} className="rounded-lg border border-slate-200 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {doc.documentName}
                                  </h4>
                                </div>
                                <span className="text-xs font-semibold text-slate-500">
                                  {doc.isMandatory ? 'Mandatory' : 'Conditional'}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-700">
                                <strong>Why needed:</strong> {doc.purposeReason}
                              </p>
                              {doc.formatHint && (
                                <p className="mt-1 text-xs text-slate-500">
                                  <strong>Accepted Format:</strong> {doc.formatHint}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: TRACK APPLICATION */}
                  {detailTab === 'tracker' && (
                    <form onSubmit={handleTrackSave} className="max-w-lg space-y-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Add or Update Application Tracker
                      </h3>
                      {!user && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                          Sign in to save this application to your persistent student tracker.
                        </div>
                      )}
                      {trackerMsg && (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>{trackerMsg}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Application Status
                        </label>
                        <select
                          value={appStatus}
                          onChange={(e) => setAppStatus(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="Not Applied">Not Applied</option>
                          <option value="Application Started">Application Started</option>
                          <option value="Documents Pending">Documents Pending</option>
                          <option value="Application Submitted">Application Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Selected">Selected</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Application Reference ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={appRef}
                          onChange={(e) => setAppRef(e.target.value)}
                          placeholder="e.g. NSP2026-MH-10492"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Personal Notes
                        </label>
                        <textarea
                          rows={3}
                          value={appNotes}
                          onChange={(e) => setAppNotes(e.target.value)}
                          placeholder="Note pending college bonafide signature or submission date..."
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={trackerBusy}
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                      >
                        {trackerBusy ? 'Saving...' : user ? 'Save to Application Tracker' : 'Sign In to Track'}
                      </button>
                    </form>
                  )}

                  {/* TAB 5: GROUNDED AI ASSISTANT */}
                  {detailTab === 'ai' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <HelpCircle className="h-4 w-4 text-blue-700" />
                          Verified Context Assistant
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Ask questions grounded strictly in this scholarship&apos;s verified database record. AI cannot invent deadlines, links, or guarantee selection.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={aiLoading}
                            onClick={() => runAiExplain('summary')}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Summarize Requirements
                          </button>
                          <button
                            type="button"
                            disabled={aiLoading}
                            onClick={() => runAiExplain('documents')}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Explain Required Documents
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                            placeholder="Ask about income limits, documents, or application steps..."
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={aiLoading || !aiQuestion.trim()}
                            onClick={() => runAiExplain('qa')}
                            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                          >
                            Ask
                          </button>
                        </div>
                      </div>

                      {aiLoading && (
                        <div className="rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
                          Generating grounded explanation from verified record...
                        </div>
                      )}
                      {aiError && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                          {aiError}
                        </div>
                      )}
                      {aiResponse && (
                        <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800">
                          {aiResponse}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
