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
        white: "rgb(var(--color-white) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
        blush: "rgb(var(--color-blush) / <alpha-value>)",
        coral: "rgb(var(--color-coral) / <alpha-value>)",
        plum: "rgb(var(--color-plum) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        sage: "rgb(var(--color-sage) / <alpha-value>)",
        lavender: "rgb(var(--color-lavender) / <alpha-value>)",
        terracotta: "rgb(var(--color-terracotta) / <alpha-value>)",
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
