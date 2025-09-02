/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'actay': ['"Inter"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '64': ['64px', { lineHeight: '1' }],
        '48': ['48px', { lineHeight: '1' }],
        '24': ['24px', { lineHeight: '1' }],
      },
      spacing: {
        '180': '180px',
        '320': '320px',
        '384': '384px',
        '1000': '1000px',
      },
      borderRadius: {
        '32': '32px',
      },
      backdropBlur: {
        '30': '30px',
      },
      animation: {
        'marquee': 'marquee 8s linear infinite',
        'ripple': 'ripple 0.6s ease-out',
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        ripple: {
          '0%': {
            opacity: '0.6',
            transform: 'scale(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(4)',
          },
        },
        fadeIn: {
          'from': {
            opacity: '0',
            filter: 'blur(10px)',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'scale(1)',
          },
        },
      },
      transitionDuration: {
        '3000': '3000ms',
      },
      transitionProperty: {
        'transform-opacity': 'transform, opacity',
      },
      scale: {
        '105': '1.05',
        '110': '1.1',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
