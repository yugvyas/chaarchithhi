/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#FDFBF7',
          DEFAULT: '#F5F0E8',
          dark: '#E8DFD1',
        },
        ink: {
          light: '#4A4A4A',
          DEFAULT: '#2D2D2D',
          dark: '#1A1A1A',
        },
        accent: {
          gold: '#D4AF37',
          goldLight: '#F3E5AB',
          goldDark: '#AA8822',
        }
      },
      fontFamily: {
        handwritten: ['Caveat', 'cursive'],
        body: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'paper': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'paper-lifted': '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'card-lifted': '0 15px 30px -5px rgba(0, 0, 0, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 15px rgba(212, 175, 55, 0.1) inset',
        'depth-edge': '3px 3px 8px rgba(0, 0, 0, 0.4), -1px -1px 2px rgba(255, 255, 255, 0.1) inset',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.6)',
      },
      animation: {
        'pop-up': 'popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        popUp: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(212, 175, 55, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
