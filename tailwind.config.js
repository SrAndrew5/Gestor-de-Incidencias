/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base:  'rgb(var(--c-base) / <alpha-value>)',
        card:  'rgb(var(--c-card) / <alpha-value>)',
        well:  'rgb(var(--c-well) / <alpha-value>)',
        hov:   'rgb(var(--c-hov) / <alpha-value>)',
        edge:  'rgb(var(--c-edge) / <alpha-value>)',
        edge2: 'rgb(var(--c-edge2) / <alpha-value>)',
        ink:   'rgb(var(--c-ink) / <alpha-value>)',
        ink2:  'rgb(var(--c-ink2) / <alpha-value>)',
        ink3:  'rgb(var(--c-ink3) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
