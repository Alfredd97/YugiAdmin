import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f5ff',
          100: '#e2e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3'
        }
      }
    }
  },
  plugins: []
};

export default config;

