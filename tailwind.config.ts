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
        nodiac: {
          primary: "#0066CC",
          secondary: "#00A3E0",
          dark: "#1a1a2e",
          light: "#f5f5f7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
