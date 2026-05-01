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
        // Calm Medical colors - Updated to Sleek Professional Teal
        // Home Page Brand Palette (Deep Clinic Green & Cream)
        brand: {
          50: '#F5F2ED',  // Cream
          100: '#E2E8F0', 
          200: '#A3CCBB',
          300: '#75B398',
          400: '#3D7A68', // dg-lite
          500: '#2D5748', // dg-mid
          600: '#1A3C34', // dg (Main Dark Green)
          700: '#15302A',
          800: '#0F241F',
          900: '#0A1815',
          950: '#050C0A',
          teal: '#00C9B1', // Teal Accent
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
