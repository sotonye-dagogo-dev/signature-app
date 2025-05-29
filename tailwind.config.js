/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#66bb6a",
          DEFAULT: "#4caf50",
          dark: "#388e3c",
          hover: "#388e3c",
        },
        secondary: {
          light: "#90a4ae",
          DEFAULT: "#607d8b",
          dark: "#455a64",
          hover: "#455a64",
        },
        success: {
          light: "#81c784",
          DEFAULT: "#4caf50",
          dark: "#388e3c",
        },
        error: {
          light: "#e57373",
          DEFAULT: "#f44336",
          dark: "#d32f2f",
        },
        warning: {
          light: "#ffd54f",
          DEFAULT: "#ffc107",
          dark: "#ffa000",
        },
        info: {
          light: "#64b5f6",
          DEFAULT: "#2196f3",
          dark: "#1976d2",
        },
      },
      spacing: {
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
