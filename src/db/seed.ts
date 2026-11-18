import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  scholarships,
  scholarshipSources,
  eligibilityCriteria,
  scholarshipDocuments,
  verificationHistory,
} from './schema.ts';

let seededOnce = false;
let seedingPromise: Promise<void> | null = null;

interface SeedRecord {
  scholarship: typeof scholarships.$inferInsert;
  sources: Array<Omit<typeof scholarshipSources.$inferInsert, 'scholarshipId'>>;
  criteria: Array<Omit<typeof eligibilityCriteria.$inferInsert, 'scholarshipId'>>;
  documents: Array<Omit<typeof scholarshipDocuments.$inferInsert, 'scholarshipId'>>;
}

const SEED_RECORDS: SeedRecord[] = [
  {
    scholarship: {
      slug: 'pm-usp-central-sector-scheme',
      title: 'PM-USP Central Sector Scheme of Scholarship for College and University Students',
      provider: 'Department of Higher Education, Ministry of Education (Govt. of India)',
      providerType: 'government',
      amountText: '₹12,000 – ₹20,000 per annum',
      amountNumeric: 20000,
      educationLevel: 'Undergraduate, Postgraduate',
      courseStream: 'All Streams',
      stateScope: 'All India',
      maxIncomeInr: 450000,
      minPercentage: '80.00',
      categoryEligibility: 'All Categories',
      deadlineDate: 'Check Official NSP Cycle',
      officialUrl: 'https://scholarships.gov.in',
      applicationUrl: 'https://scholarships.gov.in',
      description:
        'Merit-cum-means central sector scholarship awarded to students above the 80th percentile in Class 12 board examinations pursuing regular degree courses in recognized colleges/universities.',
      summary:
        'Provides ₹12,000/year for graduation (first 3 years) and ₹20,000/year for post-graduation or 4th/5th year of technical courses via Direct Benefit Transfer (DBT).',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Confirmed via official Ministry of Education scheme guidelines and National Scholarship Portal (scholarships.gov.in).',
      verificationEvidence:
        'Cross-checked against Ministry of Education PM-USP portal documentation and NSP official .gov.in scheme listing.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'National Scholarship Portal (NSP)',
        sourceUrl: 'https://scholarships.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official Government of India single-window scholarship portal (.gov.in).',
      },
      {
        sourceName: 'Ministry of Education — Higher Education Division',
        sourceUrl: 'https://www.education.gov.in/scholarships-education-loan-0',
        sourceType: 'gazette',
        credibilityNote: 'Official central ministry scheme notification page.',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Undergraduate, Postgraduate',
        isMandatory: true,
        description: 'Must be enrolled in a recognized regular degree course.',
      },
      {
        criterionKey: 'min_percentage',
        label: 'Class 12 / Qualifying Marks',
        operator: 'gte',
        expectedValue: '80',
        isMandatory: true,
        description: 'Above 80th percentile in relevant Class 12 State/Central board examination.',
      },
      {
        criterionKey: 'max_income',
        label: 'Gross Parental Annual Income',
        operator: 'lte',
        expectedValue: '450000',
        isMandatory: true,
        description: 'Gross annual parental/family income must not exceed ₹4.5 Lakh.',
      },
      {
        criterionKey: 'state',
        label: 'State Scope',
        operator: 'eq',
        expectedValue: 'All India',
        isMandatory: true,
        description: 'Open across all Indian states and union territories.',
      },
    ],
    documents: [
      {
        documentName: 'Class 12 Board Marksheet',
        purposeReason: 'Verifies 80th percentile merit ranking from the qualifying board exam.',
        isMandatory: true,
        formatHint: 'Board-issued marksheet / DigiLocker copy',
      },
      {
        documentName: 'Family Annual Income Certificate',
        purposeReason: 'Confirms gross parental income is within the ₹4.5 Lakh ceiling.',
        isMandatory: true,
        formatHint: 'Issued by competent revenue authority',
      },
      {
        documentName: 'Institution Bonafide & Fee Receipt',
        purposeReason: 'Proves active full-time enrollment in a recognized college/university.',
        isMandatory: true,
        formatHint: 'Signed/sealed by institution head',
      },
      {
        documentName: 'DBT-Enabled Bank Account Details',
        purposeReason: 'Required on NSP for direct government disbursement to student account.',
        isMandatory: true,
        formatHint: 'Student name active bank passbook / DBT seeded status',
      },
    ],
  },
  {
    scholarship: {
      slug: 'aicte-pragati-scholarship-girls',
      title: 'AICTE Pragati Scholarship Scheme for Girl Students (Technical Degree/Diploma)',
      provider: 'All India Council for Technical Education (AICTE)',
      providerType: 'government',
      amountText: '₹50,000 per annum',
      amountNumeric: 50000,
      educationLevel: 'Diploma, Undergraduate',
      courseStream: 'Engineering & Technology',
      stateScope: 'All India',
      maxIncomeInr: 800000,
      minPercentage: null,
      categoryEligibility: 'All Categories',
      deadlineDate: 'Check Official NSP Cycle',
      officialUrl: 'https://www.aicte-india.org/schemes/students-development-schemes/Pragati',
      applicationUrl: 'https://scholarships.gov.in',
      description:
        'AICTE scheme supporting girl students admitted to first year or second year (lateral entry) of AICTE-approved technical diploma or degree programmes.',
      summary:
        'Offers ₹50,000 per annum toward college fees, computer purchase, books, and equipment for up to two girl children per family.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Verified against AICTE official portal (aicte-india.org) and National Scholarship Portal guidelines.',
      verificationEvidence:
        'Official AICTE Pragati scheme PDF and NSP onboarding documentation verified.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'AICTE Official Schemes Portal',
        sourceUrl: 'https://www.aicte-india.org/schemes/students-development-schemes/Pragati',
        sourceType: 'official_portal',
        credibilityNote: 'Statutory technical education council of India.',
      },
      {
        sourceName: 'National Scholarship Portal (NSP)',
        sourceUrl: 'https://scholarships.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official application submission portal for AICTE Pragati.',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Diploma, Undergraduate',
        isMandatory: true,
        description: 'Admitted to 1st year or 2nd year (lateral) of an AICTE-approved Technical Diploma or Degree.',
      },
      {
        criterionKey: 'course',
        label: 'Course Stream',
        operator: 'in',
        expectedValue: 'Engineering & Technology, Technical',
        isMandatory: true,
        description: 'Must be an AICTE-approved technical institution programme.',
      },
      {
        criterionKey: 'max_income',
        label: 'Family Annual Income',
        operator: 'lte',
        expectedValue: '800000',
        isMandatory: true,
        description: 'Annual family income from all sources must not exceed ₹8 Lakh.',
      },
      {
        criterionKey: 'other',
        label: 'Girl Student Eligibility',
        operator: 'info',
        expectedValue: 'Female candidates (max 2 per family)',
        isMandatory: false,
        description: 'Applicable specifically to girl students admitted via centralized state/national counseling.',
      },
    ],
    documents: [
      {
        documentName: 'Class 10 & 12 / ITI Marksheets',
        purposeReason: 'Used to prepare merit ranking by qualifying examination score.',
        isMandatory: true,
        formatHint: 'Attested marksheet PDFs',
      },
      {
        documentName: 'Admission Allotment / Bonafide Letter',
        purposeReason: 'Confirms admission in an AICTE-approved technical programme.',
        isMandatory: true,
        formatHint: 'Issued by college/counseling authority',
      },
      {
        documentName: 'Family Income Certificate',
        purposeReason: 'Verifies parental annual income does not exceed ₹8 Lakh.',
        isMandatory: true,
        formatHint: 'Tehsildar / competent authority certificate',
      },
      {
        documentName: 'Tuition Fee Receipt',
        purposeReason: 'Establishes active semester/year fee enrollment status.',
        isMandatory: true,
        formatHint: 'Official college receipt',
      },
    ],
  },
  {
    scholarship: {
      slug: 'aicte-saksham-scholarship-divyang',
      title: 'AICTE Saksham Scholarship Scheme for Specially Abled Students',
      provider: 'All India Council for Technical Education (AICTE)',
      providerType: 'government',
      amountText: '₹50,000 per annum',
      amountNumeric: 50000,
      educationLevel: 'Diploma, Undergraduate',
      courseStream: 'Engineering & Technology',
      stateScope: 'All India',
      maxIncomeInr: 800000,
      minPercentage: null,
      categoryEligibility: 'PwD',
      deadlineDate: 'Check Official NSP Cycle',
      officialUrl: 'https://www.aicte-india.org/schemes/students-development-schemes/Saksham',
      applicationUrl: 'https://scholarships.gov.in',
      description:
        'Dedicated AICTE scheme supporting specially-abled (PwD with >= 40% disability) students pursuing technical diploma or degree courses.',
      summary:
        'Provides ₹50,000/year toward academic fees and assistive equipment for eligible specially-abled technical students.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Verified against AICTE Saksham official scheme circular and NSP portal.',
      verificationEvidence:
        'Official AICTE Saksham guidelines and NSP scheme directory verified.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'AICTE Saksham Scheme Page',
        sourceUrl: 'https://www.aicte-india.org/schemes/students-development-schemes/Saksham',
        sourceType: 'official_portal',
        credibilityNote: 'Official AICTE statutory portal.',
      },
      {
        sourceName: 'National Scholarship Portal (NSP)',
        sourceUrl: 'https://scholarships.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official application portal.',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Diploma, Undergraduate',
        isMandatory: true,
        description: 'Enrolled in AICTE-approved Technical Diploma or Degree course.',
      },
      {
        criterionKey: 'max_income',
        label: 'Family Annual Income',
        operator: 'lte',
        expectedValue: '800000',
        isMandatory: true,
        description: 'Annual family income not exceeding ₹8 Lakh.',
      },
      {
        criterionKey: 'category',
        label: 'Disability Eligibility',
        operator: 'in',
        expectedValue: 'PwD',
        isMandatory: true,
        description: 'Requires valid UDID / disability certificate showing at least 40% disability.',
      },
    ],
    documents: [
      {
        documentName: 'Disability Certificate / UDID Card',
        purposeReason: 'Confirms benchmark disability of 40% or more as mandated by the scheme.',
        isMandatory: true,
        formatHint: 'Government medical board / UDID portal copy',
      },
      {
        documentName: 'Income Certificate',
        purposeReason: 'Verifies family annual income is at or below ₹8 Lakh.',
        isMandatory: true,
        formatHint: 'Competent state authority',
      },
      {
        documentName: 'Qualifying Marksheets & Bonafide',
        purposeReason: 'Establishes technical institution enrollment and merit.',
        isMandatory: true,
        formatHint: 'Institution-attested copies',
      },
    ],
  },
  {
    scholarship: {
      slug: 'dst-inspire-she-scholarship',
      title: 'INSPIRE Scholarship for Higher Education (SHE)',
      provider: 'Department of Science & Technology (DST), Govt. of India',
      providerType: 'government',
      amountText: '₹80,000 per annum (incl. mentorship)',
      amountNumeric: 80000,
      educationLevel: 'Undergraduate, Postgraduate',
      courseStream: 'Science & Research',
      stateScope: 'All India',
      maxIncomeInr: null,
      minPercentage: '85.00',
      categoryEligibility: 'All Categories',
      deadlineDate: 'Check Official INSPIRE Portal',
      officialUrl: 'https://online-inspire.gov.in',
      applicationUrl: 'https://online-inspire.gov.in',
      description:
        'Aims to attract meritorious youth to study basic and natural sciences (Physics, Chemistry, Mathematics, Biology, etc.) at B.Sc., B.S., and Integrated M.Sc. levels.',
      summary:
        'Provides ₹60,000 annual scholarship plus ₹20,000 summer research mentorship grant for top 1% Class 12 students or JEE/NEET rankers studying natural sciences.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Confirmed via Department of Science and Technology official INSPIRE portal (online-inspire.gov.in).',
      verificationEvidence:
        'DST INSPIRE SHE official scheme guidelines and government portal verified.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'DST INSPIRE Online Portal',
        sourceUrl: 'https://online-inspire.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official Department of Science & Technology portal (.gov.in).',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Undergraduate, Postgraduate',
        isMandatory: true,
        description: 'Enrolled in B.Sc., B.S., or Integrated M.Sc./M.S. in basic/natural sciences.',
      },
      {
        criterionKey: 'course',
        label: 'Course Stream',
        operator: 'in',
        expectedValue: 'Science & Research, Physics, Chemistry, Mathematics, Biology',
        isMandatory: true,
        description: 'Must be an eligible natural/basic science discipline listed by DST.',
      },
      {
        criterionKey: 'min_percentage',
        label: 'Top 1% Board / Rank Merit',
        operator: 'gte',
        expectedValue: '85',
        isMandatory: false,
        description: 'Top 1% in Class 12 board exam (exact cut-off varies by state board) or top 10,000 JEE/NEET rank.',
      },
    ],
    documents: [
      {
        documentName: 'Class 12 Marksheet & Advisory Note',
        purposeReason: 'Confirms Top 1% board eligibility or national competitive exam rank.',
        isMandatory: true,
        formatHint: 'Board marksheet / Rank card',
      },
      {
        documentName: 'Endorsement Form from Principal/Dean',
        purposeReason: 'Verifies current enrollment in an eligible Basic/Natural Science course.',
        isMandatory: true,
        formatHint: 'DST prescribed Endorsement Certificate format',
      },
      {
        documentName: 'SBI Bank Passbook Copy',
        purposeReason: 'Required by DST INSPIRE DBT disbursement rules.',
        isMandatory: true,
        formatHint: 'Student single-holder account passbook',
      },
    ],
  },
  {
    scholarship: {
      slug: 'ugc-ishan-uday-ner',
      title: 'Ishan Uday Special Scholarship Scheme for North Eastern Region',
      provider: 'University Grants Commission (UGC)',
      providerType: 'government',
      amountText: '₹5,400 – ₹7,800 per month',
      amountNumeric: 78000,
      educationLevel: 'Undergraduate',
      courseStream: 'All Streams',
      stateScope: 'North East Region (Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)',
      maxIncomeInr: 450000,
      minPercentage: null,
      categoryEligibility: 'All Categories',
      deadlineDate: 'Check Official NSP Cycle',
      officialUrl: 'https://www.ugc.gov.in',
      applicationUrl: 'https://scholarships.gov.in',
      description:
        'UGC special scholarship promoting higher education access for students domiciled in the North Eastern Region pursuing general, technical, or medical undergraduate degrees.',
      summary:
        'Monthly fellowship of ₹5,400 for general degree courses and ₹7,800 for technical/medical/professional degrees.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Verified against official UGC portal and NSP scheme directory.',
      verificationEvidence:
        'UGC official scheme notification and NSP NER section verified.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'National Scholarship Portal — UGC Section',
        sourceUrl: 'https://scholarships.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official central portal hosting UGC Ishan Uday applications.',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Undergraduate',
        isMandatory: true,
        description: 'Must be admitted to 1st year of a recognized undergraduate degree.',
      },
      {
        criterionKey: 'max_income',
        label: 'Parental Annual Income',
        operator: 'lte',
        expectedValue: '450000',
        isMandatory: true,
        description: 'Parental income from all sources must not exceed ₹4.5 Lakh/year.',
      },
      {
        criterionKey: 'other',
        label: 'Domicile Requirement',
        operator: 'info',
        expectedValue: 'NER State Domicile',
        isMandatory: false,
        description: 'Applicant must hold domicile of one of the 8 North Eastern states.',
      },
    ],
    documents: [
      {
        documentName: 'NER Domicile Certificate',
        purposeReason: 'Establishes permanent residency in one of the 8 North Eastern states.',
        isMandatory: true,
        formatHint: 'Issued by competent state authority',
      },
      {
        documentName: 'Annual Family Income Certificate',
        purposeReason: 'Verifies parental income is below ₹4.5 Lakh per annum.',
        isMandatory: true,
        formatHint: 'Official revenue authority certificate',
      },
      {
        documentName: 'Joining Report & Admission Proof',
        purposeReason: 'Verifies regular full-time undergraduate enrollment.',
        isMandatory: true,
        formatHint: 'Signed by Registrar / Principal',
      },
    ],
  },
  {
    scholarship: {
      slug: 'mahadbt-post-matric-maharashtra',
      title: 'Maharashtra MahaDBT Post-Matric Scholarship Schemes',
      provider: 'Government of Maharashtra (Social Justice & Tribal/OBC Welfare)',
      providerType: 'government',
      amountText: 'Tuition & Exam Fee Reimbursement + Maintenance',
      amountNumeric: 60000,
      educationLevel: 'Diploma, Undergraduate, Postgraduate',
      courseStream: 'All Streams',
      stateScope: 'Maharashtra',
      maxIncomeInr: 250000,
      minPercentage: null,
      categoryEligibility: 'SC, ST, OBC-NCL, EWS',
      deadlineDate: 'Check Official MahaDBT Portal',
      officialUrl: 'https://mahadbt.maharashtra.gov.in',
      applicationUrl: 'https://mahadbt.maharashtra.gov.in',
      description:
        'State government DBT portal unifying post-matric tuition reimbursement and maintenance scholarships for domiciled Maharashtra students across approved categories.',
      summary:
        'Covers tuition/exam fee reimbursement and monthly maintenance allowances depending on specific MahaDBT department scheme and income criteria.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Verified via Government of Maharashtra official MahaDBT portal (mahadbt.maharashtra.gov.in).',
      verificationEvidence:
        'Official .gov.in portal domain and Maharashtra state scheme directory checked.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'MahaDBT Official Portal',
        sourceUrl: 'https://mahadbt.maharashtra.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official Government of Maharashtra Direct Benefit Transfer portal.',
      },
    ],
    criteria: [
      {
        criterionKey: 'state',
        label: 'Domicile State',
        operator: 'eq',
        expectedValue: 'Maharashtra',
        isMandatory: true,
        description: 'Student must be a domicile of Maharashtra.',
      },
      {
        criterionKey: 'max_income',
        label: 'Family Annual Income',
        operator: 'lte',
        expectedValue: '250000',
        isMandatory: true,
        description: 'Income cap is ₹2.5 Lakh for SC/ST schemes (varies up to ₹8 Lakh for EBC/OBC freeships).',
      },
      {
        criterionKey: 'category',
        label: 'Eligible Categories',
        operator: 'in',
        expectedValue: 'SC, ST, OBC-NCL, EWS',
        isMandatory: true,
        description: 'Specific MahaDBT sub-schemes apply per social/economic category.',
      },
    ],
    documents: [
      {
        documentName: 'Maharashtra Domicile Certificate',
        purposeReason: 'Confirms eligibility under Maharashtra state welfare department rules.',
        isMandatory: true,
        formatHint: 'Aaple Sarkar / MahaOnline issued copy',
      },
      {
        documentName: 'Income & Caste/EWS Certificate',
        purposeReason: 'Determines exact fee waiver and maintenance allowance slab.',
        isMandatory: true,
        formatHint: 'Digitally signed state certificate',
      },
      {
        documentName: 'CAP Allotment / Bonafide Certificate',
        purposeReason: 'Verifies admission through centralized counseling where applicable.',
        isMandatory: true,
        formatHint: 'College-issued admission record',
      },
    ],
  },
  {
    scholarship: {
      slug: 'karnataka-ssp-post-matric',
      title: 'Karnataka State Scholarship Portal (SSP) Post-Matric Scholarship',
      provider: 'Centre for e-Governance, Government of Karnataka',
      providerType: 'government',
      amountText: 'Fee Reimbursement & Vidyasiri Support',
      amountNumeric: 45000,
      educationLevel: 'Diploma, Undergraduate, Postgraduate',
      courseStream: 'All Streams',
      stateScope: 'Karnataka',
      maxIncomeInr: 250000,
      minPercentage: null,
      categoryEligibility: 'SC, ST, OBC-NCL, Minority',
      deadlineDate: 'Check Official SSP Portal',
      officialUrl: 'https://ssp.postmatric.karnataka.gov.in',
      applicationUrl: 'https://ssp.postmatric.karnataka.gov.in',
      description:
        'Unified Government of Karnataka post-matric scholarship platform covering Social Welfare, Backward Classes (Vidyasiri), and Minority Welfare schemes.',
      summary:
        'Provides post-matric fee concession and hostel/maintenance assistance for eligible students domiciled in Karnataka.',
      verificationStatus: 'VERIFIED',
      verificationReason:
        'Confirmed via official Government of Karnataka SSP domain (ssp.postmatric.karnataka.gov.in).',
      verificationEvidence:
        'Official Karnataka .gov.in portal verified.',
      isSample: false,
    },
    sources: [
      {
        sourceName: 'Karnataka SSP Official Portal',
        sourceUrl: 'https://ssp.postmatric.karnataka.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Official Government of Karnataka portal.',
      },
    ],
    criteria: [
      {
        criterionKey: 'state',
        label: 'Domicile State',
        operator: 'eq',
        expectedValue: 'Karnataka',
        isMandatory: true,
        description: 'Applicant must be domiciled in Karnataka.',
      },
      {
        criterionKey: 'max_income',
        label: 'Family Annual Income',
        operator: 'lte',
        expectedValue: '250000',
        isMandatory: true,
        description: 'Standard post-matric income ceiling of ₹2.5 Lakh (varies by specific department).',
      },
      {
        criterionKey: 'category',
        label: 'Eligible Categories',
        operator: 'in',
        expectedValue: 'SC, ST, OBC-NCL, Minority',
        isMandatory: true,
        description: 'Applicable across Social Welfare, Backward Classes, and Minority categories.',
      },
    ],
    documents: [
      {
        documentName: 'RD Number Caste & Income Certificate',
        purposeReason: 'Automatically verified via Karnataka NadaKacheri e-governance database.',
        isMandatory: true,
        formatHint: 'Valid RD Certificate Number',
      },
      {
        documentName: 'SATS / University Registration Number',
        purposeReason: 'Links active institutional enrollment directly on SSP.',
        isMandatory: true,
        formatHint: 'College/University admission ID',
      },
    ],
  },
  {
    scholarship: {
      slug: 'sample-corporate-stem-fellowship-review',
      title: '[Sample Record] Regional Private STEM Merit Grant (Pending Source Verification)',
      provider: 'Sample Foundation Trust (Demonstration Record)',
      providerType: 'private',
      amountText: '₹35,000 one-time grant',
      amountNumeric: 35000,
      educationLevel: 'Undergraduate',
      courseStream: 'Engineering & Technology',
      stateScope: 'All India',
      maxIncomeInr: 600000,
      minPercentage: '75.00',
      categoryEligibility: 'All Categories',
      deadlineDate: 'Pending Confirmation',
      officialUrl: 'https://example.org/stem-grant-sample',
      applicationUrl: 'https://example.org/stem-grant-sample/apply',
      description:
        'Sample demonstration listing showing how ScholarShield flags opportunities with incomplete official documentation as NEEDS REVIEW until an administrator verifies primary evidence.',
      summary:
        'Demonstration record illustrating the NEEDS REVIEW workflow when secondary announcements lack corroborating primary source evidence.',
      verificationStatus: 'NEEDS_REVIEW',
      verificationReason:
        'Missing primary official gazette or audited foundation circular for the current academic cycle.',
      verificationEvidence:
        'Only unverified secondary announcement submitted; awaiting administrator review of primary source.',
      isSample: true,
    },
    sources: [
      {
        sourceName: 'Community Submission (Sample)',
        sourceUrl: 'https://example.org/stem-grant-sample',
        sourceType: 'community',
        credibilityNote: 'Sample placeholder source awaiting administrator verification.',
      },
    ],
    criteria: [
      {
        criterionKey: 'education_level',
        label: 'Academic Level',
        operator: 'in',
        expectedValue: 'Undergraduate',
        isMandatory: true,
        description: 'Undergraduate STEM students.',
      },
      {
        criterionKey: 'min_percentage',
        label: 'Academic Score',
        operator: 'gte',
        expectedValue: '75',
        isMandatory: true,
        description: 'Minimum 75% in prior academic year.',
      },
    ],
    documents: [
      {
        documentName: 'Latest Academic Marksheet',
        purposeReason: 'Confirms minimum 75% merit criteria.',
        isMandatory: true,
        formatHint: 'Official transcript',
      },
    ],
  },
  {
    scholarship: {
      slug: 'sample-suspicious-fee-scheme-alert',
      title: '[Sample Scam Alert] "PM Instant Scholarship UPI Registration" Lookalike',
      provider: 'Unverified Third-Party Domain (Demonstration Alert)',
      providerType: 'private',
      amountText: 'Claims ₹1,00,000 instant grant',
      amountNumeric: 0,
      educationLevel: 'Undergraduate',
      courseStream: 'All Streams',
      stateScope: 'All India',
      maxIncomeInr: null,
      minPercentage: null,
      categoryEligibility: 'All Categories',
      deadlineDate: 'Fraud Warning Active',
      officialUrl: 'https://scholarships-gov-in.example.xyz/claim-fee',
      applicationUrl: 'https://scholarships-gov-in.example.xyz/claim-fee',
      description:
        'Sample educational fraud alert demonstrating how ScholarShield marks lookalike portals requesting UPI registration fees or Aadhaar OTPs as SUSPICIOUS.',
      summary:
        'Do not apply or share personal details. Official Indian government scholarships never charge registration fees or disburse funds via UPI collect requests.',
      verificationStatus: 'SUSPICIOUS',
      verificationReason:
        'Impersonates official NSP domain name on a non-government .xyz domain and requests an upfront registration fee.',
      verificationEvidence:
        'Domain mismatch against scholarships.gov.in; phishing lure pattern (/claim-fee) detected.',
      isSample: true,
    },
    sources: [
      {
        sourceName: 'ScholarShield Threat Intelligence (Sample)',
        sourceUrl: 'https://scholarships.gov.in',
        sourceType: 'official_portal',
        credibilityNote: 'Verified official NSP portal warns against third-party fee-collecting lookalike sites.',
      },
    ],
    criteria: [
      {
        criterionKey: 'other',
        label: 'Security Warning',
        operator: 'info',
        expectedValue: 'Do not submit data',
        isMandatory: false,
        description: 'Sample record flagged as SUSPICIOUS for cybersecurity awareness.',
      },
    ],
    documents: [],
  },
];

export async function ensureSeeded(): Promise<void> {
  if (seededOnce) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const [{ value }] = await db.select({ value: count() }).from(scholarships);
      if (Number(value) > 0) {
        seededOnce = true;
        return;
      }

      for (const item of SEED_RECORDS) {
        const [inserted] = await db
          .insert(scholarships)
          .values(item.scholarship)
          .onConflictDoNothing({ target: scholarships.slug })
          .returning();

        if (!inserted) continue;

        if (item.sources.length > 0) {
          await db.insert(scholarshipSources).values(
            item.sources.map((s) => ({ ...s, scholarshipId: inserted.id }))
          );
        }

        if (item.criteria.length > 0) {
          await db.insert(eligibilityCriteria).values(
            item.criteria.map((c) => ({ ...c, scholarshipId: inserted.id }))
          );
        }

        if (item.documents.length > 0) {
          await db.insert(scholarshipDocuments).values(
            item.documents.map((d) => ({ ...d, scholarshipId: inserted.id }))
          );
        }

        await db.insert(verificationHistory).values({
          scholarshipId: inserted.id,
          previousStatus: 'UNCHECKED',
          newStatus: inserted.verificationStatus,
          reason: inserted.verificationReason,
          evidence: inserted.verificationEvidence,
          actorUid: 'system-seed',
          actorEmail: 'verification-engine@scholarshield.local',
        });
      }

      seededOnce = true;
    } catch (err) {
      console.error('Database seed failed:', err);
      seedingPromise = null;
      throw err;
    }
  })();

  return seedingPromise;
}
