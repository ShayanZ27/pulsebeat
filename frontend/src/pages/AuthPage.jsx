import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { HeadphonesLineSVG, LogoPulseSVG, VinylDiscLineSVG } from '../components/icons/LineArt';
import { useLoginMutation, useRegisterMutation } from '../store/api';
import { selectCurrentUser } from '../store/authSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';

const EMPTY_FORM = { identifier: '', firstName: '', lastName: '', username: '', email: '', password: '' };

function Field({ id, label, optional, ...inputProps }) {
  return (
    <label htmlFor={id} className="block">
      <span className="block mb-2 text-xs font-space font-bold uppercase tracking-widest text-txt-sec">
        {label} {optional && <span className="normal-case tracking-normal font-inter font-medium text-txt-muted">(optional)</span>}
      </span>
      <input
        id={id}
        className="w-full bg-elevated border-2 border-brd text-txt text-sm rounded-xl py-3 px-4 outline-none placeholder:text-txt-muted focus:border-primary"
        {...inputProps}
      />
    </label>
  );
}

/** Combined login / sign-up page. Redirects back to where the user came from once signed in. */
export default function AuthPage() {
  const user = useSelector(selectCurrentUser);
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const location = useLocation();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const isSubmitting = isLoggingIn || isRegistering;
  const isLogin = mode === 'login';

  // Signed in (just now, or already) -> leave the auth page.
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;

  const update = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isLogin && /\s/.test(form.username)) {
      setError('Username cannot contain spaces');
      return;
    }

    try {
      if (isLogin) {
        await login({ identifier: form.identifier.trim(), password: form.password }).unwrap();
      } else {
        const { firstName, lastName, username, email, password } = form;
        await register({ firstName: firstName.trim(), lastName: lastName.trim(), username, email: email.trim(), password }).unwrap();
      }
      // On success the auth slice stores the user and the <Navigate> above takes over.
    } catch (err) {
      setError(err?.message ?? 'Something went wrong');
    }
  };

  return (
    <main className="relative min-h-screen h-screen overflow-y-auto bg-bg text-txt font-inter flex items-center justify-center px-5 py-10">
      {/* Decorative line art */}
      <HeadphonesLineSVG color={accentColor} className="pointer-events-none absolute -left-10 top-10 w-72 opacity-20 hidden md:block" />
      <VinylDiscLineSVG color={accentColor} className="pointer-events-none absolute -right-12 bottom-6 w-80 opacity-20 hidden md:block" />

      <section className="relative w-full max-w-md bg-card border border-brd rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <LogoPulseSVG color={accentColor} size={30} />
          <span className="text-[22px] font-playfair font-black tracking-tight">PulseBeat</span>
        </div>

        <h1 className="text-3xl font-playfair font-black tracking-tight mb-2">
          {isLogin ? 'Welcome back.' : 'Join the beat.'}
        </h1>
        <p className="text-sm text-txt-sec mb-8">
          {isLogin ? 'Sign in to pick up right where you left off.' : 'Create an account to start listening.'}
        </p>

        {/* Mode switch */}
        <div role="tablist" className="grid grid-cols-2 p-1 mb-8 rounded-xl bg-elevated border border-brd">
          {[['login', 'Log in'], ['signup', 'Sign up']].map(([value, label]) => (
            <button
              key={value}
              id={`auth-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => switchMode(value)}
              className="py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={mode === value ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
            >
              <span className={mode === value ? '' : 'text-txt-sec'}>{label}</span>
            </button>
          ))}
        </div>

        <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
          {isLogin ? (
            <Field
              id="auth-identifier" name="identifier" label="Username or email" autoComplete="username"
              value={form.identifier} onChange={update} required autoFocus
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field id="auth-first-name" name="firstName" label="First name" autoComplete="given-name" value={form.firstName} onChange={update} required autoFocus />
                <Field id="auth-last-name" name="lastName" label="Last name" optional autoComplete="family-name" value={form.lastName} onChange={update} />
              </div>
              <Field id="auth-username" name="username" label="Username" autoComplete="username" value={form.username} onChange={update} required />
              <Field id="auth-email" name="email" type="email" label="Email" autoComplete="email" value={form.email} onChange={update} required />
            </>
          )}

          <Field
            id="auth-password" name="password" type="password" label="Password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={form.password} onChange={update} required
          />

          {error && (
            <p id="auth-error" role="alert" className="text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>{isLogin ? 'Log in' : 'Create account'} <ArrowRight size={18} /></>}
          </button>
        </form>
      </section>
    </main>
  );
}
