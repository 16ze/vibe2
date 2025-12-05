/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Activation du mode sombre contrôlé par classe
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Nouvelle palette "Electric Vibe"
         * Violet électrique vers Bleu Cyan
         */
        primary: {
          DEFAULT: "#4F46E5", // Indigo
          light: "#6366F1",
          dark: "#4338CA",
        },
        secondary: {
          DEFAULT: "#9333EA", // Purple
          light: "#A855F7",
          dark: "#7C3AED",
        },
        accent: {
          DEFAULT: "#06B6D4", // Cyan
          light: "#22D3EE",
          dark: "#0891B2",
        },
        vibe: {
          indigo: "#4F46E5",
          purple: "#9333EA",
          violet: "#8B5CF6",
          cyan: "#06B6D4",
          electric: "#6366F1",
        },
      },
      backgroundImage: {
        /**
         * Dégradés "Electric Vibe"
         */
        "gradient-vibe": "linear-gradient(to right, #4F46E5, #9333EA)",
        "gradient-vibe-vertical": "linear-gradient(to bottom, #4F46E5, #9333EA)",
        "gradient-vibe-cyan": "linear-gradient(to right, #4F46E5, #06B6D4)",
        "gradient-vibe-electric":
          "linear-gradient(to right, #6366F1, #8B5CF6, #9333EA)",
        "gradient-vibe-glow":
          "linear-gradient(135deg, #4F46E5 0%, #9333EA 50%, #06B6D4 100%)",
      },
    },
  },
  plugins: [],
};
