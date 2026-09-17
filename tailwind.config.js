/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#07100D',
          panel: '#0B1713',
          raised: '#0F1D18',
          border: '#27453A',
          borderBright: '#3C6653',
        },
        amber: {
          DEFAULT: '#FFB84D',
          bright: '#FFD27A',
          400: '#FFD27A',
          500: '#FFB84D',
          600: '#D9A441',
        },
        tgreen: {
          DEFAULT: '#9FE3B1',
          muted: '#628C73',
        },
        alert: {
          red: '#E05A52',
          amber: '#D9A441',
        },
        text: {
          primary: '#D8E5DC',
          muted: '#6F887A',
        },
        navy: { 50: '#0B1713', 100: '#0F1D18', 200: '#27453A', 300: '#3C6653', 400: '#6F887A', 500: '#628C73', 600: '#0F1D18', 700: '#0B1713', 800: '#07100D', 900: '#050914' },
        azure: { 50: '#0F1D18', 100: '#0B1713', 200: '#27453A', 300: '#3C6653', 400: '#628C73', 500: '#FFB84D', 600: '#FFB84D', 700: '#D9A441', 800: '#0B1713', 900: '#07100D' },
        cyan: { 400: '#9FE3B1', 500: '#9FE3B1', 600: '#628C73' },
        danger: { 400: '#E05A52', 500: '#E05A52', 600: '#E05A52' },
        success: { 400: '#9FE3B1', 500: '#9FE3B1', 600: '#628C73' },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
