import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
      },
      colors: {
        // shadcn/ui semantic tokens (driven by CSS variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Neumorphism palette primitives
        neu: {
          bg: "#0a0a0a",
          surface: "#121212",
          raised: "#161616",
          highlight: "#1d1d1d",
          shadow: "#000000",
          border: "#222222",
        },

        // Semantic application colors
        luka: {
          accent: "#D97757",
          "accent-hover": "#C66647",
          "accent-dim": "rgba(217,119,87,0.15)",
          terracotta: "#D67F61",
          income: "#4ade80",
          expense: "#f87171",
          warning: "#fbbf24",
          info: "#60a5fa",
          muted: "#888888",
        },
      },

      borderRadius: {
        // shadcn/ui driven
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        // Neumorphism specific
        neu: "1.5rem",
        "neu-sm": "0.75rem",
        "neu-lg": "2rem",
      },

      boxShadow: {
        // Raised element — light comes from top-left
        "soft-out":
          "6px 6px 14px #000000, -4px -4px 10px #1d1d1d",
        "soft-out-md":
          "10px 10px 20px #000000, -6px -6px 14px #1d1d1d",
        "soft-out-lg":
          "16px 16px 32px #000000, -8px -8px 20px #222222",

        // Pressed / inset — input fields and active states
        "soft-in":
          "inset 4px 4px 10px #000000, inset -3px -3px 8px #1d1d1d",
        "soft-in-md":
          "inset 6px 6px 14px #000000, inset -4px -4px 10px #1d1d1d",

        // Subtle lift for interactive hover
        "soft-hover":
          "8px 8px 18px #000000, -5px -5px 12px #1e1e1e",

        // Accent glow for CTA buttons
        "soft-accent":
          "6px 6px 14px #000000, -4px -4px 10px #1d1d1d, 0 0 20px rgba(217,119,87,0.25)",

        // Flat — no shadow (utility reset)
        "soft-flat": "none",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "press-in": {
          "0%": { boxShadow: "6px 6px 14px #000000, -4px -4px 10px #1d1d1d" },
          "100%": {
            boxShadow:
              "inset 4px 4px 10px #000000, inset -3px -3px 8px #1d1d1d",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "press-in": "press-in 0.15s ease-in-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
