'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-8xl mb-6 animate-float">⚽</div>
        <h1 className="text-5xl font-black gradient-text mb-4">404</h1>
        <p className="text-xl text-white font-bold mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-8">Looks like this ball went out of bounds.</p>
        <Link href="/dashboard"
          className="px-6 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
          Back to Home
        </Link>
      </motion.div>
    </main>
  );
}
