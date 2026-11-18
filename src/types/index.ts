export type VerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS';
export type ScanVerdict = 'GREEN' | 'YELLOW' | 'RED';

export interface ScholarshipSource {
  id: number;
  scholarshipId: number;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  credibilityNote: string;
  checkedAt: string;
}

export interface EligibilityCriterion {
  id: number;
  scholarshipId: number;
  criterionKey: string;
  label: string;
  operator: string;
  expectedValue: string;
  isMandatory: boolean;
  description: string;
}

export interface ScholarshipDocument {
  id: number;
  scholarshipId: number;
  documentName: string;
  purposeReason: string;
  isMandatory: boolean;
  formatHint: string;
}

export interface VerificationHistoryEntry {
  id: number;
  scholarshipId: number;
  previousStatus: string;
  newStatus: string;
  reason: string;
  evidence: string;
  actorUid: string;
  actorEmail: string;
  createdAt: string;
}

export interface CriterionEvaluation {
  criterionKey: string;
  label: string;
  expectedValue: string;
  studentValue: string;
  outcome: 'match' | 'missing' | 'mismatch' | 'info';
  isMandatory: boolean;
  explanation: string;
}

export interface EligibilityResult {
  status:
    | 'Eligible'
    | 'Potentially Eligible'
    | 'Additional Information Required'
    | 'Not Eligible';
  matchedCount: number;
  missingCount: number;
  mismatchCount: number;
  checks: CriterionEvaluation[];
  disclaimer: string;
}

export interface Scholarship {
  id: number;
  slug: string;
  title: string;
  provider: string;
  providerType: string;
  amountText: string;
  amountNumeric: number;
  educationLevel: string;
  courseStream: string;
  stateScope: string;
  maxIncomeInr: number | null;
  minPercentage: string | null;
  categoryEligibility: string;
  deadlineDate: string;
  officialUrl: string;
  applicationUrl: string;
  description: string;
  summary: string;
  verificationStatus: VerificationStatus;
  verificationReason: string;
  verificationEvidence: string;
  lastCheckedAt: string;
  isArchived: boolean;
  isSample: boolean;
  sources?: ScholarshipSource[];
  criteria?: EligibilityCriterion[];
  documents?: ScholarshipDocument[];
  verificationHistory?: VerificationHistoryEntry[];
  isBookmarked?: boolean;
  eligibility?: EligibilityResult | null;
}

export interface Profile {
  id: number;
  uid: string;
  email: string;
  role: 'student' | 'admin';
  fullName: string;
  phone: string;
  state: string;
  district: string;
  educationLevel: string;
  institution: string;
  course: string;
  gdgUrl: string;
  academicYear: string;
  previousPercentage: string | null;
  familyIncomeRange: string;
  category: string;
  preferences: string[];
  consentAccepted: boolean;
  emailReminders: boolean;
  deadlineReminders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRecord {
  id: number;
  userUid: string;
  scholarshipId: number;
  status: string;
  applicationRef: string;
  personalNotes: string;
  history: Array<{ status: string; note: string; changedAt: string }>;
  createdAt: string;
  updatedAt: string;
  scholarship?: Scholarship | null;
}

export interface NotificationItem {
  id: number;
  userUid: string;
  type: string;
  title: string;
  message: string;
  linkTarget: string;
  isRead: boolean;
  createdAt: string;
}

export interface SecurityScanResult {
  id?: number;
  targetUrl: string;
  normalizedHost: string;
  verdict: ScanVerdict;
  reasons: string[];
  heuristicFindings: Array<{
    check: string;
    severity: 'pass' | 'warning' | 'danger' | 'info';
    detail: string;
  }>;
  safeBrowsingStatus: string;
  virusTotalStatus: string;
  redirectChain: string[];
  httpsAvailable: boolean;
  limitationsNote: string;
  scannedAt: string;
}

export interface ScamReport {
  id: number;
  reporterUid: string | null;
  reporterEmail: string;
  scholarshipId: number | null;
  reportedTitle: string;
  suspiciousUrl: string;
  category: string;
  description: string;
  status: string;
  adminNotes: string;
  reviewedByUid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface DeadlineSubscription {
  id: number;
  email: string;
  userUid: string | null;
  educationLevel: string;
  courseStream: string;
  stateScope: string;
  isActive: boolean;
  welcomeEmailSent: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

