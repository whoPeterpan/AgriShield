import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';
import { useApp } from '../context/AppContext.jsx';

const ROLE_OPTIONS = [
  { value: 'farmer', label: 'Farmer', labelHi: 'किसान' },
  { value: 'veterinarian', label: 'Veterinarian', labelHi: 'पशु चिकित्सक' },
  { value: 'authority', label: 'Authority', labelHi: 'अधिकारी' },
];

export default function Auth({ onAuthSuccess }) {
  const { language, signInWithSupabase, signUpWithSupabase, signInWithGoogle } = useApp();
  const isHi = language === 'hi';

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleOAuthLink, setGoogleOAuthLink] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleOAuthLink(null);
  };

  const validateForm = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    if (mode === 'signup') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        return 'Please enter your full name (at least 2 characters).';
      }
      if (!ROLE_OPTIONS.some((r) => r.value === role)) {
        return 'Please select a valid role (Farmer, Veterinarian, or Authority).';
      }
    }
    return '';
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleOAuthLink(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.isIframe && res?.url) {
        setGoogleOAuthLink({ url: res.url, redirectTo: res.redirectTo });
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Unable to start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleOAuthLink(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Cloud login requires VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY. Use Instant Demo Access above to explore immediately.'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await signInWithSupabase(email.trim(), password);
        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Signed in successfully.');
          if (onAuthSuccess) onAuthSuccess();
        }
      } else {
        const res = await signUpWithSupabase({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
        });
        if (res?.error) {
          setErrorMsg(res.error);
        } else if (res?.needsEmailConfirmation) {
          setSuccessMsg(
            'Account registered! Check your email inbox to confirm your address before signing in.'
          );
        } else {
          setSuccessMsg('Account created and signed in.');
          if (onAuthSuccess) onAuthSuccess();
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <section
      className="h-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
      aria-label="Account Sign In and Registration"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isHi ? 'खाता साइन इन या पंजीकरण' : 'Account Access'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHi ? 'अपने क्लाउड फार्म रिकॉर्ड सिंक करें' : 'Sync records across devices with Supabase'}
          </p>
        </div>
        <span className="text-[11px] font-medium text-emerald-800 whitespace-nowrap">
          {isSupabaseConfigured ? 'Supabase Auth' : 'Demo Ready'}
        </span>
      </div>

      {/* Segmented Sign In / Sign Up Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F2] rounded-xl" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => switchMode('signin')}
          disabled={isBusy}
          className={`py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            mode === 'signin'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isHi ? 'साइन इन' : 'Sign In'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => switchMode('signup')}
          disabled={isBusy}
          className={`py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            mode === 'signup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isHi ? 'नया खाता' : 'Sign Up'}
        </button>
      </div>

      {/* Role Selector & Google Auth */}
      <div className="space-y-3">
        <div>
          <label htmlFor="auth-role" className="block text-xs font-medium text-slate-700 mb-1.5">
            {isHi ? 'उपयोगकर्ता भूमिका' : 'Account Role'}
          </label>
          <select
            id="auth-role"
            disabled={isBusy}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:opacity-60 transition-colors"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {isHi ? opt.labelHi : opt.label}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.16 }}
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-all min-h-[44px]"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </motion.button>
      </div>

      {/* Iframe-Safe Google OAuth Launch Link */}
      {googleOAuthLink && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-200 bg-[#EEF5F0] p-3.5 space-y-2.5 text-xs text-slate-700"
        >
          <p className="font-semibold text-[#0D3B26]">
            Google requires sign-in outside embedded preview frames. Open in a new tab:
          </p>
          <a
            href={googleOAuthLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D3B26] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#145235] transition-colors"
          >
            <span>Open Google Sign-In</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <p className="text-[11px] text-slate-600 break-all">
            Redirect URL: <span className="font-mono">{googleOAuthLink.redirectTo}</span>
          </p>
        </motion.div>
      )}

      <div className="relative flex items-center py-0.5">
        <div className="flex-grow border-t border-slate-200" />
        <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
          {isHi ? 'या ईमेल से जारी रखें' : 'or continue with email'}
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <AnimatePresence mode="initial">
          {mode === 'signup' && (
            <motion.div
              key="fullname-field"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                {isHi ? 'पूरा नाम' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  disabled={isBusy}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rajeshwari Devi"
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:opacity-60 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1">
            {isHi ? 'ईमेल पता' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              disabled={isBusy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:opacity-60 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1">
            {isHi ? 'पासवर्ड' : 'Password'}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              disabled={isBusy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-200 bg-[#FAFBF9] pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:opacity-60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="text-xs text-emerald-900 bg-[#EEF5F0] border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        <motion.button
          type="submit"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.16 }}
          disabled={isBusy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D3B26] px-4 py-3 text-sm font-semibold text-white hover:bg-[#145235] disabled:opacity-60 transition-colors min-h-[46px]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>
            {loading
              ? mode === 'signin'
                ? 'Signing In...'
                : 'Creating Account...'
              : mode === 'signin'
              ? isHi
                ? 'साइन इन करें'
                : 'Sign In'
              : isHi
              ? 'खाता बनाएं'
              : 'Create Account'}
          </span>
        </motion.button>
      </form>
    </section>
  );
}
