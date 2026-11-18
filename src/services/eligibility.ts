export type EligibilityOutcome =
  | 'Eligible'
  | 'Potentially Eligible'
  | 'Additional Information Required'
  | 'Not Eligible';

export interface CriterionInput {
  id?: number;
  criterionKey: string;
  label: string;
  operator: string;
  expectedValue: string;
  isMandatory: boolean;
  description: string;
}

export interface ProfileInput {
  state?: string | null;
  educationLevel?: string | null;
  course?: string | null;
  previousPercentage?: string | number | null;
  familyIncomeRange?: string | null;
  exactIncomeInr?: number | null;
  category?: string | null;
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
  status: EligibilityOutcome;
  matchedCount: number;
  missingCount: number;
  mismatchCount: number;
  checks: CriterionEvaluation[];
  disclaimer: string;
}

const INCOME_RANGE_BOUNDS: Record<string, { min: number; max: number }> = {
  'Below 1 Lakh': { min: 0, max: 100000 },
  '1-2.5 Lakhs': { min: 100000, max: 250000 },
  '2.5-5 Lakhs': { min: 250000, max: 500000 },
  '5-8 Lakhs': { min: 500000, max: 800000 },
  'Above 8 Lakhs': { min: 800001, max: 99999999 },
};

function normalizeText(val: string | null | undefined): string {
  return (val || '').trim().toLowerCase();
}

export function evaluateEligibility(
  profile: ProfileInput | null | undefined,
  criteria: CriterionInput[]
): EligibilityResult {
  const safeProfile = profile || {};
  const checks: CriterionEvaluation[] = [];

  for (const criterion of criteria) {
    const key = criterion.criterionKey;
    const expected = criterion.expectedValue;
    const expectedNorm = normalizeText(expected);

    if (key === 'min_percentage') {
      const minPct = Number(expected);
      const studentPct =
        safeProfile.previousPercentage !== null &&
        safeProfile.previousPercentage !== undefined &&
        safeProfile.previousPercentage !== ''
          ? Number(safeProfile.previousPercentage)
          : null;

      if (studentPct === null || Number.isNaN(studentPct)) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `${minPct}% or higher`,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Requires previous academic percentage of at least ${minPct}%. Add your percentage in your student profile to verify.`,
        });
      } else if (studentPct >= minPct) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `${minPct}% or higher`,
          studentValue: `${studentPct}%`,
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: `Your recorded academic percentage (${studentPct}%) meets the ${minPct}% requirement.`,
        });
      } else {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `${minPct}% or higher`,
          studentValue: `${studentPct}%`,
          outcome: 'mismatch',
          isMandatory: criterion.isMandatory,
          explanation: `Your recorded percentage (${studentPct}%) is below the stated ${minPct}% threshold.`,
        });
      }
      continue;
    }

    if (key === 'max_income') {
      const capInr = Number(expected);
      const exactIncome =
        safeProfile.exactIncomeInr !== null &&
        safeProfile.exactIncomeInr !== undefined &&
        !Number.isNaN(Number(safeProfile.exactIncomeInr))
          ? Number(safeProfile.exactIncomeInr)
          : null;
      const incomeLabel = (safeProfile.familyIncomeRange || '').trim();
      const bounds = INCOME_RANGE_BOUNDS[incomeLabel];

      if (exactIncome !== null) {
        if (exactIncome <= capInr) {
          checks.push({
            criterionKey: key,
            label: criterion.label,
            expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
            studentValue: `₹${exactIncome.toLocaleString('en-IN')} / year`,
            outcome: 'match',
            isMandatory: criterion.isMandatory,
            explanation: `Your entered annual income (₹${exactIncome.toLocaleString('en-IN')}) is within the ₹${capInr.toLocaleString('en-IN')} limit.`,
          });
        } else {
          checks.push({
            criterionKey: key,
            label: criterion.label,
            expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
            studentValue: `₹${exactIncome.toLocaleString('en-IN')} / year`,
            outcome: 'mismatch',
            isMandatory: criterion.isMandatory,
            explanation: `Your entered annual income (₹${exactIncome.toLocaleString('en-IN')}) exceeds the ₹${capInr.toLocaleString('en-IN')} annual cap.`,
          });
        }
      } else if (!incomeLabel || !bounds) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Official scheme specifies family annual income up to ₹${capInr.toLocaleString('en-IN')}. Enter your family income to evaluate.`,
        });
      } else if (bounds.max <= capInr) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
          studentValue: incomeLabel,
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: `Your selected income bracket (${incomeLabel}) falls within the ₹${capInr.toLocaleString('en-IN')} annual limit.`,
        });
      } else if (bounds.min <= capInr && bounds.max > capInr) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
          studentValue: incomeLabel,
          outcome: 'info',
          isMandatory: false,
          explanation: `Your selected bracket (${incomeLabel}) overlaps the ₹${capInr.toLocaleString('en-IN')} limit; verify exact figure on your official income certificate.`,
        });
      } else {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: `Up to ₹${capInr.toLocaleString('en-IN')} / year`,
          studentValue: incomeLabel,
          outcome: 'mismatch',
          isMandatory: criterion.isMandatory,
          explanation: `Your selected bracket (${incomeLabel}) exceeds the ₹${capInr.toLocaleString('en-IN')} annual income cap.`,
        });
      }
      continue;
    }

    if (key === 'education_level') {
      const studentLevel = (safeProfile.educationLevel || '').trim();
      const allowedLevels = expectedNorm.split(',').map((s) => s.trim());

      if (!studentLevel) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Requires education level matching: ${expected}. Update your education level in profile.`,
        });
      } else if (
        allowedLevels.includes('all') ||
        allowedLevels.includes('all post-matric') ||
        allowedLevels.some((lvl) => normalizeText(studentLevel).includes(lvl) || lvl.includes(normalizeText(studentLevel)))
      ) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentLevel,
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: `Your education level (${studentLevel}) matches the scheme scope (${expected}).`,
        });
      } else {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentLevel,
          outcome: 'mismatch',
          isMandatory: criterion.isMandatory,
          explanation: `This scheme targets ${expected}, whereas your profile lists ${studentLevel}.`,
        });
      }
      continue;
    }

    if (key === 'state') {
      const studentState = (safeProfile.state || '').trim();
      if (expectedNorm === 'all india') {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: 'All India',
          studentValue: studentState || 'Any Indian State/UT',
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: 'Open to eligible students across all Indian states and union territories.',
        });
      } else if (!studentState) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Domicile or study state requirement: ${expected}. Add your state in your profile to check.`,
        });
      } else if (normalizeText(studentState) === expectedNorm) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentState,
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: `Your domicile state (${studentState}) matches the ${expected} requirement.`,
        });
      } else {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentState,
          outcome: 'mismatch',
          isMandatory: criterion.isMandatory,
          explanation: `Scheme is restricted to ${expected} domicile/students; your profile lists ${studentState}.`,
        });
      }
      continue;
    }

    if (key === 'category') {
      const studentCategory = (safeProfile.category || '').trim();
      const allowedCats = expectedNorm.split(',').map((c) => c.trim());

      if (allowedCats.includes('all categories') || allowedCats.includes('all')) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentCategory || 'Any',
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: 'Open to applicants across all social categories.',
        });
      } else if (!studentCategory) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Scheme targets ${expected}. Provide optional category details only if you wish to evaluate category-specific schemes.`,
        });
      } else if (
        allowedCats.some((c) => normalizeText(studentCategory).includes(c) || c.includes(normalizeText(studentCategory)))
      ) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentCategory,
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: `Your category (${studentCategory}) matches ${expected}.`,
        });
      } else {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentCategory,
          outcome: 'mismatch',
          isMandatory: criterion.isMandatory,
          explanation: `Scheme specifies ${expected}, whereas your profile specifies ${studentCategory}.`,
        });
      }
      continue;
    }

    if (key === 'course') {
      const studentCourse = (safeProfile.course || '').trim();
      if (expectedNorm.includes('all streams') || expectedNorm.includes('all courses')) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentCourse || 'Any recognized course',
          outcome: 'match',
          isMandatory: criterion.isMandatory,
          explanation: 'Applicable across all recognized academic streams.',
        });
      } else if (!studentCourse) {
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: 'Not provided in profile',
          outcome: 'missing',
          isMandatory: criterion.isMandatory,
          explanation: `Requires enrollment in ${expected}. Update your course in your profile to verify.`,
        });
      } else {
        const keywords = expectedNorm.split(/[,/&]+/).map((k) => k.trim()).filter((k) => k.length > 2);
        const courseNorm = normalizeText(studentCourse);
        const matched = keywords.some((kw) => courseNorm.includes(kw)) || courseNorm.includes(expectedNorm);
        checks.push({
          criterionKey: key,
          label: criterion.label,
          expectedValue: expected,
          studentValue: studentCourse,
          outcome: matched ? 'match' : 'info',
          isMandatory: false,
          explanation: matched
            ? `Your course (${studentCourse}) aligns with ${expected}.`
            : `Verify whether "${studentCourse}" falls under the official ${expected} stream list on the scheme guidelines.`,
        });
      }
      continue;
    }

    // Generic informational condition (e.g., gender, disability percentage, board top 20%)
    checks.push({
      criterionKey: key,
      label: criterion.label,
      expectedValue: expected,
      studentValue: 'Confirm against official guidelines',
      outcome: 'info',
      isMandatory: false,
      explanation: criterion.description,
    });
  }

  const mandatoryMismatch = checks.some((c) => c.isMandatory && c.outcome === 'mismatch');
  const anyMismatch = checks.some((c) => c.outcome === 'mismatch');
  const mandatoryMissing = checks.some((c) => c.isMandatory && c.outcome === 'missing');
  const anyInfoOrMissing = checks.some((c) => c.outcome === 'info' || c.outcome === 'missing');

  let status: EligibilityOutcome = 'Eligible';
  if (mandatoryMismatch || anyMismatch) {
    status = 'Not Eligible';
  } else if (mandatoryMissing) {
    status = 'Additional Information Required';
  } else if (anyInfoOrMissing) {
    status = 'Potentially Eligible';
  }

  return {
    status,
    matchedCount: checks.filter((c) => c.outcome === 'match').length,
    missingCount: checks.filter((c) => c.outcome === 'missing').length,
    mismatchCount: checks.filter((c) => c.outcome === 'mismatch').length,
    checks,
    disclaimer:
      'Rule-based eligibility screening is informational only and does not guarantee scholarship selection or award disbursement. Confirm final criteria on the official scheme portal.',
  };
}
