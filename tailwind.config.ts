import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10080D',
        paper: '#F5E6EB',
        sand: '#D0B3BE',
        plum: '#1C1017',
        wine: '#7E344F',
        rose: '#E9C0CD',
        mauve: '#C69AAA',
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
