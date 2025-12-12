/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e9fbf8',
          100: '#cbf5ed',
          200: '#9eece0',
          300: '#69dbc6',
          400: '#3ac2a8',
          500: '#27bea5', // USER PRIMARY
          600: '#1fa890',
          700: '#1a8674',
          800: '#176b5d',
          900: '#16584e',
        },
        secondary: {
          50: '#f4f6f7',
          100: '#e3e6e9',
          200: '#c5cdd6',
          300: '#9aaaba',
          400: '#6f8396',
          500: '#4e6276',
          600: '#3b4d60',
          700: '#2f3d4d',
          800: '#1c2938', // USER SECONDARY
          900: '#131c26',
        },
        // Mapping 'calm' to the secondary spectrum for consistency in existing classes
        calm: {
          50: '#f9fafb',
          100: '#f4f6f7',
          200: '#e3e6e9',
          300: '#c5cdd6',
          400: '#9aaaba',
          500: '#6f8396',
          600: '#4e6276',
          700: '#2f3d4d',
          800: '#1c2938',
          900: '#131c26',
        },
        success: {
          50: '#f0fdf4',
          500: '#27bea5', // Aligning success with primary for a monochromatic feel or keeping green
          600: '#1fa890',
        }
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        regular: '400',
        bold: '700',
        black: '900',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}