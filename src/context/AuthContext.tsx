import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { apiRequest } from '../lib/api';
import { Profile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  completionPercent: number;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completionPercent, setCompletionPercent] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBackendProfile = useCallback(async (firebaseUser: User) => {
    const idToken = await firebaseUser.getIdToken();
    setToken(idToken);
    try {
      const data = await apiRequest<{ profile: Profile; completionPercent: number }>(
        '/api/profile',
        {},
        idToken
      );
      setProfile(data.profile);
      setCompletionPercent(data.completionPercent);
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchBackendProfile(firebaseUser);
      } else {
        setToken(null);
        setProfile(null);
        setCompletionPercent(0);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchBackendProfile]);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    await fetchBackendProfile(cred.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchBackendProfile(cred.user);
  };

  const registerWithEmail = async (email: string, password: string, fullName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName.trim()) {
      await updateProfile(cred.user, { displayName: fullName.trim() });
    }
    await sendEmailVerification(cred.user);
    await fetchBackendProfile(cred.user);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setToken(null);
    setCompletionPercent(0);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      await fetchBackendProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        completionPercent,
        token,
        loading,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendResetEmail,
        resendVerification,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
