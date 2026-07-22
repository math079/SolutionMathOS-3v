/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a', // very dark background
        surface: '#171717', // slightly lighter for cards
        surface2: '#262626', // slightly lighter for borders/hover
        primary: '#14b8a6', // teal-500 (Neon accent)
        secondary: '#2dd4bf', // teal-400 (Lighter neon)
        accent: '#0d9488', // teal-600
        text: '#f8fafc', // almost white
        textMuted: '#94a3b8', // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(20, 184, 166, 0.3)',
        'neon-strong': '0 0 25px rgba(45, 212, 191, 0.5)',
      }
    },
  },
  plugins: [],
}
