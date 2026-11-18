import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { DeadlineSubscription } from '../types';

interface DeadlineAlertSignupProps {
  defaultLevel?: string;
  defaultStream?: string;
  defaultState?: string;
  compact?: boolean;
  onSubscriptionChanged?: () => void;
}

interface SubscriptionStatusResponse {
  emailServiceConfigured: boolean;
  subscription: DeadlineSubscription | null;
}

interface SubscribeResponse {
  subscription: DeadlineSubscription;
  emailSent: boolean;
  provider: string;
  emailStatusMessage: string;
  upcomingCount: number;
}

export const DeadlineAlertSignup: React.FC<DeadlineAlertSignupProps> = ({
  defaultLevel = 'All',
  defaultStream = 'All',
  defaultState = 'All India',
  compact = false,
  onSubscriptionChanged,
}) => {
  const { user, profile, token } = useAuth();

  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [educationLevel, setEducationLevel] = useState(defaultLevel);
  const [courseStream, setCourseStream] = useState(defaultStream);
  const [stateScope, setStateScope] = useState(defaultState);

  const [subscription, setSubscription] = useState<DeadlineSubscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const knownEmail = profile?.email || user?.email;
    if (knownEmail && !email) {
      setEmail(knownEmail);
    }
  }, [profile?.email, user?.email, email]);

  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const queryEmail = email.trim();
        const url = queryEmail
          ? `/api/deadline-subscriptions/status?email=${encodeURIComponent(queryEmail)}`
          : '/api/deadline-subscriptions/status';
        const res = await apiRequest<SubscriptionStatusResponse>(url, {}, token);
        if (!active) return;
        if (res.subscription) {
          setSubscription(res.subscription);
          if (res.subscription.isActive) {
            setEducationLevel(res.subscription.educationLevel);
            setCourseStream(res.subscription.courseStream);
            setStateScope(res.subscription.stateScope);
          }
        }
      } catch {
        // Silent background check
      }
    };
    if (user || email.trim().includes('@')) {
      checkStatus();
    }
    return () => {
      active = false;
    };
  }, [user, token, email]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address to receive scholarship deadline alerts.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<SubscribeResponse>(
        '/api/deadline-subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            email: cleanEmail,
            educationLevel,
            courseStream,
            stateScope,
          }),
        },
        token
      );
      setSubscription(res.subscription);
      setFeedback(res.emailStatusMessage);
      onSubscriptionChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save notification subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email.trim()) return;
    setUnsubscribing(true);
    setError('');
    setFeedback('');
    try {
      await apiRequest(
        `/api/deadline-subscriptions?email=${encodeURIComponent(email.trim())}`,
        { method: 'DELETE' },
        token
      );
      setSubscription((prev) => (prev ? { ...prev, isActive: false } : null));
      setFeedback(`Unsubscribed ${email.trim()} from scholarship deadline email alerts.`);
      onSubscriptionChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unsubscribe.');
    } finally {
      setUnsubscribing(false);
    }
  };

  const isSubscribedActive = Boolean(
    subscription?.isActive &&
      subscription.email.toLowerCase() === email.trim().toLowerCase()
  );

  return (
    <section
      aria-label="Scholarship Deadline Email Alerts"
      className={`rounded-xl border border-slate-200 bg-white ${
        compact ? 'p-5' : 'p-6 sm:p-8'
      }`}
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 shrink-0">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-slate-900`}>
              Scholarship Deadline Email Alerts
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Get notified by email whenever new verified scholarships open or application deadlines change for your track.
            </p>
          </div>
        </div>

        {isSubscribedActive && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 shrink-0">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Active Subscription</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      <form onSubmit={handleSubscribe} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <label htmlFor={`deadline-email-${compact ? 'c' : 'f'}`} className="sr-only">
            Email address for scholarship deadline alerts
          </label>
          <Mail
            className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id={`deadline-email-${compact ? 'c' : 'f'}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email (e.g. student@rit.edu.in)"
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`deadline-level-${compact ? 'c' : 'f'}`} className="sr-only">
            Education Level
          </label>
          <select
            id={`deadline-level-${compact ? 'c' : 'f'}`}
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Levels</option>
            <option value="High School">High School / PUC</option>
            <option value="Diploma">Diploma</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`deadline-stream-${compact ? 'c' : 'f'}`} className="sr-only">
            Course Stream
          </label>
          <select
            id={`deadline-stream-${compact ? 'c' : 'f'}`}
            value={courseStream}
            onChange={(e) => setCourseStream(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Streams</option>
            <option value="Engineering & Technology">Engineering &amp; Tech</option>
            <option value="Science & Research">Science &amp; Research</option>
            <option value="Medical">Medical</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`deadline-state-${compact ? 'c' : 'f'}`} className="sr-only">
            Region or State
          </label>
          <select
            id={`deadline-state-${compact ? 'c' : 'f'}`}
            value={stateScope}
            onChange={(e) => setStateScope(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="All India">All India</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="North East">North East Region</option>
          </select>
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] w-full rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60 whitespace-nowrap"
          >
            {submitting
              ? 'Saving...'
              : isSubscribedActive
                ? 'Update Alerts'
                : 'Notify Me'}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Only verified or under-review schemes trigger alerts · Zero spam · Unsubscribe anytime
        </span>
        {isSubscribedActive && (
          <button
            type="button"
            disabled={unsubscribing}
            onClick={handleUnsubscribe}
            className="font-semibold text-red-700 hover:underline"
          >
            {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        )}
      </div>
    </section>
  );
};
