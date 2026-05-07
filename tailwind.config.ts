// M6: Tailwind font-sans 토큰 — Pretendard 우선 + system fallback chain.
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Apple SD Gothic Neo"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
    },
  },
  plugins: [],
};

export default config;
