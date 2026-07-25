/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode tokens
        background: 'var(--color-background)',
        surface:    'var(--color-surface)',
        surface2:   'var(--color-surface2)',
        border:     'var(--color-border)',
        text:       'var(--color-text)',
        textMuted:  'var(--color-text-muted)',
        textSub:    'var(--color-text-sub)',
        primary:    '#14b8a6',
        secondary:  '#2dd4bf',
        accent:     '#0d9488',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon':        '0 0 15px rgba(20, 184, 166, 0.3)',
        'neon-strong': '0 0 25px rgba(45, 212, 191, 0.5)',
        'card':        '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':  '0 4px 20px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
