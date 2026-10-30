import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0C',
        paper: '#F0F3F8',
        sand: '#BAC4D3',
        blue: '#0052FF',
        electric: '#0066FF',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 24px 70px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.07)',
      },
    },
  },
  plugins: [],
};

export default config;
