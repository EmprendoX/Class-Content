import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF0FF',
          100: '#DCE0FF',
          200: '#B8C0FF',
          300: '#8B95FF',
          400: '#6D72E8',
          500: '#5550D6',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        accent: {
          50: '#FFF1ED',
          100: '#FFE0D6',
          200: '#FFC4B0',
          300: '#FF9E80',
          400: '#FF8458',
          500: '#FF6F3C',
          600: '#E8633A',
          700: '#C04E2A',
        },
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-jakarta)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'var(--font-jakarta)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
        pop: '0 8px 24px -8px rgba(79, 70, 229, 0.45), 0 4px 10px rgba(79, 70, 229, 0.18)',
        glow: '0 0 0 4px rgba(99, 102, 241, 0.18)',
        coral: '0 8px 24px -8px rgba(255, 111, 60, 0.4)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4F46E5 0%, #6D72E8 50%, #8B5CF6 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #EEF0FF 0%, #FFF1ED 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6F3C 0%, #FF8458 100%)',
        'gradient-ink': 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
        'gradient-hero':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(255, 111, 60, 0.08), transparent)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
