/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Surfaces
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',

        // Brand: tonton orange
        tonton: {
          50: '#FDF4EC',
          100: '#FCE6D2',
          200: '#F8C89B',
          300: '#F2A765',
          400: '#EC893E',
          500: '#E66B2B', // primary
          600: '#C7521B',
          700: '#9F3E14',
          800: '#762D0E',
          900: '#4D1D08',
        },

        // Status palette (used everywhere consistently)
        approved: '#E66B2B', // orange — approved days off
        pending: '#D9A21B',  // mustard yellow — pending
        rejected: '#9A8E80', // warm grey — rejected
        sick: '#C0395C',     // pink-red — sick leave
        working: '#5E7148',  // olive — working

        // Tinted neutrals (warm-stone)
        warm: {
          50: '#FAF6EF',
          100: '#F2EBDD',
          150: '#EADFC9',
          200: '#E1D2B6',
          300: '#C9B795',
          400: '#A4906B',
          500: '#7E6B4F',
          600: '#5E4F3B',
          700: '#43382A',
          800: '#2C2419',
          900: '#1A1510',
        },
      },
      boxShadow: {
        'soft': '0 1px 0 rgb(var(--line) / 1), 0 8px 24px -12px rgb(74 56 42 / 0.18)',
        'raise': '0 1px 0 rgb(var(--line) / 1), 0 18px 40px -18px rgb(74 56 42 / 0.28)',
        'inset-soft': 'inset 0 0 0 1px rgb(var(--line) / 1)',
        'focus': '0 0 0 4px rgb(230 107 43 / 0.18)',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px',
      },
      letterSpacing: {
        tightish: '-0.012em',
        widish: '0.04em',
        caps: '0.14em',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
        'pop': 'pop 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
