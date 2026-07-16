import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core theme — pure black/white with graphite steps for depth.
        void: '#000000',
        ink: '#0a0a0a',
        panel: '#111111',
        line: '#2a2a2a',
        mist: '#8a8a8a',
        paper: '#ffffff',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.35em',
      },
      keyframes: {
        pulseFade: {
          '0%, 100%': { opacity: '1', color: '#ffffff' },
          '50%': { opacity: '0.35', color: '#8a8a8a' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseFade: 'pulseFade 1.4s ease-in-out infinite',
        scan: 'scan 2.4s linear infinite',
        fadeUp: 'fadeUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
