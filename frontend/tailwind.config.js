/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', 'sans-serif'],
        sans: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        pop: '4px 4px 0 0 #1c1917',
        'pop-sm': '2px 2px 0 0 #1c1917',
        'pop-lg': '6px 6px 0 0 #1c1917',
      },
    },
  },
  plugins: [],
}
