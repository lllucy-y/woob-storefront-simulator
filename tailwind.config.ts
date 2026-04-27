import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        woob: {
          blue: '#1E40AF',
          sky: '#F0F6FF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
