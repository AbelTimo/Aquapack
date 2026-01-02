/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        aqua: {
          50: '#f0fbff',
          100: '#e0f7fe',
          200: '#b8effd',
          300: '#83E1FC',
          400: '#4fd4fa',
          500: '#22c5f0',
          600: '#0ea5d6',
          700: '#0c84ad',
          800: '#0e6a8c',
          900: '#115873',
          950: '#0a3a4d',
        },
      },
    },
  },
  plugins: [],
};
