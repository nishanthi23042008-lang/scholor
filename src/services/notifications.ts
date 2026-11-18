import { db } from '../db/index.ts';
import { notifications, profiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function createNotification(params: {
  userUid: string;
  type:
    | 'deadline'
    | 'new_scholarship'
    | 'saved_update'
    | 'missing_docs'
    | 'application_status'
    | 'security_alert';
  title: string;
  message: string;
  linkTarget?: string;
}) {
  const inserted = await db
    .insert(notifications)
    .values({
      userUid: params.userUid,
      type: params.type,
      title: params.title,
      message: params.message,
      linkTarget: params.linkTarget || '',
    })
    .returning();

  // Optional transactional email dispatch if RESEND_API_KEY is configured and user opted in
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const userRows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.uid, params.userUid))
        .limit(1);

      const userProfile = userRows[0];
      if (userProfile?.email && userProfile.emailReminders) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'ScholarShield Alerts <onboarding@resend.dev>',
            to: [userProfile.email],
            subject: `[ScholarShield] ${params.title}`,
            text: `${params.message}\n\nLog in to ScholarShield to review your dashboard.`,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Optional email notification dispatch failed:', emailErr);
    }
  }

  return inserted[0];
}
