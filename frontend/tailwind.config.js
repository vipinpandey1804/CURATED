import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAFAF8',
          dark: '#1A1A1A',
          darker: '#111111',
          muted: '#6B7280',
          border: '#E5E5E0',
          accent: '#C9B99A',
          cream: '#F5F0E8',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [tailwindAnimate],
}
