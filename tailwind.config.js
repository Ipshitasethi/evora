/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: "#F2C1B6",
        coral: "#9B4938",
        plum: "#2C2422",
        cream: "#FCF6F0",
        sage: "#C6D8C8",
        lavender: "#E6E2EB",
        terracotta: "#C0533A",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
