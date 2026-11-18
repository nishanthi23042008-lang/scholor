import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { ScamReport } from '../types';

export const ReportScamPage: React.FC = () => {
  const { user, token } = useAuth();
  const [reportedTitle, setReportedTitle] = useState('');
  const [suspiciousUrl, setSuspiciousUrl] = useState('');
  const [category, setCategory] = useState('Suspicious URL');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [myReports, setMyReports] = useState<ScamReport[]>([]);

  const loadMyReports = async () => {
    if (!user || !token) return;
    try {
      const data = await apiRequest<{ reports: ScamReport[] }>('/api/scam-reports/mine', {}, token);
      setMyReports(data.reports);
    } catch {
      // Ignore silent history fetch errors
    }
  };

  useEffect(() => {
    loadMyReports();
  }, [user, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiRequest<{ message: string; report: ScamReport }>(
        '/api/scam-reports',
        {
          method: 'POST',
          body: JSON.stringify({
            reportedTitle,
            suspiciousUrl,
            category,
            description,
          }),
        },
        token
      );
      setSuccessMsg(res.message);
      setReportedTitle('');
      setSuspiciousUrl('');
      setDescription('');
      if (user) {
        setMyReports((prev) => [res.report, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit scam report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
          <ShieldAlert className="h-4 w-4" />
          STUDENT CYBERSECURITY REPORTING DESK
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Report a Suspicious Scholarship or Scam
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Report fake scholarships, lookalike URLs, fraudulent social media advertisements, or demands for upfront registration/UPI fees. Reports are reviewed confidentially by administrators before any public action.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="scam-title" className="block text-xs font-semibold text-slate-700">
              Scholarship Name or Claimed Organization
            </label>
            <input
              id="scam-title"
              type="text"
              required
              value={reportedTitle}
              onChange={(e) => setReportedTitle(e.target.value)}
              placeholder="e.g. National Student Laptop Grant Forward"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="scam-category" className="block text-xs font-semibold text-slate-700">
              Incident Category
            </label>
            <select
              id="scam-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="Fake scholarship">Fake scholarship</option>
              <option value="Suspicious URL">Suspicious URL</option>
              <option value="Fraudulent advertisement">Fraudulent advertisement</option>
              <option value="Request for payment">Request for payment / UPI fee</option>
              <option value="Impersonation">Government / institution impersonation</option>
              <option value="Suspicious message">Suspicious WhatsApp / SMS message</option>
            </select>
          </div>

          <div>
            <label htmlFor="scam-url" className="block text-xs font-semibold text-slate-700">
              Suspicious URL (Optional)
            </label>
            <input
              id="scam-url"
              type="text"
              value={suspiciousUrl}
              onChange={(e) => setSuspiciousUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="scam-desc" className="block text-xs font-semibold text-slate-700">
              What Happened? (Include details without pasting your own passwords or OTPs)
            </label>
            <textarea
              id="scam-desc"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the claim, payment demand, or impersonation pattern..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] w-full rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? 'Submitting Report...' : 'Submit Confidential Scam Report'}
          </button>
        </form>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Common Red Flags</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              <li>Requests for UPI transfer, processing fees, or security deposits before disbursement.</li>
              <li>Non-government domains (.xyz, .top, .blogspot) mimicking NSP, AICTE, or state portals.</li>
              <li>Urgent countdown timers sent via unverified WhatsApp forwards or Telegram channels.</li>
              <li>Forms asking for net-banking passwords, ATM PINs, or Aadhaar OTPs.</li>
            </ul>
          </div>

          {user && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-bold text-slate-900">Your Submitted Reports</h2>
              {myReports.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No scam reports submitted yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {myReports.map((r) => (
                    <div key={r.id} className="border-b border-slate-100 pb-2 text-xs last:border-0">
                      <p className="font-semibold text-slate-900">{r.reportedTitle}</p>
                      <p className="text-slate-600">
                        {r.category} · Status: <strong>{r.status}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
