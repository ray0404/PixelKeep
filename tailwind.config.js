/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "var(--color-primary, #4ade80)", // Bright Pixel Green
        "secondary": "var(--color-secondary, #a855f7)", // Bright Pixel Purple
        "background-dark": "#1e1b4b", // Deep Indigo
        "surface": "#312e81", // Dark Indigo
        "text-light": "var(--color-text-light, #f0fdf4)", // Off-white/Light Green
        "text-meta": "#a5b4fc", // Lighter Indigo for meta
        "border-light": "#4f46e5", // Indigo Border
        "border-dark": "#1e1b4b", // Darker Indigo for inset effect
        "danger": "#ef4444", // Red
        "warning": "#f59e0b", // Amber for recording
      },
      fontFamily: {
        "display": ['"Press Start 2P"', "cursive"],
        "pixel": ["VT323", "monospace"],
      },
      boxShadow: {
        'pixel-btn': '2px 2px 0px 0px #1e1b4b',
        'pixel-btn-hover': '3px 3px 0px 0px #1e1b4b',
        'pixel-container': '4px 4px 0px 0px #1e1b4b',
        'pixel-container-inset': 'inset 2px 2px 0px 0px #1e1b4b, inset -2px -2px 0px 0px #4f46e5',
      },
      borderRadius: {
        "DEFAULT": "0px",
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
