import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { deadlineEmailSubscriptions, scholarships } from '../db/schema.ts';

export interface EmailSendResult {
  sent: boolean;
  provider: 'resend' | 'unconfigured';
  id?: string;
  reason?: string;
}

export function isEmailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailSendResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return {
      sent: false,
      provider: 'unconfigured',
      reason: 'RESEND_API_KEY is not configured in the server environment.',
    };
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  if (recipients.length === 0) {
    return { sent: false, provider: 'resend', reason: 'No recipients provided.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'ScholarShield Alerts <onboarding@resend.dev>',
        to: recipients,
        subject: params.subject,
        text: params.text,
        ...(params.html ? { html: params.html } : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        sent: false,
        provider: 'resend',
        reason: data.message || `Email provider returned HTTP ${response.status}`,
      };
    }

    return {
      sent: true,
      provider: 'resend',
      id: data.id,
    };
  } catch (error) {
    console.error('Resend email dispatch error:', error);
    return {
      sent: false,
      provider: 'resend',
      reason: error instanceof Error ? error.message : 'Email network request failed.',
    };
  }
}

export async function getMatchingVerifiedDeadlines(filters: {
  educationLevel?: string;
  courseStream?: string;
  stateScope?: string;
}) {
  const allVerified = await db
    .select()
    .from(scholarships)
    .where(and(eq(scholarships.isArchived, false), eq(scholarships.verificationStatus, 'VERIFIED')));

  return allVerified
    .filter((s) => {
      if (
        filters.educationLevel &&
        filters.educationLevel !== 'All' &&
        !s.educationLevel.toLowerCase().includes(filters.educationLevel.toLowerCase()) &&
        !s.educationLevel.toLowerCase().includes('all')
      ) {
        return false;
      }
      if (
        filters.courseStream &&
        filters.courseStream !== 'All' &&
        s.courseStream !== 'All Streams' &&
        !s.courseStream.toLowerCase().includes(filters.courseStream.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.stateScope &&
        filters.stateScope !== 'All' &&
        filters.stateScope !== 'All India' &&
        s.stateScope !== 'All India' &&
        !s.stateScope.toLowerCase().includes(filters.stateScope.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 6);
}

export async function sendDeadlineSubscriptionConfirmationEmail(params: {
  email: string;
  educationLevel: string;
  courseStream: string;
  stateScope: string;
}) {
  const upcoming = await getMatchingVerifiedDeadlines({
    educationLevel: params.educationLevel,
    courseStream: params.courseStream,
    stateScope: params.stateScope,
  });

  const appUrl = process.env.APP_URL || 'https://scholarshield.org';

  const textLines = [
    'Welcome to ScholarShield Scholarship Deadline Alerts!',
    '',
    `You are now subscribed to receive email updates for verified Indian scholarship deadlines.`,
    `Active Preferences: Level = ${params.educationLevel} | Stream = ${params.courseStream} | Region = ${params.stateScope}`,
    '',
    upcoming.length > 0 ? 'Upcoming Verified Scholarships Matching Your Preferences:' : 'No matching cycles listed right now; you will be notified as soon as new cycles are verified.',
    ...upcoming.map(
      (s, i) =>
        `${i + 1}. ${s.title} (${s.provider}) — Benefit: ${s.amountText} — Deadline: ${s.deadlineDate}\n   Official Portal: ${s.officialUrl}`
    ),
    '',
    `Always verify final dates directly on official .gov.in or institutional portals.`,
    `Visit ScholarShield: ${appUrl}`,
  ];

  const htmlRows = upcoming
    .map(
      (s) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
            <strong style="color:#0f172a;font-size:14px;">${escapeHtml(s.title)}</strong><br/>
            <span style="color:#475569;font-size:12px;">${escapeHtml(s.provider)} · ${escapeHtml(s.amountText)}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:13px;color:#1d4ed8;white-space:nowrap;">
            ${escapeHtml(s.deadlineDate)}
          </td>
        </tr>
      `
    )
    .join('');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
      <div style="background:#0B162C;color:#ffffff;padding:20px 24px;border-radius:10px 10px 0 0;">
        <h2 style="margin:0;font-size:20px;">ScholarShield Deadline Alerts</h2>
        <p style="margin:6px 0 0;font-size:13px;color:#67e8f9;">Rajeev Institute of Technology · Department of Computer Science</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 10px 10px;background:#ffffff;">
        <p style="margin:0 0 12px;font-size:14px;line-height:1.5;">
          Your email alert subscription is active. You will receive notifications whenever a new verified scholarship or deadline update matches your filters:
        </p>
        <p style="margin:0 0 18px;font-size:13px;color:#334155;background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
          <strong>Level:</strong> ${escapeHtml(params.educationLevel)} &nbsp;·&nbsp;
          <strong>Stream:</strong> ${escapeHtml(params.courseStream)} &nbsp;·&nbsp;
          <strong>Region:</strong> ${escapeHtml(params.stateScope)}
        </p>
        ${
          upcoming.length > 0
            ? `<h3 style="margin:0 0 8px;font-size:15px;">Current Verified Deadlines</h3>
               <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">${htmlRows}</table>`
            : `<p style="font-size:13px;color:#475569;">We will email you as soon as new verified deadlines matching your criteria are published.</p>`
        }
        <p style="margin:18px 0 0;font-size:12px;color:#64748b;">
          Always verify final dates on official .gov.in or institutional portals before submitting applications.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to: params.email,
    subject: `[ScholarShield] Scholarship Deadline Alerts Active (${upcoming.length} Verified Schemes)`,
    text: textLines.join('\n'),
    html,
  });

  return { result, upcomingCount: upcoming.length };
}

export async function broadcastScholarshipDeadlineAlert(params: {
  scholarship: {
    id: number;
    title: string;
    provider: string;
    amountText: string;
    educationLevel: string;
    courseStream: string;
    stateScope: string;
    deadlineDate: string;
    officialUrl: string;
    verificationStatus: string;
  };
  eventType: 'new_scholarship' | 'deadline_updated' | 'manual_broadcast';
}): Promise<{ matchedSubscribers: number; emailedCount: number; providerConfigured: boolean }> {
  const { scholarship, eventType } = params;
  const activeSubs = await db
    .select()
    .from(deadlineEmailSubscriptions)
    .where(eq(deadlineEmailSubscriptions.isActive, true));

  const matchingSubs = activeSubs.filter((sub) => {
    const levelMatch =
      sub.educationLevel === 'All' ||
      scholarship.educationLevel.toLowerCase().includes(sub.educationLevel.toLowerCase()) ||
      scholarship.educationLevel.toLowerCase().includes('all');
    const streamMatch =
      sub.courseStream === 'All' ||
      scholarship.courseStream === 'All Streams' ||
      scholarship.courseStream.toLowerCase().includes(sub.courseStream.toLowerCase());
    const stateMatch =
      sub.stateScope === 'All' ||
      sub.stateScope === 'All India' ||
      scholarship.stateScope === 'All India' ||
      scholarship.stateScope.toLowerCase().includes(sub.stateScope.toLowerCase());
    return levelMatch && streamMatch && stateMatch;
  });

  if (matchingSubs.length === 0) {
    return {
      matchedSubscribers: 0,
      emailedCount: 0,
      providerConfigured: isEmailServiceConfigured(),
    };
  }

  const subjectPrefix =
    eventType === 'new_scholarship'
      ? 'New Scholarship Listed'
      : eventType === 'deadline_updated'
        ? 'Scholarship Deadline Updated'
        : 'Scholarship Deadline Reminder';

  const subject = `[ScholarShield] ${subjectPrefix}: ${scholarship.title} (${scholarship.deadlineDate})`;
  const text = [
    `${subjectPrefix}`,
    `Scholarship: ${scholarship.title}`,
    `Provider: ${scholarship.provider}`,
    `Benefit: ${scholarship.amountText}`,
    `Deadline: ${scholarship.deadlineDate}`,
    `Verification Status: ${scholarship.verificationStatus}`,
    `Official URL: ${scholarship.officialUrl}`,
    '',
    'Always verify deadlines directly on official portals before applying.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:580px;margin:0 auto;color:#0f172a;">
      <div style="background:#0B162C;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0;">
        <h2 style="margin:0;font-size:18px;">${escapeHtml(subjectPrefix)}</h2>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:22px;border-radius:0 0 10px 10px;background:#fff;">
        <h3 style="margin:0 0 8px;font-size:16px;color:#0f172a;">${escapeHtml(scholarship.title)}</h3>
        <p style="margin:0 0 12px;font-size:13px;color:#475569;">${escapeHtml(scholarship.provider)} · ${escapeHtml(scholarship.amountText)}</p>
        <p style="margin:0 0 12px;font-size:14px;"><strong>Deadline:</strong> <span style="color:#1d4ed8;font-family:monospace;">${escapeHtml(scholarship.deadlineDate)}</span></p>
        <p style="margin:0 0 16px;font-size:13px;"><strong>Verification Status:</strong> ${escapeHtml(scholarship.verificationStatus)}</p>
        <a href="${escapeHtml(scholarship.officialUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">Visit Official Portal</a>
      </div>
    </div>
  `;

  let emailedCount = 0;
  const providerConfigured = isEmailServiceConfigured();

  for (const sub of matchingSubs) {
    if (providerConfigured) {
      const res = await sendEmail({ to: sub.email, subject, text, html });
      if (res.sent) {
        emailedCount += 1;
        await db
          .update(deadlineEmailSubscriptions)
          .set({ lastNotifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(deadlineEmailSubscriptions.id, sub.id));
      }
    }
  }

  return {
    matchedSubscribers: matchingSubs.length,
    emailedCount,
    providerConfigured,
  };
}
