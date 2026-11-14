/** @type {import('tailwindcss').Config} */
const stone = { 50: "#faf6ee", 100: "#f2ecdf", 200: "#e4dccb", 300: "#cfc5af", 400: "#a79c85", 500: "#7d735f", 600: "#5c5445", 700: "#443d32", 800: "#2b2620", 900: "#1c1814", 950: "#14110e" };
module.exports = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Charter", "Georgia", "Cambria", "serif"],
      },
      colors: {
        slate: stone,
        ink: "#1c1814",
        paper: "#faf6ee",
        brand: { 50: "#fff1ec", 100: "#ffe0d4", 200: "#ffc1a8", 500: "#f0562b", 600: "#e0431a", 700: "#b83312" },
      },
    },
  },
  plugins: [],
};
