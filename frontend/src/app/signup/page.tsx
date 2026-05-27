'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

const AVATARS = ['⚽', '🏆', '🥅', '⭐', '🦁', '🐉', '🦅', '🔥', '💫', '🎯'];

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(data.name, data.email, data.password, selectedAvatar);
      toast.success('Account created! Welcome to World Cup Fantasy 2026! 🏆');
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string; code?: string };
      let msg = 'Signup failed. Please try again.';
      if (axiosErr.response?.data?.message) {
        msg = axiosErr.response.data.message;
      } else if (axiosErr.code === 'ERR_NETWORK' || axiosErr.code === 'ECONNREFUSED') {
        msg = 'Cannot connect to server. Please try again in a moment.';
      } else if (axiosErr.message) {
        msg = axiosErr.message;
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden px-4 py-8">
      <div className="orb orb-red w-[500px] h-[500px] top-[-200px] left-[-200px] opacity-30" />
      <div className="orb orb-gold w-[350px] h-[350px] bottom-[-100px] right-[-100px] opacity-20" style={{ animationDelay: '4s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-black gradient-text mb-1">Join the Fantasy</h1>
          <p className="text-gray-400 text-sm">Create your World Cup Fantasy 2026 account</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {/* Avatar Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-300 mb-3">Choose your avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all duration-200 ${
                    selectedAvatar === emoji
                      ? 'bg-primary-500/20 border-2 border-primary-500 scale-110'
                      : 'bg-dark-700 border-2 border-dark-500 hover:border-dark-400'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  {...register('name')}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-primary-400">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-primary-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  {...register('password')}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-primary-400">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  {...register('confirmPassword')}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-primary-400">{errors.confirmPassword.message}</p>}
            </div>

            {/* Neon Auth badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>Secured by Neon Auth with email verification</span>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #DC143C, #a01030)',
                boxShadow: '0 4px 20px rgba(220,20,60,0.3)',
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account 🏆'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
              Sign In
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
