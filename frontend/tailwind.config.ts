import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        accent: {
          DEFAULT: '#DC143C',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC143C',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
        },
        gold: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        dark: {
          900: '#0A0E1A',
          800: '#0F1629',
          700: '#111827',
          600: '#1A2236',
          500: '#1F2937',
          400: '#374151',
          300: '#4B5563',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-dark': 'linear-gradient(135deg, #0A0E1A 0%, #0F1629 50%, #0A0E1A 100%)',
        'hero-light': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)',
        'pitch-gradient': 'linear-gradient(180deg, #0D4A2B 0%, #11593A 50%, #0D4A2B 100%)',
        'emerald-glow': 'radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16,185,129,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(16,185,129,0.4), 0 0 50px rgba(16,185,129,0.15)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
