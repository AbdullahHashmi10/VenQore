/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vq: {
          dark: {
            base: '#090A0C',
            s1: '#101216',
            s2: '#171A21',
            s3: '#20242E',
            s4: '#2B303C',
            primary: '#F3F4F6',
            secondary: '#9CA3AF',
            tertiary: '#6B7280',
            hairline: '#1F242D',
            strong: '#374151',
          },
          light: {
            base: '#F8F9FA',
            s1: '#FFFFFF',
            s2: '#F1F3F5',
            s3: '#E9ECEF',
            primary: '#111827',
            secondary: '#4B5563',
            tertiary: '#9CA3AF',
            hairline: '#E2E8F0',
            strong: '#CBD5E1',
          },
          tungsten: {
            DEFAULT: '#D8A24A',
            hover: '#E5B35C',
            sub: '#2C2213',
          },
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          offline: '#38BDF8',
          amethyst: '#8B5CF6',
          copper: '#E67E22',
        },
      },
      fontFamily: {
        sans: ['var(--vq-font-sans)'],
        mono: ['var(--vq-font-mono)'],
        serif: ['var(--vq-font-serif)'],
      },
      borderRadius: {
        'vq-sm': '3px',
        'vq-md': '5px',
        'vq-lg': '8px',
        'vq-xl': '12px',
      },
      transitionTimingFunction: {
        'vq-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
