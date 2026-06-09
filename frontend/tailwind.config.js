/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#E91E8C',
          'pink-light': '#FFD6EC',
          'pink-dark': '#C4167A',
          navy: '#1B2A4A',
          'navy-light': '#2D4470',
          'navy-dark': '#111B30',
          lime: '#84CC16',
          'lime-light': '#D9F99D',
          'lime-dark': '#65A30D',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'pulse-pink': 'pulse-pink 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-pink': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(233,30,140,0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(233,30,140,0)' },
        },
      },
    },
  },
  plugins: [],
}
