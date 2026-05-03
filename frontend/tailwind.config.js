/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E293B",
        secondary: "#64748B",
        accent: "#F59E0B",
        "app-bg": "#F8FAFC"
      },
      boxShadow: {
        card: "0 8px 30px rgba(30, 41, 59, 0.08)"
      }
    }
  },
  plugins: []
};
