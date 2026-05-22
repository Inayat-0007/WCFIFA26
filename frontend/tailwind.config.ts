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
          DEFAULT: '#e6b619',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e6b619',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        gold: {
          DEFAULT: '#e6b619',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e6b619',
          600: '#d4af37',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        accent: {
          DEFAULT: '#E63946',
          50: '#fff0f1',
          100: '#ffdee1',
          200: '#ffc4c9',
          300: '#ffa1a9',
          400: '#ff707e',
          500: '#E63946',
          600: '#d12431',
          700: '#b01925',
          800: '#911722',
          900: '#791922',
        },
        dark: {
          900: '#0B0B0C',
          800: '#121214',
          700: '#1C1C1E',
          600: '#28282C',
          500: '#34343A',
          400: '#464650',
          300: '#585864',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0B0B0C 0%, #1c150c 50%, #0B0B0C 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(230,182,25,0.08) 0%, rgba(230,57,70,0.04) 100%)',
        'pitch-gradient': 'linear-gradient(180deg, #133b22 0%, #174829 30%, #143e24 70%, #133b22 100%)',
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
          '0%, 100%': { boxShadow: '0 0 5px rgba(230, 182, 25, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(230, 182, 25, 0.6), 0 0 40px rgba(230, 182, 25, 0.2)' },
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
