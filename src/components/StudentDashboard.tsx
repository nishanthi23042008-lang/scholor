import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bookmark,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  ApplicationRecord,
  NotificationItem,
  Profile,
  Scholarship,
  SecurityScanResult,
} from '../types';
import { VerificationBadge } from './StatusBadge';
import { DeadlineAlertSignup } from './DeadlineAlertSignup';

interface StudentDashboardProps {
  onOpenAuth: () => void;
  onNavigateDiscover: () => void;
}

interface DashboardPayload {
  profile: Profile;
  completionPercent: number;
  recommendedScholarships: Scholarship[];
  eligibleScholarships: Scholarship[];
  savedScholarships: Scholarship[];
  applications: ApplicationRecord[];
  notifications: NotificationItem[];
  securityAlerts: SecurityScanResult[];
  recentActivities: Array<{ id: string; kind: string; title: string; timestamp: string }>;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenAuth,
  onNavigateDiscover,
}) => {
  const { user, profile, token, resendVerification, refreshProfile } = useAuth();
  const [tab, setTab] = useState<
    'overview' | 'profile' | 'tracker' | 'saved' | 'notifications'
  >('overview');

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [district, setDistrict] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [institution, setInstitution] = useState('Rajeev Institute of Technology');
  const [course, setCourse] = useState('Computer Science');
  const [gdgUrl, setGdgUrl] = useState('https://gdg.community.dev');
  const [academicYear, setAcademicYear] = useState('');
  const [previousPercentage, setPreviousPercentage] = useState('');
  const [familyIncomeRange, setFamilyIncomeRange] = useState('');
  const [category, setCategory] = useState('');
  const [preferencesText, setPreferencesText] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [emailReminders, setEmailReminders] = useState(false);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Tracker filter & editing
  const [trackerFilter, setTrackerFilter] = useState('All');
  const [verifyMailMsg, setVerifyMailMsg] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<DashboardPayload>('/api/dashboard', {}, token);
      setData(payload);
      const p = payload.profile;
      setFullName(p.fullName || '');
      setPhone(p.phone || '');
      setStateVal(p.state || '');
      setDistrict(p.district || '');
      setEducationLevel(p.educationLevel || '');
      setInstitution(p.institution || 'Rajeev Institute of Technology');
      setCourse(p.course || 'Computer Science');
      setGdgUrl(p.gdgUrl || 'https://gdg.community.dev');
      setAcademicYear(p.academicYear || '');
      setPreviousPercentage(p.previousPercentage || '');
      setFamilyIncomeRange(p.familyIncomeRange || '');
      setCategory(p.category || '');
      setPreferencesText(Array.isArray(p.preferences) ? p.preferences.join(', ') : '');
      setConsentAccepted(p.consentAccepted);
      setEmailReminders(p.emailReminders);
      setDeadlineReminders(p.deadlineReminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <UserCheck className="mx-auto h-10 w-10 text-blue-700" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Student Workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to view personalized scholarship recommendations, manage your academic profile, track applications, and receive security or deadline alerts.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-6 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Sign In / Create Student Account
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setProfileMsg('Please accept the data minimization consent notice before saving.');
      return;
    }
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await apiRequest(
        '/api/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            fullName,
            phone,
            state: stateVal,
            district,
            educationLevel,
            institution,
            course,
            gdgUrl,
            academicYear,
            previousPercentage: previousPercentage === '' ? null : Number(previousPercentage),
            familyIncomeRange,
            category,
            preferences: preferencesText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            consentAccepted,
            emailReminders,
            deadlineReminders,
          }),
        },
        token
      );
      await refreshProfile();
      await loadDashboard();
      setProfileMsg('Student profile saved. Eligibility matches refreshed.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateApplication = async (
    scholarshipId: number,
    status: string,
    applicationRef: string,
    personalNotes: string
  ) => {
    try {
      await apiRequest(
        '/api/applications',
        {
          method: 'POST',
          body: JSON.stringify({ scholarshipId, status, applicationRef, personalNotes }),
        },
        token
      );
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application.');
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }, token);
      await loadDashboard();
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', { method: 'POST' }, token);
      await loadDashboard();
    } catch {
      // Ignore
    }
  };

  const handleRemoveBookmark = async (scholarshipId: number) => {
    try {
      await apiRequest(`/api/saved/${scholarshipId}`, { method: 'DELETE' }, token);
      await loadDashboard();
    } catch {
      // Ignore
    }
  };

  const unreadCount = data?.notifications.filter((n) => !n.isRead).length || 0;
  const filteredApps = (data?.applications || []).filter(
    (a) => trackerFilter === 'All' || a.status === trackerFilter
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Email Verification Notice */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Welcome, {profile?.fullName || user.displayName || user.email}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span>{data?.profile?.institution || 'Rajeev Institute of Technology'}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>
              {/^department\s+of\s+/i.test(data?.profile?.course || '')
                ? data?.profile?.course
                : `Department of ${data?.profile?.course || 'Computer Science'}`}
            </span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>
              Profile Completion:{' '}
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {data?.completionPercent ?? 0}%
              </span>
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'profile', label: 'Profile & Consent' },
              { id: 'tracker', label: 'Application Tracker' },
              { id: 'saved', label: 'Saved Schemes' },
              {
                id: 'notifications',
                label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications',
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!user.emailVerified && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span>
            Your email address ({user.email}) is not marked verified yet. Verify your email to enable official reminder alerts.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await resendVerification();
                setVerifyMailMsg('Verification email sent.');
              }}
              className="rounded border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
            >
              Resend Verification Email
            </button>
            <button
              type="button"
              onClick={() => refreshProfile()}
              className="rounded bg-amber-800 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
            >
              I Verified
            </button>
            {verifyMailMsg && <span className="font-semibold">{verifyMailMsg}</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && data && (
            <div className="mt-6 space-y-8">
              {/* Institution, Department & GDG Chapter Banner */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <img
                      src="/assets/aistudio/gdg_campus_rit_logo.png"
                      alt="GDG on Campus RIT Hassan Logo"
                      className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-0.5 shrink-0"
                    />
                    <img
                      src="/assets/aistudio/image_8457735b.png"
                      alt="Rajeev Institute of Technology Logo"
                      className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-1 shrink-0"
                    />
                    <img
                      src="/assets/aistudio/cse_department_logo.png"
                      alt="Department of Computer Science & Engineering Logo"
                      className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-0.5 shrink-0"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {data.profile.institution || 'Rajeev Institute of Technology'}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      <strong>
                        {/^department\s+of\s+/i.test(data.profile.course || '')
                          ? data.profile.course
                          : `Department of ${data.profile.course || 'Computer Science'}`}
                      </strong>
                      <span className="mx-2" aria-hidden="true">·</span>
                      GDG URL:{' '}
                      <a
                        href={data.profile.gdgUrl || 'https://gdg.community.dev'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 hover:underline"
                      >
                        {data.profile.gdgUrl || 'https://gdg.community.dev'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit College &amp; GDG URL
                </button>
              </div>

              {/* KPI Summary Strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Profile Completion</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {data.completionPercent}%
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-blue-700"
                      style={{ width: `${data.completionPercent}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Eligible / Potential Matches</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                    {data.eligibleScholarships.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Rule-matched verified schemes</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Tracked Applications</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {data.applications.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{data.savedScholarships.length} saved bookmarks</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Security Alerts</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {data.securityAlerts.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Flagged URL scans</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Recommended & Eligible Scholarships */}
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">
                        Recommended &amp; Eligible Scholarships
                      </h2>
                      <button
                        type="button"
                        onClick={onNavigateDiscover}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Browse all schemes →
                      </button>
                    </div>

                    {data.completionPercent < 50 && (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                        Complete your state, education level, percentage, and income bracket under{' '}
                        <button
                          type="button"
                          onClick={() => setTab('profile')}
                          className="font-bold underline"
                        >
                          Profile &amp; Consent
                        </button>{' '}
                        to sharpen rule-based matches.
                      </div>
                    )}

                    <div className="mt-4 divide-y divide-slate-100">
                      {data.eligibleScholarships.slice(0, 5).map((sch) => (
                        <div key={sch.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{sch.title}</h3>
                            <VerificationBadge status={sch.verificationStatus} />
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {sch.amountText} · Deadline: {sch.deadlineDate} · Match:{' '}
                            <span className="font-semibold text-blue-700">
                              {sch.eligibility?.status}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Deadlines */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="text-base font-bold text-slate-900">
                      Saved &amp; Tracked Deadlines
                    </h2>
                    {data.savedScholarships.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Bookmark scholarships in the Discovery Engine to monitor their cycle deadlines here.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {data.savedScholarships.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-xs last:border-0"
                          >
                            <span className="font-medium text-slate-800">{s.title}</span>
                            <span className="font-mono font-semibold text-slate-700 shrink-0">
                              {s.deadlineDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Alerts & Recent Activities */}
                <div className="space-y-6 lg:col-span-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Security Alerts
                    </h2>
                    {data.securityAlerts.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No suspicious or flagged URLs in your recent scans.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {data.securityAlerts.map((alert, i) => (
                          <div key={alert.id || i} className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
                            <p className="font-mono font-bold text-red-900">{alert.normalizedHost}</p>
                            <p className="mt-0.5 text-red-800">{alert.reasons?.[0]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="text-base font-bold text-slate-900">Recent Activities</h2>
                    {data.recentActivities.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Your application updates, URL scans, and reports will appear here.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {data.recentActivities.map((act) => (
                          <div key={act.id} className="border-b border-slate-100 pb-2 text-xs last:border-0">
                            <p className="font-medium text-slate-800">{act.title}</p>
                            <p className="mt-0.5 font-mono text-slate-400 tabular-nums">
                              {new Date(act.timestamp).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PROFILE */}
          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Student Profile &amp; Data Minimization
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Used strictly for rule-based scholarship eligibility calculation. ScholarShield never collects Aadhaar numbers, bank credentials, or passwords.
                </p>
              </div>

              {profileMsg && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={profile?.email || user.email || ''}
                    disabled
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">State / UT</label>
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="e.g. Maharashtra, Karnataka, Kerala"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select Level</option>
                    <option value="High School">High School</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    College / Institution Name
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Rajeev Institute of Technology"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Department / Course
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Computer Science"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    GDG URL (Google Developer Groups Chapter / Portal)
                  </label>
                  <input
                    type="url"
                    value={gdgUrl}
                    onChange={(e) => setGdgUrl(e.target.value)}
                    placeholder="https://gdg.community.dev"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 1st Year / 2026-27"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Previous Academic Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={previousPercentage}
                    onChange={(e) => setPreviousPercentage(e.target.value)}
                    placeholder="e.g. 85.5"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Family Annual Income Range
                  </label>
                  <select
                    value={familyIncomeRange}
                    onChange={(e) => setFamilyIncomeRange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select Income Range</option>
                    <option value="Below 1 Lakh">Below 1 Lakh</option>
                    <option value="1-2.5 Lakhs">1-2.5 Lakhs</option>
                    <option value="2.5-5 Lakhs">2.5-5 Lakhs</option>
                    <option value="5-8 Lakhs">5-8 Lakhs</option>
                    <option value="Above 8 Lakhs">Above 8 Lakhs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Category (Optional — only for scheme matching)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Prefer not to specify</option>
                    <option value="General">General</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Minority">Minority</option>
                    <option value="PwD">PwD</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Scholarship Preferences (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={preferencesText}
                    onChange={(e) => setPreferencesText(e.target.value)}
                    placeholder="e.g. Merit-based, STEM, Central Government, Fee Waiver"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={deadlineReminders}
                    onChange={(e) => setDeadlineReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>Enable in-app deadline and verification change notifications</span>
                </label>
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={emailReminders}
                    onChange={(e) => setEmailReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>Opt in to email reminders (dispatched when server email service is configured)</span>
                </label>
                <label className="flex items-start gap-2.5 font-medium text-slate-900">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    required
                  />
                  <span>
                    I consent to ScholarShield storing these academic eligibility details privately for matching and application tracking.
                  </span>
                </label>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="min-h-[44px] rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                >
                  {profileSaving ? 'Saving Profile...' : 'Save Student Profile'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: APPLICATION TRACKER */}
          {tab === 'tracker' && data && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <ClipboardList className="h-5 w-5 text-blue-700" />
                  Application Tracker
                </h2>
                <select
                  value={trackerFilter}
                  onChange={(e) => setTrackerFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Not Applied">Not Applied</option>
                  <option value="Application Started">Application Started</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Application Submitted">Application Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {filteredApps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                  No tracked applications match this filter. Open any scholarship in Discover to start tracking.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => (
                    <ApplicationTrackerRow
                      key={app.id}
                      app={app}
                      onSave={handleUpdateApplication}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVED SCHOLARSHIPS */}
          {tab === 'saved' && data && (
            <div className="mt-6 space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Bookmark className="h-5 w-5 text-blue-700" />
                Saved Scholarships ({data.savedScholarships.length})
              </h2>
              {data.savedScholarships.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                  No bookmarked scholarships yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {data.savedScholarships.map((sch) => (
                    <div key={sch.id} className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-2">
                        <VerificationBadge status={sch.verificationStatus} />
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(sch.id)}
                          className="text-xs font-semibold text-slate-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-900">{sch.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {sch.amountText} · Deadline: {sch.deadlineDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {tab === 'notifications' && data && (
            <div className="mt-6 space-y-6">
              <DeadlineAlertSignup compact onSubscriptionChanged={loadDashboard} />

              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Bell className="h-5 w-5 text-blue-700" />
                  Notifications &amp; Alerts
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {data.notifications.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                  No notifications yet. Status updates, deadline reminders, and security alerts appear here.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                  {data.notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start justify-between gap-4 p-4 ${
                        n.isRead ? 'bg-white' : 'bg-blue-50/40'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{n.message}</p>
                        <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                          {new Date(n.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="shrink-0 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ApplicationTrackerRow: React.FC<{
  app: ApplicationRecord;
  onSave: (scholarshipId: number, status: string, ref: string, notes: string) => Promise<void>;
}> = ({ app, onSave }) => {
  const [status, setStatus] = useState(app.status);
  const [ref, setRef] = useState(app.applicationRef || '');
  const [notes, setNotes] = useState(app.personalNotes || '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {app.scholarship?.title || `Scholarship #${app.scholarshipId}`}
          </h3>
          <p className="text-xs text-slate-500">
            {app.scholarship?.provider} · Deadline: {app.scholarship?.deadlineDate}
          </p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
          {app.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
        >
          <option value="Not Applied">Not Applied</option>
          <option value="Application Started">Application Started</option>
          <option value="Documents Pending">Documents Pending</option>
          <option value="Application Submitted">Application Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Reference ID"
          className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Personal notes..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(app.scholarshipId, status, ref, notes);
            setSaving(false);
          }}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          {saving ? 'Updating...' : 'Save Update'}
        </button>

        {Array.isArray(app.history) && app.history.length > 0 && (
          <span className="font-mono text-xs text-slate-500">
            Latest history: {app.history[0].status} ({new Date(app.history[0].changedAt).toLocaleDateString('en-IN')})
          </span>
        )}
      </div>
    </div>
  );
};
