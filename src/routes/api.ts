import { Router } from 'express';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  adminAuditLogs,
  applications,
  deadlineEmailSubscriptions,
  eligibilityCriteria,
  notifications,
  profiles,
  savedScholarships,
  scamReports,
  scholarshipDocuments,
  scholarships,
  scholarshipSources,
  securityScans,
  verificationHistory,
} from '../db/schema.ts';
import { ensureSeeded } from '../db/seed.ts';
import { AuthRequest, optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.ts';
import { evaluateEligibility } from '../services/eligibility.ts';
import { analyzeScholarshipUrl } from '../services/urlScanner.ts';
import { generateGroundedExplanation } from '../services/gemini.ts';
import { createNotification } from '../services/notifications.ts';
import {
  broadcastScholarshipDeadlineAlert,
  isEmailServiceConfigured,
  sendDeadlineSubscriptionConfirmationEmail,
} from '../services/email.ts';

export const apiRouter = Router();

const ALLOWED_APP_STATUSES = new Set([
  'Not Applied',
  'Application Started',
  'Documents Pending',
  'Application Submitted',
  'Under Review',
  'Selected',
  'Rejected',
]);

const ALLOWED_VERIFICATION_STATUSES = new Set(['VERIFIED', 'NEEDS_REVIEW', 'SUSPICIOUS']);

function computeProfileCompletion(profile: typeof profiles.$inferSelect): number {
  const fields = [
    profile.fullName,
    profile.state,
    profile.district,
    profile.educationLevel,
    profile.institution,
    profile.course,
    profile.academicYear,
    profile.previousPercentage,
    profile.familyIncomeRange,
  ];
  const filled = fields.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

// Health check (no DB probe on startup; safe lightweight endpoint)
apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'scholarshield-api', timestamp: new Date().toISOString() });
});

// ==========================================
// 1. SCHOLARSHIP DISCOVERY & DETAILS
// ==========================================
apiRouter.get('/scholarships', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();

    const {
      q,
      educationLevel,
      courseStream,
      state,
      providerType,
      verificationStatus,
      maxIncome,
      minPercentage,
      minAmount,
      provider,
      sort,
      includeArchived,
      eligState,
      eligLevel,
      eligCourse,
      eligPercentage,
      eligIncome,
      eligCategory,
      onlyEligible,
    } = req.query as Record<string, string | undefined>;

    const conditions = [];
    if (includeArchived !== 'true') {
      conditions.push(eq(scholarships.isArchived, false));
    }

    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(scholarships.title, pattern),
          ilike(scholarships.provider, pattern),
          ilike(scholarships.summary, pattern),
          ilike(scholarships.courseStream, pattern),
          ilike(scholarships.stateScope, pattern)
        )!
      );
    }

    if (educationLevel && educationLevel !== 'All') {
      conditions.push(ilike(scholarships.educationLevel, `%${educationLevel}%`));
    }

    if (courseStream && courseStream !== 'All') {
      conditions.push(
        or(
          ilike(scholarships.courseStream, `%${courseStream}%`),
          eq(scholarships.courseStream, 'All Streams')
        )!
      );
    }

    if (state && state !== 'All') {
      conditions.push(
        or(
          ilike(scholarships.stateScope, `%${state}%`),
          eq(scholarships.stateScope, 'All India')
        )!
      );
    }

    if (providerType && providerType !== 'All') {
      conditions.push(eq(scholarships.providerType, providerType));
    }

    if (verificationStatus && verificationStatus !== 'All') {
      conditions.push(eq(scholarships.verificationStatus, verificationStatus));
    }

    if (provider && provider.trim()) {
      conditions.push(ilike(scholarships.provider, `%${provider.trim()}%`));
    }

    const rows = await db
      .select()
      .from(scholarships)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sort === 'amount_desc'
          ? desc(scholarships.amountNumeric)
          : sort === 'recent'
            ? desc(scholarships.lastCheckedAt)
            : desc(scholarships.id)
      );

    // Client-friendly numeric filtering & join child tables cleanly
    let filtered = rows;
    if (maxIncome && !Number.isNaN(Number(maxIncome))) {
      const incomeNum = Number(maxIncome);
      filtered = filtered.filter((s) => s.maxIncomeInr === null || s.maxIncomeInr >= incomeNum);
    }
    if (minPercentage && !Number.isNaN(Number(minPercentage))) {
      const pctNum = Number(minPercentage);
      filtered = filtered.filter((s) => s.minPercentage === null || Number(s.minPercentage) <= pctNum);
    }
    if (minAmount && !Number.isNaN(Number(minAmount))) {
      const amtNum = Number(minAmount);
      filtered = filtered.filter((s) => s.amountNumeric >= amtNum);
    }

    const allSources = await db.select().from(scholarshipSources);
    const allCriteria = await db.select().from(eligibilityCriteria);
    const allDocs = await db.select().from(scholarshipDocuments);

    let savedIds = new Set<number>();
    if (req.profile) {
      const savedRows = await db
        .select()
        .from(savedScholarships)
        .where(eq(savedScholarships.userUid, req.profile.uid));
      savedIds = new Set(savedRows.map((s) => s.scholarshipId));
    }

    const hasLiveEligInput = Boolean(
      (eligState && eligState !== 'All' && eligState.trim() !== '') ||
        (eligLevel && eligLevel !== 'All' && eligLevel.trim() !== '') ||
        (eligCourse && eligCourse !== 'All' && eligCourse.trim() !== '') ||
        (eligPercentage && eligPercentage.trim() !== '') ||
        (eligIncome && eligIncome.trim() !== '') ||
        (eligCategory && eligCategory !== 'All' && eligCategory.trim() !== '')
    );

    const parsedEligIncome =
      eligIncome && eligIncome.trim() !== '' && !Number.isNaN(Number(eligIncome))
        ? Number(eligIncome)
        : null;

    const effectiveProfile = hasLiveEligInput
      ? {
          state: eligState && eligState !== 'All' ? eligState.trim() : req.profile?.state || '',
          educationLevel:
            eligLevel && eligLevel !== 'All' ? eligLevel.trim() : req.profile?.educationLevel || '',
          course: eligCourse && eligCourse !== 'All' ? eligCourse.trim() : req.profile?.course || '',
          previousPercentage:
            eligPercentage && eligPercentage.trim() !== ''
              ? eligPercentage.trim()
              : req.profile?.previousPercentage || null,
          familyIncomeRange: req.profile?.familyIncomeRange || '',
          exactIncomeInr: parsedEligIncome,
          category:
            eligCategory && eligCategory !== 'All' ? eligCategory.trim() : req.profile?.category || '',
        }
      : req.profile || null;

    let enriched = filtered.map((item) => {
      const itemCriteria = allCriteria.filter((c) => c.scholarshipId === item.id);
      return {
        ...item,
        sources: allSources.filter((s) => s.scholarshipId === item.id),
        criteria: itemCriteria,
        documents: allDocs.filter((d) => d.scholarshipId === item.id),
        isBookmarked: savedIds.has(item.id),
        eligibility: effectiveProfile ? evaluateEligibility(effectiveProfile, itemCriteria) : null,
      };
    });

    if (onlyEligible === 'true' && effectiveProfile) {
      enriched = enriched.filter((s) => s.eligibility?.status !== 'Not Eligible');
    }

    if (sort === 'verified_first') {
      const statusRank: Record<string, number> = { VERIFIED: 0, NEEDS_REVIEW: 1, SUSPICIOUS: 2 };
      const eligRank: Record<string, number> = {
        Eligible: 0,
        'Potentially Eligible': 1,
        'Additional Information Required': 2,
        'Not Eligible': 3,
      };
      enriched.sort((a, b) => {
        if (hasLiveEligInput && a.eligibility && b.eligibility) {
          const eDiff = (eligRank[a.eligibility.status] ?? 9) - (eligRank[b.eligibility.status] ?? 9);
          if (eDiff !== 0) return eDiff;
        }
        return (statusRank[a.verificationStatus] ?? 9) - (statusRank[b.verificationStatus] ?? 9);
      });
    }

    res.json({ scholarships: enriched });
  } catch (error) {
    console.error('Error loading scholarships:', error);
    res.status(500).json({ error: 'Unable to load scholarship directory. Please try again.' });
  }
});

apiRouter.get('/scholarships/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid scholarship ID.' });
    }

    const rows = await db.select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
    if (!rows.length) {
      return res.status(404).json({ error: 'Scholarship record not found.' });
    }
    const item = rows[0];

    const [sources, criteria, documents, history] = await Promise.all([
      db.select().from(scholarshipSources).where(eq(scholarshipSources.scholarshipId, id)),
      db.select().from(eligibilityCriteria).where(eq(eligibilityCriteria.scholarshipId, id)),
      db.select().from(scholarshipDocuments).where(eq(scholarshipDocuments.scholarshipId, id)),
      db
        .select()
        .from(verificationHistory)
        .where(eq(verificationHistory.scholarshipId, id))
        .orderBy(desc(verificationHistory.createdAt)),
    ]);

    let isBookmarked = false;
    if (req.profile) {
      const saved = await db
        .select()
        .from(savedScholarships)
        .where(and(eq(savedScholarships.userUid, req.profile.uid), eq(savedScholarships.scholarshipId, id)))
        .limit(1);
      isBookmarked = saved.length > 0;
    }

    res.json({
      scholarship: {
        ...item,
        sources,
        criteria,
        documents,
        verificationHistory: history,
        isBookmarked,
        eligibility: req.profile ? evaluateEligibility(req.profile, criteria) : null,
      },
    });
  } catch (error) {
    console.error('Error loading scholarship detail:', error);
    res.status(500).json({ error: 'Failed to load scholarship details.' });
  }
});

// ==========================================
// 2. PROFILE & DASHBOARD
// ==========================================
apiRouter.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = req.profile!;
    res.json({
      profile,
      completionPercent: computeProfileCompletion(profile),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to load student profile.' });
  }
});

apiRouter.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    // Enforce data minimization: reject sensitive prohibited fields
    if ('aadhaar' in body || 'aadhaarNumber' in body || 'bankPassword' in body || 'bankAccountNumber' in body) {
      return res.status(400).json({
        error: 'ScholarShield never collects Aadhaar numbers, bank credentials, or passwords in profile records.',
      });
    }

    const previousPercentageRaw =
      body.previousPercentage !== undefined && body.previousPercentage !== '' && body.previousPercentage !== null
        ? Number(body.previousPercentage)
        : null;

    if (previousPercentageRaw !== null && (Number.isNaN(previousPercentageRaw) || previousPercentageRaw < 0 || previousPercentageRaw > 100)) {
      return res.status(400).json({ error: 'Previous academic percentage must be between 0 and 100.' });
    }

    let nextGdgUrl = req.profile!.gdgUrl;
    if (typeof body.gdgUrl === 'string') {
      const trimmedGdg = body.gdgUrl.trim().slice(0, 300);
      if (trimmedGdg && !/^https?:\/\//i.test(trimmedGdg)) {
        return res.status(400).json({ error: 'GDG URL must start with http:// or https://.' });
      }
      nextGdgUrl = trimmedGdg || 'https://gdg.community.dev';
    }

    const updatedRows = await db
      .update(profiles)
      .set({
        fullName: typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : req.profile!.fullName,
        phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 20) : req.profile!.phone,
        state: typeof body.state === 'string' ? body.state.trim().slice(0, 80) : req.profile!.state,
        district: typeof body.district === 'string' ? body.district.trim().slice(0, 80) : req.profile!.district,
        educationLevel: typeof body.educationLevel === 'string' ? body.educationLevel.trim().slice(0, 60) : req.profile!.educationLevel,
        institution: typeof body.institution === 'string' ? body.institution.trim().slice(0, 160) : req.profile!.institution,
        course: typeof body.course === 'string' ? body.course.trim().slice(0, 120) : req.profile!.course,
        gdgUrl: nextGdgUrl,
        academicYear: typeof body.academicYear === 'string' ? body.academicYear.trim().slice(0, 40) : req.profile!.academicYear,
        previousPercentage: previousPercentageRaw !== null ? previousPercentageRaw.toFixed(2) : null,
        familyIncomeRange: typeof body.familyIncomeRange === 'string' ? body.familyIncomeRange.trim().slice(0, 60) : req.profile!.familyIncomeRange,
        category: typeof body.category === 'string' ? body.category.trim().slice(0, 60) : req.profile!.category,
        preferences: Array.isArray(body.preferences)
          ? body.preferences.filter((p): p is string => typeof p === 'string').slice(0, 12)
          : req.profile!.preferences,
        consentAccepted: typeof body.consentAccepted === 'boolean' ? body.consentAccepted : req.profile!.consentAccepted,
        emailReminders: typeof body.emailReminders === 'boolean' ? body.emailReminders : req.profile!.emailReminders,
        deadlineReminders: typeof body.deadlineReminders === 'boolean' ? body.deadlineReminders : req.profile!.deadlineReminders,
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, req.profile!.uid))
      .returning();

    const updated = updatedRows[0];
    res.json({
      profile: updated,
      completionPercent: computeProfileCompletion(updated),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Unable to save student profile.' });
  }
});

apiRouter.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const profile = req.profile!;
    const completionPercent = computeProfileCompletion(profile);

    const [
      activeScholarships,
      allCriteria,
      savedRows,
      userApps,
      userNotifications,
      userScans,
      userReports,
    ] = await Promise.all([
      db.select().from(scholarships).where(eq(scholarships.isArchived, false)),
      db.select().from(eligibilityCriteria),
      db.select().from(savedScholarships).where(eq(savedScholarships.userUid, profile.uid)),
      db
        .select()
        .from(applications)
        .where(eq(applications.userUid, profile.uid))
        .orderBy(desc(applications.updatedAt)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userUid, profile.uid))
        .orderBy(desc(notifications.createdAt))
        .limit(25),
      db
        .select()
        .from(securityScans)
        .where(eq(securityScans.userUid, profile.uid))
        .orderBy(desc(securityScans.scannedAt))
        .limit(10),
      db
        .select()
        .from(scamReports)
        .where(eq(scamReports.reporterUid, profile.uid))
        .orderBy(desc(scamReports.createdAt))
        .limit(10),
    ]);

    const savedSet = new Set(savedRows.map((r) => r.scholarshipId));

    const evaluated = activeScholarships
      .filter((s) => s.verificationStatus !== 'SUSPICIOUS')
      .map((s) => {
        const crit = allCriteria.filter((c) => c.scholarshipId === s.id);
        return {
          ...s,
          isBookmarked: savedSet.has(s.id),
          eligibility: evaluateEligibility(profile, crit),
        };
      });

    const eligibleList = evaluated.filter(
      (s) => s.eligibility.status === 'Eligible' || s.eligibility.status === 'Potentially Eligible'
    );

    const recommendedList = eligibleList
      .filter((s) => s.verificationStatus === 'VERIFIED')
      .slice(0, 6);

    const savedList = activeScholarships
      .filter((s) => savedSet.has(s.id))
      .map((s) => ({
        ...s,
        eligibility: evaluateEligibility(
          profile,
          allCriteria.filter((c) => c.scholarshipId === s.id)
        ),
      }));

    const scholarshipMap = new Map(activeScholarships.map((s) => [s.id, s]));
    const enrichedApps = userApps.map((a) => ({
      ...a,
      scholarship: scholarshipMap.get(a.scholarshipId) || null,
    }));

    // Build recent activities feed from real DB events
    const recentActivities: Array<{ id: string; kind: string; title: string; timestamp: string }> = [
      ...userApps.slice(0, 5).map((a) => ({
        id: `app-${a.id}`,
        kind: 'application',
        title: `Application status "${a.status}" for ${scholarshipMap.get(a.scholarshipId)?.title || `Scholarship #${a.scholarshipId}`}`,
        timestamp: a.updatedAt.toISOString(),
      })),
      ...userScans.slice(0, 5).map((s) => ({
        id: `scan-${s.id}`,
        kind: 'scan',
        title: `URL Scan (${s.verdict}): ${s.normalizedHost}`,
        timestamp: s.scannedAt.toISOString(),
      })),
      ...userReports.slice(0, 3).map((r) => ({
        id: `report-${r.id}`,
        kind: 'report',
        title: `Scam report submitted: ${r.reportedTitle} (${r.status})`,
        timestamp: r.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      profile,
      completionPercent,
      recommendedScholarships: recommendedList,
      eligibleScholarships: eligibleList,
      savedScholarships: savedList,
      applications: enrichedApps,
      notifications: userNotifications,
      securityAlerts: userScans.filter((s) => s.verdict !== 'GREEN'),
      recentScans: userScans,
      recentActivities: recentActivities.slice(0, 10),
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).json({ error: 'Unable to load dashboard summary.' });
  }
});

// ==========================================
// 3. SAVED SCHOLARSHIPS (BOOKMARKS)
// ==========================================
apiRouter.post('/saved/:scholarshipId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const scholarshipId = Number(req.params.scholarshipId);
    if (Number.isNaN(scholarshipId)) {
      return res.status(400).json({ error: 'Invalid scholarship ID.' });
    }
    await db
      .insert(savedScholarships)
      .values({ userUid: req.profile!.uid, scholarshipId })
      .onConflictDoNothing();
    res.json({ saved: true, scholarshipId });
  } catch (error) {
    console.error('Error saving scholarship:', error);
    res.status(500).json({ error: 'Failed to bookmark scholarship.' });
  }
});

apiRouter.delete('/saved/:scholarshipId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const scholarshipId = Number(req.params.scholarshipId);
    if (Number.isNaN(scholarshipId)) {
      return res.status(400).json({ error: 'Invalid scholarship ID.' });
    }
    await db
      .delete(savedScholarships)
      .where(
        and(
          eq(savedScholarships.userUid, req.profile!.uid),
          eq(savedScholarships.scholarshipId, scholarshipId)
        )
      );
    res.json({ saved: false, scholarshipId });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark.' });
  }
});

// ==========================================
// 4. RULE-BASED ELIGIBILITY CALCULATOR
// ==========================================
apiRouter.post('/eligibility/evaluate', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const { scholarshipId, profileOverride } = req.body as {
      scholarshipId?: number;
      profileOverride?: Record<string, unknown>;
    };

    if (!scholarshipId || Number.isNaN(Number(scholarshipId))) {
      return res.status(400).json({ error: 'Valid scholarshipId is required.' });
    }

    const criteria = await db
      .select()
      .from(eligibilityCriteria)
      .where(eq(eligibilityCriteria.scholarshipId, Number(scholarshipId)));

    const effectiveProfile = profileOverride
      ? {
          state: typeof profileOverride.state === 'string' ? profileOverride.state : req.profile?.state,
          educationLevel:
            typeof profileOverride.educationLevel === 'string'
              ? profileOverride.educationLevel
              : req.profile?.educationLevel,
          course: typeof profileOverride.course === 'string' ? profileOverride.course : req.profile?.course,
          previousPercentage:
            profileOverride.previousPercentage !== undefined
              ? (profileOverride.previousPercentage as string | number | null)
              : req.profile?.previousPercentage,
          familyIncomeRange:
            typeof profileOverride.familyIncomeRange === 'string'
              ? profileOverride.familyIncomeRange
              : req.profile?.familyIncomeRange,
          category: typeof profileOverride.category === 'string' ? profileOverride.category : req.profile?.category,
        }
      : req.profile || {};

    const result = evaluateEligibility(effectiveProfile, criteria);
    res.json({ result });
  } catch (error) {
    console.error('Error evaluating eligibility:', error);
    res.status(500).json({ error: 'Failed to evaluate eligibility criteria.' });
  }
});

// ==========================================
// 5. APPLICATION TRACKER
// ==========================================
apiRouter.get('/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(applications)
      .where(eq(applications.userUid, req.profile!.uid))
      .orderBy(desc(applications.updatedAt));

    const allScholarships = await db.select().from(scholarships);
    const map = new Map(allScholarships.map((s) => [s.id, s]));

    res.json({
      applications: rows.map((r) => ({
        ...r,
        scholarship: map.get(r.scholarshipId) || null,
      })),
    });
  } catch (error) {
    console.error('Error loading applications:', error);
    res.status(500).json({ error: 'Failed to load applications.' });
  }
});

apiRouter.post('/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { scholarshipId, status, applicationRef, personalNotes } = req.body as {
      scholarshipId?: number;
      status?: string;
      applicationRef?: string;
      personalNotes?: string;
    };

    if (!scholarshipId || Number.isNaN(Number(scholarshipId))) {
      return res.status(400).json({ error: 'Valid scholarshipId is required.' });
    }
    const nextStatus = status || 'Application Started';
    if (!ALLOWED_APP_STATUSES.has(nextStatus)) {
      return res.status(400).json({ error: 'Invalid application status value.' });
    }

    const schRows = await db
      .select()
      .from(scholarships)
      .where(eq(scholarships.id, Number(scholarshipId)))
      .limit(1);
    if (!schRows.length) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    const existing = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userUid, req.profile!.uid),
          eq(applications.scholarshipId, Number(scholarshipId))
        )
      )
      .limit(1);

    const nowIso = new Date().toISOString();

    if (existing.length > 0) {
      const prev = existing[0];
      const nextHistory = Array.isArray(prev.history) ? [...prev.history] : [];
      if (prev.status !== nextStatus) {
        nextHistory.unshift({
          status: nextStatus,
          note: (personalNotes || '').trim() || `Status updated from ${prev.status} to ${nextStatus}`,
          changedAt: nowIso,
        });
      }

      const [updated] = await db
        .update(applications)
        .set({
          status: nextStatus,
          applicationRef: typeof applicationRef === 'string' ? applicationRef.trim().slice(0, 120) : prev.applicationRef,
          personalNotes: typeof personalNotes === 'string' ? personalNotes.trim().slice(0, 1000) : prev.personalNotes,
          history: nextHistory,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, prev.id))
        .returning();

      if (prev.status !== nextStatus) {
        await createNotification({
          userUid: req.profile!.uid,
          type: nextStatus === 'Documents Pending' ? 'missing_docs' : 'application_status',
          title: `Application Updated: ${schRows[0].title}`,
          message: `Your tracker status is now "${nextStatus}".`,
          linkTarget: `scholarship:${schRows[0].id}`,
        });
      }

      return res.json({ application: { ...updated, scholarship: schRows[0] } });
    }

    const [created] = await db
      .insert(applications)
      .values({
        userUid: req.profile!.uid,
        scholarshipId: Number(scholarshipId),
        status: nextStatus,
        applicationRef: typeof applicationRef === 'string' ? applicationRef.trim().slice(0, 120) : '',
        personalNotes: typeof personalNotes === 'string' ? personalNotes.trim().slice(0, 1000) : '',
        history: [
          {
            status: nextStatus,
            note: (personalNotes || '').trim() || 'Added to application tracker',
            changedAt: nowIso,
          },
        ],
      })
      .returning();

    await createNotification({
      userUid: req.profile!.uid,
      type: 'application_status',
      title: `Tracking Started: ${schRows[0].title}`,
      message: `Added to your application tracker with status "${nextStatus}".`,
      linkTarget: `scholarship:${schRows[0].id}`,
    });

    res.status(201).json({ application: { ...created, scholarship: schRows[0] } });
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: 'Unable to update application tracker.' });
  }
});

apiRouter.delete('/applications/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid application ID.' });
    }
    await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userUid, req.profile!.uid)));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to remove application.' });
  }
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userUid, req.profile!.uid))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    res.json({ notifications: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Unable to load notifications.' });
  }
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userUid, req.profile!.uid)));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification read.' });
  }
});

apiRouter.post('/notifications/mark-all-read', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userUid, req.profile!.uid));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// ==========================================
// 6B. SCHOLARSHIP DEADLINE EMAIL SUBSCRIPTIONS
// ==========================================
apiRouter.get('/deadline-subscriptions/status', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const emailParam =
      typeof req.query.email === 'string'
        ? req.query.email.trim().toLowerCase()
        : req.profile?.email?.toLowerCase() || '';

    let subscription = null;
    if (emailParam) {
      const rows = await db
        .select()
        .from(deadlineEmailSubscriptions)
        .where(eq(deadlineEmailSubscriptions.email, emailParam))
        .limit(1);
      subscription = rows[0] || null;
    }

    res.json({
      emailServiceConfigured: isEmailServiceConfigured(),
      subscription,
    });
  } catch (error) {
    console.error('Error checking deadline subscription status:', error);
    res.status(500).json({ error: 'Unable to check email alert subscription status.' });
  }
});

apiRouter.post('/deadline-subscriptions', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const {
      email,
      educationLevel = 'All',
      courseStream = 'All',
      stateScope = 'All India',
    } = req.body as {
      email?: string;
      educationLevel?: string;
      courseStream?: string;
      stateScope?: string;
    };

    const normalizedEmail = (email || req.profile?.email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanLevel = String(educationLevel || 'All').trim().slice(0, 60) || 'All';
    const cleanStream = String(courseStream || 'All').trim().slice(0, 80) || 'All';
    const cleanState = String(stateScope || 'All India').trim().slice(0, 80) || 'All India';

    const existing = await db
      .select()
      .from(deadlineEmailSubscriptions)
      .where(eq(deadlineEmailSubscriptions.email, normalizedEmail))
      .limit(1);

    const { result: emailResult, upcomingCount } = await sendDeadlineSubscriptionConfirmationEmail({
      email: normalizedEmail,
      educationLevel: cleanLevel,
      courseStream: cleanStream,
      stateScope: cleanState,
    });

    let subscription;
    if (existing.length > 0) {
      const [updated] = await db
        .update(deadlineEmailSubscriptions)
        .set({
          userUid: req.profile?.uid || existing[0].userUid,
          educationLevel: cleanLevel,
          courseStream: cleanStream,
          stateScope: cleanState,
          isActive: true,
          welcomeEmailSent: existing[0].welcomeEmailSent || emailResult.sent,
          lastNotifiedAt: emailResult.sent ? new Date() : existing[0].lastNotifiedAt,
          updatedAt: new Date(),
        })
        .where(eq(deadlineEmailSubscriptions.id, existing[0].id))
        .returning();
      subscription = updated;
    } else {
      const [created] = await db
        .insert(deadlineEmailSubscriptions)
        .values({
          email: normalizedEmail,
          userUid: req.profile?.uid || null,
          educationLevel: cleanLevel,
          courseStream: cleanStream,
          stateScope: cleanState,
          isActive: true,
          welcomeEmailSent: emailResult.sent,
          lastNotifiedAt: emailResult.sent ? new Date() : null,
        })
        .returning();
      subscription = created;
    }

    // Keep signed-in student profile synced with email reminder opt-in
    if (req.profile && req.profile.email.toLowerCase() === normalizedEmail) {
      await db
        .update(profiles)
        .set({
          emailReminders: true,
          deadlineReminders: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.uid, req.profile.uid));

      await createNotification({
        userUid: req.profile.uid,
        type: 'deadline',
        title: 'Scholarship Deadline Email Alerts Enabled',
        message: `Subscribed ${normalizedEmail} for ${cleanLevel} · ${cleanStream} · ${cleanState} deadline updates.`,
        linkTarget: 'discover',
      });
    }

    res.status(201).json({
      subscription,
      emailSent: emailResult.sent,
      provider: emailResult.provider,
      emailStatusMessage: emailResult.sent
        ? `Confirmation email with ${upcomingCount} upcoming verified deadlines sent to ${normalizedEmail}.`
        : isEmailServiceConfigured()
          ? `Subscription saved (${emailResult.reason || 'email delivery queued'}).`
          : `Subscription saved for ${normalizedEmail}. Live emails will dispatch automatically once RESEND_API_KEY is active on the server.`,
      upcomingCount,
    });
  } catch (error) {
    console.error('Error subscribing to deadline alerts:', error);
    res.status(500).json({ error: 'Unable to save deadline email notification preference.' });
  }
});

apiRouter.delete('/deadline-subscriptions', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const emailParam =
      typeof req.query.email === 'string'
        ? req.query.email
        : typeof (req.body as { email?: string } | undefined)?.email === 'string'
          ? (req.body as { email?: string }).email
          : req.profile?.email;

    const normalizedEmail = (emailParam || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email address is required to unsubscribe.' });
    }

    await db
      .update(deadlineEmailSubscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deadlineEmailSubscriptions.email, normalizedEmail));

    if (req.profile && req.profile.email.toLowerCase() === normalizedEmail) {
      await db
        .update(profiles)
        .set({ emailReminders: false, updatedAt: new Date() })
        .where(eq(profiles.uid, req.profile.uid));
    }

    res.json({ unsubscribed: true, email: normalizedEmail });
  } catch (error) {
    console.error('Error unsubscribing from deadline alerts:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from deadline alerts.' });
  }
});

// ==========================================
// 7. CYBERSECURITY URL SCANNER
// ==========================================
apiRouter.post('/scanner/analyze', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string' || url.trim().length < 4) {
      return res.status(400).json({ error: 'Please enter a valid scholarship URL (starting with https:// or http://).' });
    }

    const result = await analyzeScholarshipUrl(url.trim());

    const [savedScan] = await db
      .insert(securityScans)
      .values({
        userUid: req.profile?.uid || null,
        targetUrl: result.targetUrl,
        normalizedHost: result.normalizedHost,
        verdict: result.verdict,
        reasons: result.reasons,
        heuristicFindings: result.heuristicFindings,
        safeBrowsingStatus: result.safeBrowsingStatus,
        virusTotalStatus: result.virusTotalStatus,
        redirectChain: result.redirectChain,
        httpsAvailable: result.httpsAvailable,
        limitationsNote: result.limitationsNote,
      })
      .returning();

    if (req.profile && result.verdict === 'RED') {
      await createNotification({
        userUid: req.profile.uid,
        type: 'security_alert',
        title: `Phishing Risk Detected: ${result.normalizedHost}`,
        message: result.reasons[0] || 'Suspicious indicators detected during URL inspection.',
        linkTarget: 'scanner',
      });
    }

    res.json({ scan: { ...result, id: savedScan.id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to scan the provided URL.';
    res.status(400).json({ error: message });
  }
});

apiRouter.get('/scanner/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(securityScans)
      .where(eq(securityScans.userUid, req.profile!.uid))
      .orderBy(desc(securityScans.scannedAt))
      .limit(20);
    res.json({ scans: rows });
  } catch (error) {
    console.error('Error loading scan history:', error);
    res.status(500).json({ error: 'Failed to load URL scan history.' });
  }
});

// ==========================================
// 8. REPORT SCAM FEATURE
// ==========================================
apiRouter.post('/scam-reports', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { reportedTitle, suspiciousUrl, category, description, scholarshipId } = req.body as {
      reportedTitle?: string;
      suspiciousUrl?: string;
      category?: string;
      description?: string;
      scholarshipId?: number;
    };

    if (!reportedTitle?.trim() || !category?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Title, category, and incident description are required.' });
    }

    const [created] = await db
      .insert(scamReports)
      .values({
        reporterUid: req.profile?.uid || null,
        reporterEmail: req.profile?.email || '',
        scholarshipId: scholarshipId && !Number.isNaN(Number(scholarshipId)) ? Number(scholarshipId) : null,
        reportedTitle: reportedTitle.trim().slice(0, 180),
        suspiciousUrl: (suspiciousUrl || '').trim().slice(0, 500),
        category: category.trim().slice(0, 80),
        description: description.trim().slice(0, 2000),
        status: 'Pending Review',
      })
      .returning();

    res.status(201).json({
      report: created,
      message:
        'Report submitted for administrator investigation. ScholarShield does not automatically publish unverified accusations.',
    });
  } catch (error) {
    console.error('Error submitting scam report:', error);
    res.status(500).json({ error: 'Unable to submit scam report.' });
  }
});

apiRouter.get('/scam-reports/mine', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(scamReports)
      .where(eq(scamReports.reporterUid, req.profile!.uid))
      .orderBy(desc(scamReports.createdAt));
    res.json({ reports: rows });
  } catch (error) {
    console.error('Error fetching user scam reports:', error);
    res.status(500).json({ error: 'Failed to load submitted reports.' });
  }
});

// ==========================================
// 9. GEMINI AI ASSISTANT (SERVER-SIDE GROUNDED)
// ==========================================
apiRouter.post('/ai/explain', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { mode, scholarshipId, scanResult, eligibilityResult, question } = req.body as {
      mode: 'eligibility' | 'summary' | 'url_scan' | 'documents' | 'qa';
      scholarshipId?: number;
      scanResult?: Record<string, unknown>;
      eligibilityResult?: Record<string, unknown>;
      question?: string;
    };

    if (!mode) {
      return res.status(400).json({ error: 'Explanation mode is required.' });
    }

    let contextData: Record<string, unknown> = {};

    if (scholarshipId) {
      const rows = await db
        .select()
        .from(scholarships)
        .where(eq(scholarships.id, Number(scholarshipId)))
        .limit(1);
      if (!rows.length) {
        return res.status(404).json({ error: 'Scholarship record not found.' });
      }
      const [sources, criteria, documents] = await Promise.all([
        db.select().from(scholarshipSources).where(eq(scholarshipSources.scholarshipId, Number(scholarshipId))),
        db.select().from(eligibilityCriteria).where(eq(eligibilityCriteria.scholarshipId, Number(scholarshipId))),
        db.select().from(scholarshipDocuments).where(eq(scholarshipDocuments.scholarshipId, Number(scholarshipId))),
      ]);
      contextData = {
        scholarship: rows[0],
        sources,
        criteria,
        documents,
        ...(eligibilityResult ? { deterministicEligibility: eligibilityResult } : {}),
      };
    } else if (scanResult) {
      contextData = { scanResult };
    } else {
      return res.status(400).json({ error: 'Verified scholarshipId or scanResult context is required.' });
    }

    const explanation = await generateGroundedExplanation({
      mode,
      question,
      contextData,
    });

    res.json({ explanation });
  } catch (error: unknown) {
    console.error('Gemini AI explanation error:', error);
    const msg = error instanceof Error ? error.message : 'AI explanation failed.';
    const statusCode = msg.includes('GEMINI_API_KEY') ? 503 : 500;
    res.status(statusCode).json({ error: msg });
  }
});

// ==========================================
// 10. ADMIN DASHBOARD & AUDIT LOGS (RBAC)
// ==========================================
apiRouter.get('/admin/overview', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const [
      allScholarships,
      allReports,
      allUsers,
      auditLogs,
      appStats,
    ] = await Promise.all([
      db.select().from(scholarships).orderBy(desc(scholarships.updatedAt)),
      db.select().from(scamReports).orderBy(desc(scamReports.createdAt)),
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(40),
      db
        .select({
          status: applications.status,
          count: sql<number>`count(*)::int`,
        })
        .from(applications)
        .groupBy(applications.status),
    ]);

    const allSources = await db.select().from(scholarshipSources);
    const allHistory = await db
      .select()
      .from(verificationHistory)
      .orderBy(desc(verificationHistory.createdAt));

    res.json({
      stats: {
        totalScholarships: allScholarships.length,
        verifiedCount: allScholarships.filter((s) => s.verificationStatus === 'VERIFIED').length,
        needsReviewCount: allScholarships.filter((s) => s.verificationStatus === 'NEEDS_REVIEW').length,
        suspiciousCount: allScholarships.filter((s) => s.verificationStatus === 'SUSPICIOUS').length,
        pendingReports: allReports.filter((r) => r.status === 'Pending Review' || r.status === 'Under Investigation').length,
        totalUsers: allUsers.length,
        applicationBreakdown: appStats,
      },
      scholarships: allScholarships.map((s) => ({
        ...s,
        sources: allSources.filter((src) => src.scholarshipId === s.id),
        verificationHistory: allHistory.filter((h) => h.scholarshipId === s.id),
      })),
      scamReports: allReports,
      users: allUsers.map((u) => ({
        id: u.id,
        uid: u.uid,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        state: u.state,
        educationLevel: u.educationLevel,
        consentAccepted: u.consentAccepted,
        createdAt: u.createdAt,
      })),
      auditLogs,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Unable to load administrator overview.' });
  }
});

apiRouter.post('/admin/scholarships', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const title = String(b.title || '').trim();
    const provider = String(b.provider || '').trim();
    const officialUrl = String(b.officialUrl || '').trim();
    const applicationUrl = String(b.applicationUrl || officialUrl).trim();

    if (!title || !provider || !officialUrl) {
      return res.status(400).json({ error: 'Title, provider, and official URL are required.' });
    }

    const status = ALLOWED_VERIFICATION_STATUSES.has(String(b.verificationStatus || ''))
      ? String(b.verificationStatus)
      : 'NEEDS_REVIEW';

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now()}`;

    const [created] = await db
      .insert(scholarships)
      .values({
        slug,
        title,
        provider,
        providerType: String(b.providerType || 'government'),
        amountText: String(b.amountText || 'Refer to official notification'),
        amountNumeric: Number(b.amountNumeric || 0) || 0,
        educationLevel: String(b.educationLevel || 'Undergraduate'),
        courseStream: String(b.courseStream || 'All Streams'),
        stateScope: String(b.stateScope || 'All India'),
        maxIncomeInr: b.maxIncomeInr ? Number(b.maxIncomeInr) : null,
        minPercentage: b.minPercentage ? String(b.minPercentage) : null,
        categoryEligibility: String(b.categoryEligibility || 'All Categories'),
        deadlineDate: String(b.deadlineDate || 'Check Official Portal'),
        officialUrl,
        applicationUrl,
        description: String(b.description || title),
        summary: String(b.summary || title),
        verificationStatus: status,
        verificationReason: String(
          b.verificationReason || 'Added by administrator; review primary sources before marking VERIFIED.'
        ),
        verificationEvidence: String(b.verificationEvidence || officialUrl),
        isSample: Boolean(b.isSample),
        createdByUid: req.profile!.uid,
      })
      .returning();

    if (String(b.sourceName || '').trim()) {
      await db.insert(scholarshipSources).values({
        scholarshipId: created.id,
        sourceName: String(b.sourceName).trim(),
        sourceUrl: officialUrl,
        sourceType: 'official_portal',
        credibilityNote: String(b.sourceNote || 'Administrator verified source link.'),
      });
    }

    await db.insert(verificationHistory).values({
      scholarshipId: created.id,
      previousStatus: 'NEW',
      newStatus: status,
      reason: created.verificationReason,
      evidence: created.verificationEvidence,
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
    });

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'CREATE_SCHOLARSHIP',
      entityType: 'scholarship',
      entityId: String(created.id),
      details: { title: created.title, verificationStatus: status },
    });

    const alertStats =
      created.verificationStatus !== 'SUSPICIOUS'
        ? await broadcastScholarshipDeadlineAlert({
            scholarship: created,
            eventType: 'new_scholarship',
          })
        : { matchedSubscribers: 0, emailedCount: 0, providerConfigured: isEmailServiceConfigured() };

    res.status(201).json({ scholarship: created, alertStats });
  } catch (error) {
    console.error('Admin create scholarship error:', error);
    res.status(500).json({ error: 'Failed to create scholarship record.' });
  }
});

apiRouter.put('/admin/scholarships/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const existing = await db.select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    const [updated] = await db
      .update(scholarships)
      .set({
        title: typeof b.title === 'string' ? b.title.trim() : existing[0].title,
        provider: typeof b.provider === 'string' ? b.provider.trim() : existing[0].provider,
        amountText: typeof b.amountText === 'string' ? b.amountText.trim() : existing[0].amountText,
        deadlineDate: typeof b.deadlineDate === 'string' ? b.deadlineDate.trim() : existing[0].deadlineDate,
        officialUrl: typeof b.officialUrl === 'string' ? b.officialUrl.trim() : existing[0].officialUrl,
        applicationUrl: typeof b.applicationUrl === 'string' ? b.applicationUrl.trim() : existing[0].applicationUrl,
        stateScope: typeof b.stateScope === 'string' ? b.stateScope.trim() : existing[0].stateScope,
        educationLevel: typeof b.educationLevel === 'string' ? b.educationLevel.trim() : existing[0].educationLevel,
        summary: typeof b.summary === 'string' ? b.summary.trim() : existing[0].summary,
        updatedAt: new Date(),
      })
      .where(eq(scholarships.id, id))
      .returning();

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'UPDATE_SCHOLARSHIP',
      entityType: 'scholarship',
      entityId: String(id),
      details: { deadlineDate: updated.deadlineDate, title: updated.title },
    });

    let alertStats = null;
    if (existing[0].deadlineDate !== updated.deadlineDate && updated.verificationStatus !== 'SUSPICIOUS') {
      alertStats = await broadcastScholarshipDeadlineAlert({
        scholarship: updated,
        eventType: 'deadline_updated',
      });
    }

    res.json({ scholarship: updated, alertStats });
  } catch (error) {
    console.error('Admin update scholarship error:', error);
    res.status(500).json({ error: 'Failed to update scholarship.' });
  }
});

apiRouter.post('/admin/scholarships/:id/send-deadline-alert', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
    if (!rows.length) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }
    const stats = await broadcastScholarshipDeadlineAlert({
      scholarship: rows[0],
      eventType: 'manual_broadcast',
    });

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'BROADCAST_DEADLINE_ALERT',
      entityType: 'scholarship',
      entityId: String(id),
      details: stats,
    });

    res.json({ ok: true, ...stats });
  } catch (error) {
    console.error('Admin broadcast deadline alert error:', error);
    res.status(500).json({ error: 'Failed to send deadline alert emails.' });
  }
});

apiRouter.patch('/admin/scholarships/:id/verify', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { verificationStatus, reason, evidence } = req.body as {
      verificationStatus?: string;
      reason?: string;
      evidence?: string;
    };

    if (!verificationStatus || !ALLOWED_VERIFICATION_STATUSES.has(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verificationStatus. Must be VERIFIED, NEEDS_REVIEW, or SUSPICIOUS.' });
    }
    if (!reason?.trim() || !evidence?.trim()) {
      return res.status(400).json({ error: 'Verification reason and primary source evidence are required.' });
    }

    const existing = await db.select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    const prevStatus = existing[0].verificationStatus;
    const [updated] = await db
      .update(scholarships)
      .set({
        verificationStatus,
        verificationReason: reason.trim(),
        verificationEvidence: evidence.trim(),
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(scholarships.id, id))
      .returning();

    await db.insert(verificationHistory).values({
      scholarshipId: id,
      previousStatus: prevStatus,
      newStatus: verificationStatus,
      reason: reason.trim(),
      evidence: evidence.trim(),
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
    });

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'VERIFY_SCHOLARSHIP',
      entityType: 'scholarship',
      entityId: String(id),
      details: { previousStatus: prevStatus, newStatus: verificationStatus, reason: reason.trim() },
    });

    // Notify bookmarked students
    const watchers = await db
      .select()
      .from(savedScholarships)
      .where(eq(savedScholarships.scholarshipId, id));

    for (const watcher of watchers) {
      await createNotification({
        userUid: watcher.userUid,
        type: verificationStatus === 'SUSPICIOUS' ? 'security_alert' : 'saved_update',
        title: `Verification Status Updated: ${updated.title}`,
        message: `Verification changed from ${prevStatus} to ${verificationStatus}. Reason: ${reason.trim()}`,
        linkTarget: `scholarship:${id}`,
      });
    }

    res.json({ scholarship: updated });
  } catch (error) {
    console.error('Admin verify scholarship error:', error);
    res.status(500).json({ error: 'Failed to update verification decision.' });
  }
});

apiRouter.patch('/admin/scholarships/:id/archive', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { isArchived } = req.body as { isArchived?: boolean };
    const [updated] = await db
      .update(scholarships)
      .set({ isArchived: Boolean(isArchived), updatedAt: new Date() })
      .where(eq(scholarships.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: isArchived ? 'ARCHIVE_SCHOLARSHIP' : 'RESTORE_SCHOLARSHIP',
      entityType: 'scholarship',
      entityId: String(id),
      details: { title: updated.title },
    });

    res.json({ scholarship: updated });
  } catch (error) {
    console.error('Admin archive error:', error);
    res.status(500).json({ error: 'Failed to update archive state.' });
  }
});

apiRouter.delete('/admin/scholarships/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }

    await db.delete(scholarships).where(eq(scholarships.id, id));
    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'DELETE_SCHOLARSHIP',
      entityType: 'scholarship',
      entityId: String(id),
      details: { title: existing[0].title },
    });

    res.json({ deleted: true });
  } catch (error) {
    console.error('Admin delete scholarship error:', error);
    res.status(500).json({ error: 'Failed to delete scholarship.' });
  }
});

apiRouter.patch('/admin/scam-reports/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
    const allowed = new Set(['Pending Review', 'Under Investigation', 'Confirmed Fraud', 'Dismissed']);
    if (!status || !allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid report status.' });
    }

    const [updated] = await db
      .update(scamReports)
      .set({
        status,
        adminNotes: typeof adminNotes === 'string' ? adminNotes.trim() : '',
        reviewedByUid: req.profile!.uid,
        updatedAt: new Date(),
      })
      .where(eq(scamReports.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Scam report not found.' });
    }

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'REVIEW_SCAM_REPORT',
      entityType: 'scam_report',
      entityId: String(id),
      details: { status, reportedTitle: updated.reportedTitle },
    });

    res.json({ report: updated });
  } catch (error) {
    console.error('Admin scam report review error:', error);
    res.status(500).json({ error: 'Failed to update scam report.' });
  }
});

apiRouter.patch('/admin/users/:uid/role', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const targetUid = req.params.uid;
    const { role } = req.body as { role?: string };
    if (role !== 'student' && role !== 'admin') {
      return res.status(400).json({ error: 'Role must be student or admin.' });
    }

    const [updated] = await db
      .update(profiles)
      .set({ role, updatedAt: new Date() })
      .where(eq(profiles.uid, targetUid))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    await db.insert(adminAuditLogs).values({
      actorUid: req.profile!.uid,
      actorEmail: req.profile!.email,
      action: 'UPDATE_USER_ROLE',
      entityType: 'profile',
      entityId: targetUid,
      details: { newRole: role, targetEmail: updated.email },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error('Admin role update error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});
