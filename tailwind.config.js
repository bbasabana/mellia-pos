/**
 * Mellia design system.
 *
 * The palettes below are tuned on the logo colours, and the usual Tailwind names
 * (blue, green, orange, gray...) are re-pointed to them, so every page already
 * written with `bg-blue-600`, `text-green-700`, `rounded-sm`... takes the new look.
 *
 * Logo:  cyan #00d3fa · lime #71de00 · orange #ff4900 · ink #0f172a
 */

/** Cyan (logo glass): 400 is the logo colour, 600+ are dark enough for text and buttons. */
const brandCyan = {
  50: '#ecfcff',
  100: '#cff7fe',
  200: '#a2eefd',
  300: '#5fe1fc',
  400: '#00d3fa',
  500: '#00b3db',
  600: '#0089ad',
  700: '#006e8c',
  800: '#075a72',
  900: '#0b4a5f',
  950: '#032f3e',
};

/** Lime (logo fork): 400 is the logo colour, 600+ stay readable on white. */
const brandLime = {
  50: '#f4fde8',
  100: '#e6facc',
  200: '#cdf59e',
  300: '#a8ec63',
  400: '#71de00',
  500: '#5cbf00',
  600: '#3f8a00',
  700: '#336f04',
  800: '#2c590a',
  900: '#264b0d',
  950: '#112a01',
};

/** Orange (logo spoon): 500 is the logo colour. */
const brandOrange = {
  50: '#fff4ed',
  100: '#ffe6d5',
  200: '#ffc9aa',
  300: '#ffa274',
  400: '#ff713b',
  500: '#ff4900',
  600: '#e03d00',
  700: '#b93104',
  800: '#93290b',
  900: '#77250c',
  950: '#401004',
};

/** Neutral with a slight cool tint, for a clean light interface. */
const neutral = {
  50: '#f7f9fb',
  100: '#f0f3f6',
  200: '#e3e8ee',
  300: '#cfd6df',
  400: '#98a3b3',
  500: '#6b7789',
  600: '#4d5869',
  700: '#3a4453',
  800: '#232b38',
  900: '#131a24',
  950: '#0a0f17',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: brandCyan[600],
        brand: {
          cyan: brandCyan,
          lime: brandLime,
          orange: brandOrange,
          ink: '#0f172a',
        },
        ink: '#0f172a',
        // Existing pages use these names: they now speak the logo colours.
        blue: brandCyan,
        sky: brandCyan,
        cyan: brandCyan,
        indigo: brandCyan,
        green: brandLime,
        emerald: brandLime,
        lime: brandLime,
        orange: brandOrange,
        gray: neutral,
        slate: neutral,
        zinc: neutral,
      },
      borderRadius: {
        none: '0',
        sm: '0.5rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        sm: '0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.05)',
        md: '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        lg: '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.06)',
        xl: '0 20px 40px -12px rgb(15 23 42 / 0.16)',
        '2xl': '0 28px 56px -16px rgb(15 23 42 / 0.22)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
