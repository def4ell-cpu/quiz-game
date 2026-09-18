/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        spark: {
          bg: '#0b0717',
          card: '#161028',
          primary: '#7c3aed',
          accent: '#22d3ee',
          gold: '#fbbf24',
        },
      },
    },
  },
  plugins: [],
};