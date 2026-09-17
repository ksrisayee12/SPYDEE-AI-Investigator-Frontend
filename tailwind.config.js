/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#080705',
          panel: '#0D0B08',
          raised: '#14110C',
          border: '#3D2A12',
          borderBright: '#66451B',
          amber: '#FF9E1B',
          amberDim: '#996515',
          amberGlow: '#FFAA33',
        },
        amber: {
          DEFAULT: '#FF9E1B',
          bright: '#FFBA42',
          light: '#FFD27A',
          400: '#FFBA42',
          500: '#FF9E1B',
          600: '#D97E06',
          700: '#996515',
          800: '#59390B',
          900: '#261704',
        },
        tgreen: {
          DEFAULT: '#34D399',
          bright: '#4ADE80',
          muted: '#1B5E3C',
          dark: '#0A2617',
        },
        alert: {
          red: '#EF4444',
          redMuted: '#7F1D1D',
          amber: '#FF9E1B',
        },
        text: {
          primary: '#FFBA42',
          bright: '#FFE7B8',
          muted: '#A6732E',
          dim: '#6E491A',
        },
        navy: { 50: '#0D0B08', 100: '#14110C', 200: '#3D2A12', 300: '#66451B', 400: '#A6732E', 500: '#996515', 600: '#14110C', 700: '#0D0B08', 800: '#080705', 900: '#040302' },
        azure: { 50: '#14110C', 100: '#0D0B08', 200: '#3D2A12', 300: '#66451B', 400: '#A6732E', 500: '#FF9E1B', 600: '#FF9E1B', 700: '#D97E06', 800: '#0D0B08', 900: '#080705' },
        cyan: { 400: '#34D399', 500: '#34D399', 600: '#1B5E3C' },
        danger: { 400: '#EF4444', 500: '#EF4444', 600: '#B91C1C' },
        success: { 400: '#34D399', 500: '#34D399', 600: '#1B5E3C' },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
