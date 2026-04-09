/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', 
          600: '#e11d48',
          700: '#be123c',
        },
        sage: {
          50: '#f0f7f4',
          100: '#d8ede3',
          200: '#b5dbcb',
          300: '#85c0a8',
          400: '#5ea385',
          500: '#509573',
          600: '#3d765a',
          700: '#325e49',
          800: '#284a3b',
          900: '#213d31',
        },
        purple: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        cream: {
          50: '#fcfbf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
        },
        charcoal: {
          800: '#374151',
          900: '#1f2937',
        }
      }
    },
  },
  plugins: [],
}