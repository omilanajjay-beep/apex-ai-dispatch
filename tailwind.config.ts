import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#FFFFFF',
        paper: '#20343C',
        sand: '#435A63',
        blue: '#4B8496',
        electric: '#3F7183',
        'light-blue': '#ADD8E6',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 24px 70px rgba(35,76,89,.12), inset 0 1px rgba(255,255,255,.9)',
      },
    },
  },
  plugins: [],
};

export default config;
