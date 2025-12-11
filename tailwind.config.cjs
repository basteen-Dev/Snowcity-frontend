/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  // tailwind.config.js
  theme: {
    extend: {
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.1) translateY(-10px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        liquidWave: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(25%)' },
          '100%': { transform: 'translateX(50%)' },
        },
        fadeToWhite: {
          '0%': { opacity: '0.3', backgroundColor: 'rgba(100, 200, 255, 0.4)' },
          '100%': { opacity: '0', backgroundColor: 'rgba(255, 255, 255, 0.6)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        kenburns: 'kenburns 10s ease-in-out infinite',
        'fade-up': 'fadeUp 1.5s ease forwards',
        'liquid-wave': 'liquidWave 15s ease-in-out infinite',
        'fade-white': 'fadeToWhite 2s ease-out forwards',
        'float-in': 'floatIn 0.8s ease-out forwards',
        shimmer: 'shimmer 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.1)',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.2)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
      },
      fontFamily: {
        // Global app font stack (DM Sans preferred, Poppins secondary)
        sans: [
          'DM Sans',
          'Poppins',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol'
        ]
      },
      colors: {
        // Optional brand alias (use as text-brand / bg-brand)
        brand: {
          DEFAULT: '#2563eb'
        }
      }
    }
  },
  plugins: []
};

