import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC143C',
          50: '#fff0f3',
          100: '#ffe0e6',
          200: '#ffc0cc',
          300: '#ff8fa3',
          400: '#ff4d6d',
          500: '#DC143C',
          600: '#c0102f',
          700: '#a00d27',
          800: '#850e24',
          900: '#710f23',
        },
        gold: {
          DEFAULT: '#FFD700',
          50: '#fffde7',
          100: '#fff9c4',
          200: '#fff176',
          300: '#ffe940',
          400: '#FFD700',
          500: '#ffc400',
          600: '#ffab00',
          700: '#ff8f00',
          800: '#ff6f00',
          900: '#e65100',
        },
        dark: {
          900: '#0A0A0F',
          800: '#111118',
          700: '#1A1A24',
          600: '#222230',
          500: '#2D2D3F',
          400: '#3A3A50',
          300: '#4A4A62',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0A0A0F 0%, #1a0510 50%, #0A0A0F 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(220,20,60,0.1) 0%, rgba(255,215,0,0.05) 100%)',
        'pitch-gradient': 'linear-gradient(180deg, #1a4d2e 0%, #16a34a 30%, #15803d 70%, #1a4d2e 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(220, 20, 60, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 0 40px rgba(220, 20, 60, 0.3)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
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
