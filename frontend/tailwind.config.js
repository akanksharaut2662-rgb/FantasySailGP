/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ocean: {
          50:  "#e6f4ff",
          100: "#cce8ff",
          200: "#99d0ff",
          300: "#66b9ff",
          400: "#33a1ff",
          500: "#0089ff",
          600: "#006ecc",
          700: "#005299",
          800: "#003766",
          900: "#001b33",
        },
        sail: {
          teal:   "#00d4c8",
          amber:  "#ffb84d",
          coral:  "#ff6b6b",
          lime:   "#a3e635",
        },
      },
    },
  },
  plugins: [],
};
