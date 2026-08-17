import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#070B14",
        mist: "#E8EEF8",
        aura: {
          300: "#9BD4FF",
          400: "#5CB8FF",
          500: "#3B82F6",
          600: "#7C5CFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia"],
      },
      boxShadow: {
        glow: "0 0 80px rgba(92, 184, 255, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
