import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#E7E8E9',
        sand: '#B9BCBF',
        blue: '#BEC2C6',
        electric: '#E0E2E4',
        'light-blue': '#A4A9AE',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 24px 70px rgba(0,0,0,.3), inset 0 1px rgba(218,221,224,.08)',
      },
    },
  },
  plugins: [],
};

export default config;
