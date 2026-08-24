/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railDark: '#0f172a',
        railCard: '#1e293b',
        railAccent: '#3b82f6',
      }
    },
  },
  plugins: [],
}
