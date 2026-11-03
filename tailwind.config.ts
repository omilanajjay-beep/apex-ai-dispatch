import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08111E',
        paper: '#F6F1E7',
        sand: '#D8CFBE',
        navy: '#111E31',
        gold: '#D6B879',
        'gold-bright': '#F0DEA8',
        'gold-deep': '#96753B',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 24px 70px rgba(0,0,0,.3), inset 0 1px rgba(214,184,121,.12)',
      },
    },
  },
  plugins: [],
};

export default config;
