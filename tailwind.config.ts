import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#007FFF", // Azul
          50: "#e6f2ff",
          100: "#cce6ff",
          200: "#99ccff",
          300: "#66b3ff",
          400: "#3399ff",
          500: "#007FFF",
          600: "#0066cc",
          700: "#004c99",
          800: "#003366",
          900: "#001933",
        },
        ink: "#050505", // Negro
        // Acentos ("rayos de luz" del faro)
        spectrum: {
          red: "#B81611",
          orange: "#C85311",
          yellow: "#EACA1C",
          green: "#267D25",
          navy: "#1A2B62",
          violet: "#642A72",
        },
        // Complementarios
        robin: "#03C2D1",
        ghost: "#F8F8FF",
        // Superficies semánticas (controladas via CSS vars -> ver globals.css)
        surface: {
          base: "rgb(var(--surface-base) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        content: {
          DEFAULT: "rgb(var(--content) / <alpha-value>)",
          muted: "rgb(var(--content-muted) / <alpha-value>)",
          subtle: "rgb(var(--content-subtle) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,127,255,0.35), 0 8px 30px -8px rgba(0,127,255,0.45)",
        "glow-sm": "0 0 12px -2px rgba(0,127,255,0.5)",
      },
      backgroundImage: {
        "faro-beam":
          "linear-gradient(90deg, #B81611, #C85311, #EACA1C, #267D25, #007FFF, #642A72)",
        "brand-gradient": "linear-gradient(135deg, #007FFF 0%, #03C2D1 100%)",
        "brand-glow":
          "radial-gradient(120% 120% at 0% 0%, rgba(0,127,255,0.18) 0%, rgba(0,127,255,0) 55%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
