'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [demoLink, setDemoLink] = useState('');

  // Check for reset token in URL on load
  useEffect(() => {
    const token = searchParams?.get('resetToken');
    if (token) {
      setResetToken(token);
      setShowForgotModal(true);
    }
  }, [searchParams]);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Email is required');
      return;
    }
    setIsForgotLoading(true);
    setDemoLink('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Reset link generated!');
      if (res.data?.data?.resetLink) {
        setDemoLink(res.data.data.resetLink);
        setTempToken(res.data.data.resetToken);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate reset link');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordVal) {
      toast.error('Password is required');
      return;
    }
    if (resetPasswordVal.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: resetToken,
        password: resetPasswordVal,
      });
      toast.success('Password updated successfully! Please log in.');
      setResetToken('');
      setTempToken('');
      setShowForgotModal(false);
      setResetPasswordVal('');
      setDemoLink('');
      router.replace('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setIsResetLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! ⚽');
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string; code?: string };
      toast.error(e.response?.data?.message || e.message || 'Login failed');
    } finally { setIsLoading(false); }
  };

  return (
    <main className="relative min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <div className="stadium-rays" />

      {/* Left visual panel (desktop only) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #064E3B, #0A0E1A)' }}>
        <div className="orb orb-emerald w-[500px] h-[500px] top-10 left-10 opacity-40" />
        <div className="orb orb-cyan w-[300px] h-[300px] bottom-20 right-10 opacity-30" style={{ animationDelay: '4s' }} />
        <div className="grid-pattern absolute inset-0 opacity-50" />
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="w-20 h-20 rounded-3xl gradient-emerald flex items-center justify-center mx-auto mb-8 shadow-lg glow-emerald"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-4xl font-display font-black text-white mb-4">Welcome Back</h2>
          <p className="text-emerald-200/60 text-lg max-w-sm mx-auto">Sign in to manage your squads and dominate your leagues.</p>
          <div className="flex gap-6 justify-center mt-12">
            {['48 Teams', '80 Matches', 'Live Scoring'].map((s) => (
              <span key={s} className="text-xs font-bold text-emerald-300/50 uppercase tracking-wider">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-display font-black mb-2" style={{ color: 'var(--text)' }}>Sign In</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Enter your credentials to access your dashboard</p>

          <div className="card p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} className="input" />
                </div>
                {errors.email && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" {...register('password')}
                    className="input" style={{ paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.password.message}</p>}
                <div className="flex justify-between items-center mt-2 select-none">
                  <span />
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold transition-colors hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl disabled:opacity-60">
                {isLoading ? 'Signing in...' : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="px-4 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {/* Google */}
            <button id="google-login" onClick={() => loginWithGoogle()} className="btn-ghost w-full py-3.5 flex items-center justify-center gap-3 text-sm font-semibold rounded-xl">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09A6.9 6.9 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-bold transition-colors" style={{ color: 'var(--primary)' }}>Sign Up</a>
          </p>
        </motion.div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {(showForgotModal || resetToken) && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              setShowForgotModal(false);
              setResetToken('');
              setTempToken('');
              setDemoLink('');
            }}
          />
          <div
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 card p-6 sm:p-8 animate-float"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-xl">
                {resetToken ? 'Reset Password' : 'Forgot Password'}
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setResetToken('');
                  setTempToken('');
                  setDemoLink('');
                }}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            {resetToken ? (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Your password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isResetLoading} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl disabled:opacity-60">
                  {isResetLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Enter your email address and we will generate a password reset link for your account.
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isForgotLoading} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl disabled:opacity-60">
                  {isForgotLoading ? 'Generating Link...' : 'Generate Reset Link'}
                </button>

                {demoLink && (
                  <div className="mt-4 p-4 rounded-xl border border-dashed text-center" style={{ background: 'var(--primary-glow)', borderColor: 'rgba(16,185,129,0.3)' }}>
                    <p className="text-xs font-bold mb-3" style={{ color: 'var(--primary)' }}>
                      [DEMO MODE] Reset link generated successfully!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setResetToken(tempToken);
                      }}
                      className="w-full py-2.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
                    >
                      Reset Password Now
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </>
      )}
    </main>
  );
}
