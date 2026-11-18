import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, Mail, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialPortal?: 'student' | 'admin';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialPortal = 'student',
  onClose,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, sendResetEmail } = useAuth();
  const [portal, setPortal] = useState<'student' | 'admin'>(initialPortal);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const formatAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : 'Authentication failed.';
    if (raw.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not yet enabled in Firebase Console. Please use "Continue with Google" or enable Email/Password under Firebase Auth Providers.';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'Sign-in popup was closed before completion.';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (raw.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Switch to Sign In.';
    }
    return raw;
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      if (mode === 'reset') {
        if (!email.trim()) throw new Error('Enter your registered email address.');
        await sendResetEmail(email.trim());
        setInfoMsg('Password reset email dispatched. Check your inbox and spam folder.');
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await registerWithEmail(email.trim(), password, fullName);
        setInfoMsg('Account created and verification email sent to your inbox.');
        onSuccess?.();
        onClose();
      } else {
        await signInWithEmail(email.trim(), password);
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold text-slate-900">
              {portal === 'admin' ? 'Administrator Portal Sign In' : 'Sign in to ScholarShield'}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {portal === 'admin'
                ? 'Requires an authorized administrator account verified by server-side RBAC.'
                : 'Access personalized eligibility matching, saved schemes, and application tracking.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close authentication modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Portal selector */}
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setPortal('student')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              portal === 'student'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => {
              setPortal('admin');
              setMode('login');
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              portal === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Access
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <Shield className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Continue with Google
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or use email credentials</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'register' && portal === 'student' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-xs font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="auth-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu.in"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
          >
            {busy
              ? 'Processing...'
              : mode === 'register'
                ? 'Create Student Account'
                : mode === 'reset'
                  ? 'Send Password Reset Email'
                  : portal === 'admin'
                    ? 'Sign In to Admin Portal'
                    : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {portal === 'student' && mode !== 'register' && (
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="font-medium text-blue-700 hover:underline"
            >
              Create new student account
            </button>
          )}
          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="font-medium text-blue-700 hover:underline"
            >
              Back to Sign In
            </button>
          )}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
