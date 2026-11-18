import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. profiles (Linked 1:1 with Firebase Auth UID)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('student'), // 'student' | 'admin'
  fullName: text('full_name').default(''),
  phone: text('phone').default(''),
  state: text('state').default(''),
  district: text('district').default(''),
  educationLevel: text('education_level').default(''), // 'High School' | 'Diploma' | 'Undergraduate' | 'Postgraduate' | 'PhD'
  institution: text('institution').default('Rajeev Institute of Technology'),
  course: text('course').default('Computer Science'),
  gdgUrl: text('gdg_url').default('https://gdg.community.dev'),
  academicYear: text('academic_year').default(''),
  previousPercentage: numeric('previous_percentage', { precision: 5, scale: 2 }),
  familyIncomeRange: text('family_income_range').default(''), // 'Below 1 Lakh' | '1-2.5 Lakhs' | '2.5-5 Lakhs' | '5-8 Lakhs' | 'Above 8 Lakhs'
  category: text('category').default(''), // Optional: 'General' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS' | 'Minority' | 'PwD'
  preferences: jsonb('preferences').$type<string[]>().default([]),
  consentAccepted: boolean('consent_accepted').notNull().default(false),
  emailReminders: boolean('email_reminders').notNull().default(false),
  deadlineReminders: boolean('deadline_reminders').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. scholarships
export const scholarships = pgTable('scholarships', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  provider: text('provider').notNull(),
  providerType: text('provider_type').notNull(), // 'government' | 'institutional' | 'private'
  amountText: text('amount_text').notNull(),
  amountNumeric: integer('amount_numeric').default(0).notNull(),
  educationLevel: text('education_level').notNull(), // e.g., 'Undergraduate', 'Postgraduate', 'High School', 'All Post-Matric'
  courseStream: text('course_stream').notNull(), // e.g., 'All Streams', 'Engineering & Technology', 'Science & Research', 'Medical'
  stateScope: text('state_scope').notNull(), // 'All India' or specific state e.g. 'Maharashtra'
  maxIncomeInr: integer('max_income_inr'), // nullable when no income cap
  minPercentage: numeric('min_percentage', { precision: 5, scale: 2 }),
  categoryEligibility: text('category_eligibility').notNull().default('All Categories'),
  deadlineDate: text('deadline_date').notNull(), // ISO YYYY-MM-DD or 'Check Official Portal'
  officialUrl: text('official_url').notNull(),
  applicationUrl: text('application_url').notNull(),
  description: text('description').notNull(),
  summary: text('summary').notNull(),
  verificationStatus: text('verification_status').notNull().default('NEEDS_REVIEW'), // 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS'
  verificationReason: text('verification_reason').notNull(),
  verificationEvidence: text('verification_evidence').notNull(),
  lastCheckedAt: timestamp('last_checked_at').defaultNow().notNull(),
  isArchived: boolean('is_archived').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
  createdByUid: text('created_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. scholarship_sources
export const scholarshipSources = pgTable('scholarship_sources', {
  id: serial('id').primaryKey(),
  scholarshipId: integer('scholarship_id')
    .references(() => scholarships.id, { onDelete: 'cascade' })
    .notNull(),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  sourceType: text('source_type').notNull(), // 'official_portal' | 'gazette' | 'institution' | 'community'
  credibilityNote: text('credibility_note').notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

// 4. eligibility_criteria
export const eligibilityCriteria = pgTable('eligibility_criteria', {
  id: serial('id').primaryKey(),
  scholarshipId: integer('scholarship_id')
    .references(() => scholarships.id, { onDelete: 'cascade' })
    .notNull(),
  criterionKey: text('criterion_key').notNull(), // 'education_level' | 'min_percentage' | 'max_income' | 'state' | 'category' | 'course' | 'other'
  label: text('label').notNull(),
  operator: text('operator').notNull(), // 'eq' | 'gte' | 'lte' | 'in' | 'info'
  expectedValue: text('expected_value').notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  description: text('description').notNull(),
});

// 5. scholarship_documents
export const scholarshipDocuments = pgTable('scholarship_documents', {
  id: serial('id').primaryKey(),
  scholarshipId: integer('scholarship_id')
    .references(() => scholarships.id, { onDelete: 'cascade' })
    .notNull(),
  documentName: text('document_name').notNull(),
  purposeReason: text('purpose_reason').notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  formatHint: text('format_hint').default('PDF / Official Copy'),
});

// 6. saved_scholarships
export const savedScholarships = pgTable(
  'saved_scholarships',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .references(() => profiles.uid, { onDelete: 'cascade' })
      .notNull(),
    scholarshipId: integer('scholarship_id')
      .references(() => scholarships.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('saved_user_scholarship_idx').on(table.userUid, table.scholarshipId),
  ]
);

// 7. applications
export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .references(() => profiles.uid, { onDelete: 'cascade' })
      .notNull(),
    scholarshipId: integer('scholarship_id')
      .references(() => scholarships.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status').notNull().default('Not Applied'), // 'Not Applied' | 'Application Started' | 'Documents Pending' | 'Application Submitted' | 'Under Review' | 'Selected' | 'Rejected'
    applicationRef: text('application_ref').default(''),
    personalNotes: text('personal_notes').default(''),
    history: jsonb('history')
      .$type<Array<{ status: string; note: string; changedAt: string }>>()
      .default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('app_user_scholarship_idx').on(table.userUid, table.scholarshipId),
  ]
);

// 8. notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => profiles.uid, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(), // 'deadline' | 'new_scholarship' | 'saved_update' | 'missing_docs' | 'application_status' | 'security_alert'
  title: text('title').notNull(),
  message: text('message').notNull(),
  linkTarget: text('link_target').default(''),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. security_scans
export const securityScans = pgTable('security_scans', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid'),
  targetUrl: text('target_url').notNull(),
  normalizedHost: text('normalized_host').notNull(),
  verdict: text('verdict').notNull(), // 'GREEN' | 'YELLOW' | 'RED'
  reasons: jsonb('reasons').$type<string[]>().default([]).notNull(),
  heuristicFindings: jsonb('heuristic_findings')
    .$type<Array<{ check: string; severity: string; detail: string }>>()
    .default([])
    .notNull(),
  safeBrowsingStatus: text('safe_browsing_status').notNull(),
  virusTotalStatus: text('virus_total_status').notNull(),
  redirectChain: jsonb('redirect_chain').$type<string[]>().default([]).notNull(),
  httpsAvailable: boolean('https_available').notNull().default(false),
  limitationsNote: text('limitations_note').notNull(),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
});

// 10. scam_reports
export const scamReports = pgTable('scam_reports', {
  id: serial('id').primaryKey(),
  reporterUid: text('reporter_uid'),
  reporterEmail: text('reporter_email').default(''),
  scholarshipId: integer('scholarship_id').references(() => scholarships.id, {
    onDelete: 'set null',
  }),
  reportedTitle: text('reported_title').notNull(),
  suspiciousUrl: text('suspicious_url').default(''),
  category: text('category').notNull(), // 'Fake scholarship' | 'Suspicious URL' | 'Fraudulent advertisement' | 'Request for payment' | 'Impersonation' | 'Suspicious message'
  description: text('description').notNull(),
  status: text('status').notNull().default('Pending Review'), // 'Pending Review' | 'Under Investigation' | 'Confirmed Fraud' | 'Dismissed'
  adminNotes: text('admin_notes').default(''),
  reviewedByUid: text('reviewed_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 11. verification_history
export const verificationHistory = pgTable('verification_history', {
  id: serial('id').primaryKey(),
  scholarshipId: integer('scholarship_id')
    .references(() => scholarships.id, { onDelete: 'cascade' })
    .notNull(),
  previousStatus: text('previous_status').notNull(),
  newStatus: text('new_status').notNull(),
  reason: text('reason').notNull(),
  evidence: text('evidence').notNull(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. admin_audit_logs
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. deadline_email_subscriptions (Public & student email alert signups)
export const deadlineEmailSubscriptions = pgTable(
  'deadline_email_subscriptions',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    userUid: text('user_uid'),
    educationLevel: text('education_level').notNull().default('All'),
    courseStream: text('course_stream').notNull().default('All'),
    stateScope: text('state_scope').notNull().default('All India'),
    isActive: boolean('is_active').notNull().default(true),
    welcomeEmailSent: boolean('welcome_email_sent').notNull().default(false),
    lastNotifiedAt: timestamp('last_notified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('deadline_sub_email_idx').on(table.email)]
);

// Relations
export const scholarshipsRelations = relations(scholarships, ({ many }) => ({
  sources: many(scholarshipSources),
  criteria: many(eligibilityCriteria),
  documents: many(scholarshipDocuments),
  verificationHistory: many(verificationHistory),
}));

export const scholarshipSourcesRelations = relations(scholarshipSources, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [scholarshipSources.scholarshipId],
    references: [scholarships.id],
  }),
}));

export const eligibilityCriteriaRelations = relations(eligibilityCriteria, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [eligibilityCriteria.scholarshipId],
    references: [scholarships.id],
  }),
}));

export const scholarshipDocumentsRelations = relations(scholarshipDocuments, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [scholarshipDocuments.scholarshipId],
    references: [scholarships.id],
  }),
}));

export const verificationHistoryRelations = relations(verificationHistory, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [verificationHistory.scholarshipId],
    references: [scholarships.id],
  }),
}));
