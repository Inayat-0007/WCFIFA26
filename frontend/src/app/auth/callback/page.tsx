'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('wcf_token', token);
      // Trigger auth refresh
      window.location.href = '/dashboard';
    } else {
      router.push('/login?error=oauth');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin-slow">⚽</div>
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}
