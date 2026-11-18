import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ScanVerdict, VerificationStatus } from '../types';

export const VerificationBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        VERIFIED
      </span>
    );
  }
  if (status === 'NEEDS_REVIEW') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        NEEDS REVIEW
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 whitespace-nowrap shrink-0">
      <ShieldAlert className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
      SUSPICIOUS
    </span>
  );
};

export const ScanVerdictBadge: React.FC<{ verdict: ScanVerdict }> = ({ verdict }) => {
  if (verdict === 'GREEN') {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        GREEN · No known threats detected
      </span>
    );
  }
  if (verdict === 'YELLOW') {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 whitespace-nowrap shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
        YELLOW · Potentially suspicious characteristics
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 whitespace-nowrap shrink-0">
      <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
      RED · Known malicious or phishing indicators
    </span>
  );
};
