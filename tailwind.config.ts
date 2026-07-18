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
          50: "#fdf8e8",
          100: "#faefc5",
          200: "#f5df8a",
          300: "#f0cf4f",
          400: "#e8b811",
          500: "#c9960a",
          600: "#a07508",
          700: "#785607",
          800: "#503a05",
          900: "#281d02",
        },
        anthracite: {
          50: "#f4f4f5",
          100: "#e4e4e7",
          200: "#c8c8cd",
          300: "#9e9ea6",
          400: "#71717a",
          500: "#52525b",
          600: "#3f3f46",
          700: "#2d2d33",
          800: "#1e1e23",
          900: "#141418",
          950: "#0a0a0d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
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
