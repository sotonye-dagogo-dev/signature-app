/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4caf50",
          hover: "#388e3c",
        },
        danger: {
          DEFAULT: "#f44336",
          hover: "#d32f2f",
        },
      },
    },
  },
  plugins: [],
};
