import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        limestone: "#F5F0E8", ivory: "#FFFEFB", olive: "#354838", terracotta: "#C7785C", oxblood: "#783F46",
        line: "#E6DFD3", ink: "#2A2723", mute: "#8A8378",
      },
      fontFamily: { sans: ["var(--font-manrope)", "Inter", "system-ui"], serif: ["var(--font-serif)", "Georgia", "serif"] },
      boxShadow: { card: "0 1px 2px rgba(60,45,30,.05), 0 4px 14px rgba(60,45,30,.05)", lift: "0 10px 30px rgba(60,45,30,.16)" },
    },
  },
  plugins: [],
} satisfies Config;
