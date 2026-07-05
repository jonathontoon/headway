/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "Departure Mono",
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      colors: {
        terminal: {
          foreground: "var(--foreground)",
          background: "var(--background)",
          0: "var(--color0)",
          1: "var(--color1)",
          2: "var(--color2)",
          3: "var(--color3)",
          4: "var(--color4)",
          5: "var(--color5)",
          6: "var(--color6)",
          7: "var(--color7)",
          8: "var(--color8)",
          9: "var(--color9)",
          10: "var(--color10)",
          11: "var(--color11)",
          12: "var(--color12)",
          13: "var(--color13)",
          14: "var(--color14)",
          15: "var(--color15)",
        },
      },
      keyframes: {
        "terminal-cursor-blink": {
          "0%, 50%": { opacity: 1 },
          "50.01%, 100%": { opacity: 0 },
        },
      },
      animation: {
        "terminal-cursor-blink": "terminal-cursor-blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
