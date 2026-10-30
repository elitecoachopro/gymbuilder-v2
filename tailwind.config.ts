import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "var(--sport-accent-50, #fdf8e8)",
          100: "var(--sport-accent-100, #faefc5)",
          200: "var(--sport-accent-200, #f5df8a)",
          300: "var(--sport-accent-300, #f0cf4f)",
          400: "var(--sport-accent-400, #e8b811)",
          500: "var(--sport-accent-500, #c9960a)",
          600: "var(--sport-accent-600, #a07508)",
          700: "var(--sport-accent-700, #785607)",
          800: "var(--sport-accent-800, #503a05)",
          900: "var(--sport-accent-900, #281d02)",
        },
        anthracite: {
          50: "var(--sport-surface-50, #f4f4f5)",
          100: "var(--sport-surface-100, #e4e4e7)",
          200: "var(--sport-surface-200, #c8c8cd)",
          300: "var(--sport-surface-300, #9e9ea6)",
          400: "var(--sport-surface-400, #71717a)",
          500: "var(--sport-surface-500, #52525b)",
          600: "var(--sport-surface-600, #3f3f46)",
          700: "var(--sport-surface-700, #2d2d33)",
          800: "var(--sport-surface-800, #1e1e23)",
          900: "var(--sport-surface-900, #141418)",
          950: "var(--sport-surface-950, #0a0a0d)",
        },
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
