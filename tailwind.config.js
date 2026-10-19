/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F14',
        surface: '#1A1A23',
        'surface-light': '#252530',
        border: '#2A2A38',
        text: '#EDEDF2',
        'text-muted': '#9494A8',
        accent: '#7557ED',
        'accent-light': '#9B82F3',
        'accent-dark': '#5A3DC7',
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
