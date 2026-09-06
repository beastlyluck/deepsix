/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0D0D0D',
          light: '#1A1A1A',
          lighter: '#2A2A2A',
        },
        paper: {
          DEFAULT: '#E8E8E8',
          muted: '#B0B0B0',
          dark: '#808080',
        },
        gold: '#FFD700',
        cyan: '#00FFFF',
        zoro: '#2E7D32',
        goku: '#FFB300',
        itachi: '#B71C1C',
        optimus: '#C62828',
        vegeta: '#1565C0',
        spiderman: '#EF6C00',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Anton', 'sans-serif'],
        ui: ['JetBrains Mono', 'Space Mono', 'monospace'],
        body: ['Inter', 'DM Sans', 'sans-serif'],
        kanji: ['Noto Sans JP', 'sans-serif'],
      },
      animation: {
        'page-turn': 'pageTurn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'panel-in': 'panelIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'speed-lines': 'speedLines 0.3s ease-out',
        'halftone': 'halftonePulse 4s ease-in-out infinite',
        'ki-pulse': 'kiPulse 2s ease-in-out infinite',
        'sharingan-rotate': 'sharinganRotate 8s linear infinite',
        'web-swing': 'webSwing 1.5s ease-in-out infinite',
      },
      keyframes: {
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '50%': { transform: 'rotateY(-90deg)', opacity: '0.5' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        panelIn: {
          '0%': { transform: 'scale(0.95) translateY(20px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        speedLines: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        halftonePulse: {
          '0%, 100%': { opacity: '0.03' },
          '50%': { opacity: '0.08' },
        },
        kiPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        sharinganRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        webSwing: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
      },
      backgroundImage: {
        'halftone': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'1.5\' fill=\'%23ffffff\'/%3E%3C/svg%3E")',
        'manga-lines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
      },
    },
  },
  plugins: [],
}
