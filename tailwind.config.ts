import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0ea5b7", // teal
          dark: "#0b7e8c",
          light: "#e6f6f8",
        },
        accent: {
          DEFAULT: "#f97316", // warm orange
          light: "#fff1e6",
        },
        ink: "#0f172a",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
