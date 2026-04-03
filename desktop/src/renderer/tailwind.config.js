/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        logo: ['"Gloria Hallelujah"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

