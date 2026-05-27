'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! 🏆');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    let apiUrl = '';
    // Always use production URL when on Vercel
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('vercel.app') || host.includes('wcfifa')) {
        apiUrl = 'https://wcfifa26.onrender.com';
      }
    }
    if (!apiUrl) {
      apiUrl = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://localhost:4000';
    }
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <main className="relative min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div className="orb orb-red w-[500px] h-[500px] top-[-150px] right-[-150px] opacity-30" />
      <div className="orb orb-gold w-[350px] h-[350px] bottom-[-100px] left-[-100px] opacity-20" style={{ animationDelay: '4s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
            className="text-5xl mb-3"
          >
            ⚽
          </motion.div>
          <h1 className="text-3xl font-black gradient-text mb-1">World Cup Fantasy</h1>
          <p className="text-gray-400 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-primary-400">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
              style={{
                background: 'linear-gradient(135deg, #DC143C, #a01030)',
                boxShadow: '0 4px 20px rgba(220,20,60,0.3)',
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In 🏆'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-dark-500" />
            <span className="px-3 text-xs text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-dark-500" />
          </div>

          {/* Google */}
          <button
            id="google-login"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-3 glass-red hover:scale-[1.02] transition-transform duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
              Sign Up
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
