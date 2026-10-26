/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8F4',
          100: '#FFF0E8',
          200: '#FED7C2',
          300: '#FDB693',
          400: '#FA8755',
          500: '#F56527', // Primary brand color
          600: '#E55316', // Primary hover color
          700: '#C23D09',
          800: '#9B3209',
          900: '#7E2C0B',
        },
        campus: {
          bg: '#F7F7F7',
          card: '#FFFFFF',
          text: '#202124',
          muted: '#6B7280',
          border: '#E5E7EB',
        },
        status: {
          success: '#15803D',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
