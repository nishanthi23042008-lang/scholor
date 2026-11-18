import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Lock,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { AuditLogEntry, ScamReport, Scholarship } from '../types';
import { VerificationBadge } from './StatusBadge';

interface AdminDashboardProps {
  onOpenAdminAuth: () => void;
}

interface AdminOverviewResponse {
  stats: {
    totalScholarships: number;
    verifiedCount: number;
    needsReviewCount: number;
    suspiciousCount: number;
    pendingReports: number;
    totalUsers: number;
    applicationBreakdown: Array<{ status: string; count: number }>;
  };
  scholarships: Scholarship[];
  scamReports: ScamReport[];
  users: Array<{
    id: number;
    uid: string;
    email: string;
    role: 'student' | 'admin';
    fullName: string;
    state: string;
    educationLevel: string;
    consentAccepted: boolean;
    createdAt: string;
  }>;
  auditLogs: AuditLogEntry[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenAdminAuth }) => {
  const { user, profile, token } = useAuth();
  const [tab, setTab] = useState<'scholarships' | 'reports' | 'users' | 'audit'>('scholarships');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Add scholarship modal/form state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newProviderType, setNewProviderType] = useState('government');
  const [newAmountText, setNewAmountText] = useState('');
  const [newAmountNum, setNewAmountNum] = useState('');
  const [newLevel, setNewLevel] = useState('Undergraduate');
  const [newStream, setNewStream] = useState('All Streams');
  const [newState, setNewState] = useState('All India');
  const [newDeadline, setNewDeadline] = useState('Check Official Portal');
  const [newOfficialUrl, setNewOfficialUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newStatus, setNewStatus] = useState<'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS'>('NEEDS_REVIEW');
  const [newEvidence, setNewEvidence] = useState('');

  // Verification modal state
  const [verifyTarget, setVerifyTarget] = useState<Scholarship | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS'>('VERIFIED');
  const [verifyReason, setVerifyReason] = useState('');
  const [verifyEvidence, setVerifyEvidence] = useState('');

  const loadAdminOverview = useCallback(async () => {
    if (!token || profile?.role !== 'admin') return;
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<AdminOverviewResponse>('/api/admin/overview', {}, token);
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin console.');
    } finally {
      setLoading(false);
    }
  }, [token, profile?.role]);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <Lock className="mx-auto h-10 w-10 text-slate-800" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Protected Administrator Console
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {user
              ? `Signed in as ${user.email} (Role: ${profile?.role || 'student'}). Administrator privileges enforced by server-side RBAC are required to review verification evidence, manage scholarships, and view audit logs.`
              : 'Sign in with an authorized administrator account to manage verified scholarship records, review scam reports, and inspect audit logs.'}
          </p>
          <button
            type="button"
            onClick={onOpenAdminAuth}
            className="mt-6 rounded-lg bg-[#0B162C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Administrator Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');
    setError('');
    try {
      await apiRequest(
        '/api/admin/scholarships',
        {
          method: 'POST',
          body: JSON.stringify({
            title: newTitle,
            provider: newProvider,
            providerType: newProviderType,
            amountText: newAmountText,
            amountNumeric: Number(newAmountNum || 0),
            educationLevel: newLevel,
            courseStream: newStream,
            stateScope: newState,
            deadlineDate: newDeadline,
            officialUrl: newOfficialUrl,
            applicationUrl: newOfficialUrl,
            summary: newSummary,
            description: newSummary,
            verificationStatus: newStatus,
            verificationReason: `Admin added record (${newStatus})`,
            verificationEvidence: newEvidence || newOfficialUrl,
            sourceName: newProvider,
          }),
        },
        token
      );
      setShowCreate(false);
      setNewTitle('');
      setNewProvider('');
      setNewOfficialUrl('');
      setNewSummary('');
      setFeedback('Scholarship created and recorded in admin audit logs.');
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    }
  };

  const handleVerifyDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget) return;
    try {
      await apiRequest(
        `/api/admin/scholarships/${verifyTarget.id}/verify`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            verificationStatus: verifyStatus,
            reason: verifyReason,
            evidence: verifyEvidence,
          }),
        },
        token
      );
      setVerifyTarget(null);
      setVerifyReason('');
      setVerifyEvidence('');
      setFeedback('Verification decision updated and logged.');
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification update failed.');
    }
  };

  const handleUpdateDeadline = async (sch: Scholarship, nextDeadline: string) => {
    try {
      const res = await apiRequest<{
        alertStats?: { matchedSubscribers: number; emailedCount: number; providerConfigured: boolean } | null;
      }>(
        `/api/admin/scholarships/${sch.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ deadlineDate: nextDeadline }),
        },
        token
      );
      const alertNote = res.alertStats
        ? ` Matched ${res.alertStats.matchedSubscribers} subscriber(s), emailed ${res.alertStats.emailedCount}.`
        : '';
      setFeedback(`Updated deadline for "${sch.title}".${alertNote}`);
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deadline.');
    }
  };

  const handleSendDeadlineAlert = async (sch: Scholarship) => {
    setError('');
    setFeedback('');
    try {
      const res = await apiRequest<{
        matchedSubscribers: number;
        emailedCount: number;
        providerConfigured: boolean;
      }>(
        `/api/admin/scholarships/${sch.id}/send-deadline-alert`,
        { method: 'POST' },
        token
      );
      setFeedback(
        res.providerConfigured
          ? `Deadline alert for "${sch.title}": ${res.emailedCount}/${res.matchedSubscribers} matching subscriber(s) emailed via Resend.`
          : `Matched ${res.matchedSubscribers} subscriber(s) for "${sch.title}" (configure RESEND_API_KEY in .env to dispatch live emails).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send deadline alert.');
    }
  };

  const handleArchiveToggle = async (sch: Scholarship) => {
    try {
      await apiRequest(
        `/api/admin/scholarships/${sch.id}/archive`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isArchived: !sch.isArchived }),
        },
        token
      );
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive toggle failed.');
    }
  };

  const handleDelete = async (sch: Scholarship) => {
    try {
      await apiRequest(`/api/admin/scholarships/${sch.id}`, { method: 'DELETE' }, token);
      setFeedback(`Deleted scholarship "${sch.title}".`);
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleReportReview = async (reportId: number, status: string, adminNotes: string) => {
    try {
      await apiRequest(
        `/api/admin/scam-reports/${reportId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, adminNotes }),
        },
        token
      );
      setFeedback('Scam report status updated.');
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scam report.');
    }
  };

  const handleRoleToggle = async (uid: string, currentRole: 'student' | 'admin') => {
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await apiRequest(
        `/api/admin/users/${uid}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: nextRole }),
        },
        token
      );
      setFeedback(`User role updated to ${nextRole}.`);
      await loadAdminOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-blue-700">ROLE-BASED ADMIN GOVERNANCE</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            ScholarShield Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Authenticated Admin: <span className="font-mono">{profile.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1">
          {(
            [
              { id: 'scholarships', label: 'Scholarships & Verification' },
              { id: 'reports', label: 'Scam Reports' },
              { id: 'users', label: 'User Accounts' },
              { id: 'audit', label: 'Audit Logs' },
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

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {feedback && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {overview && (
        <>
          {/* Admin Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Total Schemes</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {overview.stats.totalScholarships}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Verified</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                {overview.stats.verifiedCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Needs Review</p>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {overview.stats.needsReviewCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Pending Scam Reports</p>
              <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">
                {overview.stats.pendingReports}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Registered Accounts</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {overview.stats.totalUsers}
              </p>
            </div>
          </div>

          {/* TAB 1: SCHOLARSHIPS & VERIFICATION */}
          {tab === 'scholarships' && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Scholarship Records &amp; Verification Engine
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreate((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Scholarship
                </button>
              </div>

              {showCreate && (
                <form
                  onSubmit={handleCreateScholarship}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <h3 className="text-sm font-bold text-slate-900">Create Scholarship Record</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Official Scholarship Title"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      placeholder="Provider / Ministry / Institution"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <select
                      value={newProviderType}
                      onChange={(e) => setNewProviderType(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    >
                      <option value="government">Government</option>
                      <option value="institutional">Institutional</option>
                      <option value="private">Private</option>
                    </select>
                    <input
                      type="text"
                      value={newAmountText}
                      onChange={(e) => setNewAmountText(e.target.value)}
                      placeholder="Award Text (e.g. ₹50,000 / year)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="number"
                      value={newAmountNum}
                      onChange={(e) => setNewAmountNum(e.target.value)}
                      placeholder="Numeric Award ₹ (e.g. 50000)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      placeholder="Education Level"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={newStream}
                      onChange={(e) => setNewStream(e.target.value)}
                      placeholder="Course Stream"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      placeholder="State Scope (e.g. All India)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      placeholder="Deadline Date or Cycle Notice"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="url"
                      required
                      value={newOfficialUrl}
                      onChange={(e) => setNewOfficialUrl(e.target.value)}
                      placeholder="Official URL (https://...)"
                      className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                    <select
                      value={newStatus}
                      onChange={(e) =>
                        setNewStatus(e.target.value as 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS')
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    >
                      <option value="NEEDS_REVIEW">NEEDS REVIEW (Default)</option>
                      <option value="VERIFIED">VERIFIED (Primary Evidence Attached)</option>
                      <option value="SUSPICIOUS">SUSPICIOUS</option>
                    </select>
                    <input
                      type="text"
                      value={newEvidence}
                      onChange={(e) => setNewEvidence(e.target.value)}
                      placeholder="Primary Source Evidence Note"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={newSummary}
                      onChange={(e) => setNewSummary(e.target.value)}
                      placeholder="Summary of benefits & eligibility..."
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:col-span-2"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Save Scholarship
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {overview.scholarships.map((sch) => (
                  <div key={sch.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <VerificationBadge status={sch.verificationStatus} />
                          {sch.isArchived && (
                            <span className="text-xs font-semibold text-slate-500">Archived</span>
                          )}
                          {sch.isSample && (
                            <span className="text-xs font-semibold text-amber-700">Sample</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-base font-bold text-slate-900">{sch.title}</h3>
                        <p className="text-xs text-slate-600">
                          {sch.provider} · <span className="font-mono">{sch.officialUrl}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyTarget(sch);
                            setVerifyStatus(sch.verificationStatus);
                            setVerifyReason(sch.verificationReason);
                            setVerifyEvidence(sch.verificationEvidence);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verify / Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveToggle(sch)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          {sch.isArchived ? 'Restore' : 'Archive'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sch)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Deadline:</span>
                        <input
                          type="text"
                          defaultValue={sch.deadlineDate}
                          onBlur={(e) => {
                            if (e.target.value !== sch.deadlineDate) {
                              handleUpdateDeadline(sch, e.target.value);
                            }
                          }}
                          className="rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                        />
                        <span className="text-slate-400">(edit &amp; blur to update &amp; notify)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendDeadlineAlert(sch)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Send Deadline Alert Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SCAM REPORTS */}
          {tab === 'reports' && (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Suspicious Scholarship &amp; Scam Reports
              </h2>
              {overview.scamReports.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                  No scam reports have been submitted yet.
                </div>
              ) : (
                overview.scamReports.map((rep) => (
                  <ScamReportAdminRow key={rep.id} report={rep} onReview={handleReportReview} />
                ))
              )}
            </div>
          )}

          {/* TAB 3: USER ACCOUNTS */}
          {tab === 'users' && (
            <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">State / Level</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.users.map((u) => (
                    <tr key={u.uid}>
                      <td className="px-4 py-3 font-mono text-slate-800">{u.email}</td>
                      <td className="px-4 py-3 text-slate-700">{u.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.state || '—'} · {u.educationLevel || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase text-slate-800">{u.role}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(u.uid, u.role)}
                          className="rounded border border-slate-300 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Set {u.role === 'admin' ? 'Student' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800">{log.actorEmail}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {loading && !overview && (
        <div className="mt-8 text-sm text-slate-500">Loading administrator overview...</div>
      )}

      {/* Verification Decision Modal */}
      {verifyTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleVerifyDecision}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">
              Update Verification Decision
            </h3>
            <p className="mt-1 text-xs text-slate-600">{verifyTarget.title}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Verification Status
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) =>
                    setVerifyStatus(e.target.value as 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS')
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="VERIFIED">VERIFIED (Sufficient official evidence)</option>
                  <option value="NEEDS_REVIEW">NEEDS REVIEW (Missing/unconfirmed details)</option>
                  <option value="SUSPICIOUS">SUSPICIOUS (Impersonation / fraud warning)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Verification Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Primary Source Evidence
                </label>
                <textarea
                  rows={2}
                  required
                  value={verifyEvidence}
                  onChange={(e) => setVerifyEvidence(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Record Decision &amp; Audit Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ScamReportAdminRow: React.FC<{
  report: ScamReport;
  onReview: (id: number, status: string, notes: string) => Promise<void>;
}> = ({ report, onReview }) => {
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.adminNotes || '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{report.reportedTitle}</h3>
          <p className="text-xs text-slate-500">
            Category: {report.category} · Submitted by {report.reporterEmail || 'Anonymous'}
          </p>
          {report.suspiciousUrl && (
            <p className="mt-1 font-mono text-xs text-red-700 break-all">{report.suspiciousUrl}</p>
          )}
        </div>
        <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold">
          {report.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-700">{report.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        >
          <option value="Pending Review">Pending Review</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Confirmed Fraud">Confirmed Fraud</option>
          <option value="Dismissed">Dismissed</option>
        </select>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Administrator investigation notes..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        />
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onReview(report.id, status, notes);
            setSaving(false);
          }}
          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          {saving ? 'Saving...' : 'Update Investigation'}
        </button>
      </div>
    </div>
  );
};
