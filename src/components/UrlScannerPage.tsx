import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { SecurityScanResult } from '../types';
import { ScanVerdictBadge } from './StatusBadge';

interface UrlScannerPageProps {
  initialUrl?: string;
}

export const UrlScannerPage: React.FC<UrlScannerPageProps> = ({ initialUrl = '' }) => {
  const { user, token } = useAuth();
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SecurityScanResult | null>(null);
  const [history, setHistory] = useState<SecurityScanResult[]>([]);

  // Gemini explanation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (initialUrl) setUrlInput(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (!user || !token) return;
    apiRequest<{ scans: SecurityScanResult[] }>('/api/scanner/history', {}, token)
      .then((d) => setHistory(d.scans))
      .catch(() => {});
  }, [user, token]);

  const runScan = async (target?: string) => {
    const urlToScan = (target ?? urlInput).trim();
    if (!urlToScan) {
      setError('Paste a scholarship application URL to inspect.');
      return;
    }
    setScanning(true);
    setError('');
    setAiExplanation('');
    setAiError('');
    try {
      const data = await apiRequest<{ scan: SecurityScanResult }>(
        '/api/scanner/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ url: urlToScan }),
        },
        token
      );
      setResult(data.scan);
      if (user) {
        setHistory((prev) => [data.scan, ...prev].slice(0, 20));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runScan();
  };

  const explainWithAi = async () => {
    if (!result) return;
    setAiLoading(true);
    setAiError('');
    setAiExplanation('');
    try {
      const data = await apiRequest<{ explanation: string }>(
        '/api/ai/explain',
        {
          method: 'POST',
          body: JSON.stringify({
            mode: 'url_scan',
            scanResult: result,
          }),
        },
        token
      );
      setAiExplanation(data.explanation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate explanation.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-slate-50">
      {/* Dark Navy Cybersecurity Header */}
      <section className="bg-[#0B162C] py-12 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Lock className="h-4 w-4" />
            SERVER-SIDE SSRF-SAFE URL INSPECTION
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
            Scholarship URL Security Scanner
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Inspect any scholarship link before clicking or submitting personal information. Checks typosquatting, brand impersonation, HTTPS transport, redirects, Google Safe Browsing, and VirusTotal intelligence.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://scholarships.gov.in"
                className="min-h-[46px] w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={scanning}
              className="min-h-[46px] rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-60 whitespace-nowrap"
            >
              {scanning ? 'Inspecting URL...' : 'Analyze URL'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Test examples:</span>
            <button
              type="button"
              onClick={() => {
                setUrlInput('https://scholarships.gov.in');
                runScan('https://scholarships.gov.in');
              }}
              className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-slate-200 hover:bg-slate-700"
            >
              https://scholarships.gov.in
            </button>
            <button
              type="button"
              onClick={() => {
                const samplePhish = 'http://scholarships-gov-in.example.xyz/claim-fee';
                setUrlInput(samplePhish);
                runScan(samplePhish);
              }}
              className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-amber-200 hover:bg-slate-700"
            >
              http://scholarships-gov-in.example.xyz/claim-fee
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <ScanVerdictBadge verdict={result.verdict} />
                  <p className="mt-3 font-mono text-sm font-semibold text-slate-900 break-all">
                    {result.targetUrl}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-slate-500 tabular-nums">
                    <Clock className="h-3.5 w-3.5" />
                    Scanned: {new Date(result.scannedAt).toLocaleString('en-IN')} · Host: {result.normalizedHost}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={explainWithAi}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                  {aiLoading ? 'Explaining...' : 'Explain Indicators with AI'}
                </button>
              </div>

              {/* Understandable Reasons */}
              <div className="mt-5">
                <h2 className="text-sm font-bold text-slate-900">Key Assessment Reasons</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {result.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {aiError && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {aiError}
                </div>
              )}

              {aiExplanation && (
                <div className="mt-4 whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm leading-relaxed text-slate-800">
                  {aiExplanation}
                </div>
              )}

              {/* Detailed Inspection Breakdown */}
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-900">
                  Technical &amp; Threat Intelligence Checks
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {result.heuristicFindings.map((f, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{f.check}</span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            f.severity === 'pass'
                              ? 'text-emerald-700'
                              : f.severity === 'warning'
                                ? 'text-amber-700'
                                : f.severity === 'danger'
                                  ? 'text-red-700'
                                  : 'text-slate-600'
                          }`}
                        >
                          {f.severity === 'pass' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {f.severity === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
                          {f.severity === 'danger' && <ShieldAlert className="h-3.5 w-3.5" />}
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-slate-600">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redirect Chain */}
              {result.redirectChain && result.redirectChain.length > 0 && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xs font-bold text-slate-900">Observed URL Redirect Path</h3>
                  <div className="mt-2 space-y-1 font-mono text-xs text-slate-700">
                    {result.redirectChain.map((hop, idx) => (
                      <div key={idx} className="break-all">
                        Hop {idx + 1}: {hop}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Security Disclaimer */}
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
                <strong>Scanning Limitations &amp; Safety Notice:</strong> {result.limitationsNote}
              </div>
            </div>
          </div>
        )}

        {/* Recent User Scan History */}
        {user && history.length > 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">Your Recent URL Scans</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono font-semibold text-slate-800">
                      {item.targetUrl}
                    </p>
                    <p className="mt-0.5 font-mono text-slate-500 tabular-nums">
                      {new Date(item.scannedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <ScanVerdictBadge verdict={item.verdict} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
