/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf9',
          100: '#ccf7ef',
          200: '#99edd9',
          400: '#2bbfaa',
          600: '#0c7a6b',
          700: '#0a6459',
          800: '#085247',
          900: '#064038',
        },
        nature: {
          50:  '#f2f7f4',
          100: '#ddeee3',
          200: '#b8dbc3',
          400: '#6aad7a',
          600: '#4a7c59',
          700: '#3d6649',
          800: '#325240',
          900: '#264033',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
