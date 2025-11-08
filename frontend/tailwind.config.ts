import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        galaxy: {
          900: "#0b1020",
          800: "#101a3a",
          700: "#1a2352",
          600: "#2a3579",
          500: "#3e4ca0"
        }
      },
      backgroundImage: {
        "world-map": "radial-gradient(ellipse at center, rgba(62,76,160,0.20), rgba(11,16,32,0.95))"
      }
    }
  },
  plugins: [],
} satisfies Config;


