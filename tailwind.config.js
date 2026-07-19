/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ===== OKAPIA Design System =====
        // Encre navy : sidebars, footer, textes forts (fidèle au logo OKAPIA)
        ink: {
          DEFAULT: '#0C1F33',
          soft: '#14304A',
          muted: '#4A5E72',
        },
        // Bleu OKAPIA : couleur primaire (actions, états actifs)
        brand: {
          50: '#EEF5FC',
          100: '#D8E8F7',
          200: '#B3D2EF',
          300: '#85B5E3',
          400: '#5493D3',
          500: '#2F73BE',
          600: '#1D5C9E',
          700: '#174A80',
          800: '#0F4A77',
          900: '#0D2B4A',
        },
        // Gris-bleu très clair : fonds
        sand: {
          DEFAULT: '#F5F7FA',
          dark: '#EBEFF4',
        },
        // Accent chaleureux conservé pour les eyebrows (optionnel)
        bronze: {
          DEFAULT: '#5493D3',
          light: '#85B5E3',
        },
        line: '#E2E7ED',
        // ===== Palette héritée (compatibilité) =====
        navy: {
          50: '#f0f3f9', 100: '#d9e0ef', 200: '#b3c1df', 300: '#8da2cf',
          400: '#6783bf', 500: '#4164af', 600: '#2d4a8c', 700: '#1e3469',
          800: '#0F172A', 900: '#0a1020',
        },
        medical: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3B82F6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12, 31, 51, 0.05), 0 8px 24px rgba(12, 31, 51, 0.06)',
        lift: '0 2px 4px rgba(12, 31, 51, 0.06), 0 16px 40px rgba(12, 31, 51, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
