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
        base: "#FAFAF8",
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F5F4F0",
          3: "#EEECEA",
        },
        border: {
          DEFAULT: "#E2DFD8",
          bright: "#CCC9BF",
        },
        text: {
          primary: "#1C1A15",
          secondary: "#7A7567",
          tertiary: "#B0AB9E",
        },
        accent: {
          gold: "#B8860B",
          "gold-light": "#D4A017",
          "gold-pale": "#FDF5E0",
        },
        signal: {
          DEFAULT: "#C49A0A",
          bg: "#FEF9E7",
        },
        good: {
          DEFAULT: "#3D7A4F",
          bg: "#EBF5EE",
        },
        warning: {
          DEFAULT: "#B87333",
          bg: "#FDF3E7",
        },
        critical: {
          DEFAULT: "#A83232",
          bg: "#FCEAEA",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        serif: ["Cormorant Garamond", "serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 3px rgba(28,26,21,0.06), 0 1px 2px rgba(28,26,21,0.04)",
        md: "0 4px 12px rgba(28,26,21,0.08), 0 2px 4px rgba(28,26,21,0.04)",
        lg: "0 8px 24px rgba(28,26,21,0.1), 0 4px 8px rgba(28,26,21,0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease",
        "pulse-ring": "pulseRing 2s ease-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.6" },
          "70%": { transform: "scale(1.15)", opacity: "0" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
