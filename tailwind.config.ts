import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        ink: "#0a0a0a",
        panel: "#0f0f0f",
        line: "#2a2a2a",
        ghost: "#8a8a8a",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        pulseGray: {
          "0%, 100%": { color: "#ffffff" },
          "50%": { color: "#6b6b6b" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        linking: "pulseGray 1.1s ease-in-out infinite",
        "fade-up": "fadeUp 0.4s ease-out forwards",
        scan: "scan 2.4s linear infinite",
        float: "floatY 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
