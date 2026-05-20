/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d18',
          900: '#071525',
          800: '#0b1f35',
          700: '#0f2a47',
          600: '#143459',
          500: '#1a4070',
        },
        teal: {
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
