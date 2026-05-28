'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type SignupForm = z.infer<typeof signupSchema>;
const AVATARS = ['⚽', '🏆', '🥅', '⭐', '🦁', '🐉', '🦅', '🔥', '💫', '🎯'];

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(data.name, data.email, data.password, selectedAvatar);
      toast.success('Account created! Welcome to WCF 2026! 🏆');
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string; code?: string };
      toast.error(e.response?.data?.message || e.message || 'Signup failed');
    } finally { setIsLoading(false); }
  };

  return (
    <main className="relative min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <div className="stadium-rays" />

      {/* Left visual (desktop) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #064E3B, #0A0E1A)' }}>
        <div className="orb orb-emerald w-[500px] h-[500px] -top-20 -left-20 opacity-40" />
        <div className="orb orb-gold w-[300px] h-[300px] bottom-10 right-10 opacity-20" style={{ animationDelay: '5s' }} />
        <div className="grid-pattern absolute inset-0 opacity-50" />
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
            className="w-20 h-20 rounded-3xl gradient-emerald flex items-center justify-center mx-auto mb-8 shadow-lg glow-emerald">
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-4xl font-display font-black text-white mb-4">Join the Game</h2>
          <p className="text-emerald-200/60 text-lg max-w-sm mx-auto">Create your manager account and start building your dream team.</p>
          <div className="flex gap-8 justify-center mt-12">
            {['Free Forever', 'Real-time Data', 'Private Leagues'].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400/50" />
                <span className="text-xs font-bold text-emerald-300/50 uppercase tracking-wider">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-display font-black mb-2" style={{ color: 'var(--text)' }}>Create Account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Join the world&apos;s biggest fantasy football tournament</p>

          <div className="card p-6 sm:p-8">
            {/* Avatar picker */}
            <div className="mb-5">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Choose avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setSelectedAvatar(emoji)}
                    className="w-11 h-11 text-xl rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: selectedAvatar === emoji ? 'var(--primary-glow)' : 'var(--surface)',
                      border: `2px solid ${selectedAvatar === emoji ? 'var(--primary)' : 'var(--border)'}`,
                      transform: selectedAvatar === emoji ? 'scale(1.1)' : 'scale(1)',
                    }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="name" type="text" placeholder="Your name" {...register('name')} className="input" />
                </div>
                {errors.name && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signup-email" type="email" placeholder="you@example.com" {...register('email')} className="input" />
                </div>
                {errors.email && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters (A-Z, a-z, 0-9, symbol)" {...register('password')}
                    className="input" style={{ paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Repeat password" {...register('confirmPassword')} className="input" />
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs" style={{ color: 'var(--accent)' }}>{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-center gap-2 text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                <span>Secured by Neon Auth with email verification</span>
              </div>

              <button id="signup-submit" type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl disabled:opacity-60">
                {isLoading ? 'Creating...' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="/login" className="font-bold transition-colors" style={{ color: 'var(--primary)' }}>Sign In</a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
