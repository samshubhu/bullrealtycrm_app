import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#598bff",
          500: "#3463ff",
          600: "#1f43f5",
          700: "#1733e1",
          800: "#192cb6",
          900: "#1b2c8f",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c9",
          400: "#8590a8",
          500: "#65718c",
          600: "#505a73",
          700: "#42495d",
          800: "#393f4f",
          900: "#222632",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.04), 0 1px 3px 0 rgba(16,24,40,0.06)",
        pop: "0 4px 16px -2px rgba(16,24,40,0.12), 0 2px 6px -2px rgba(16,24,40,0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
