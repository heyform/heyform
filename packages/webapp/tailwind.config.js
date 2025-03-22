const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    fontFamily: {
      sans: [
        ['Inter', ...defaultTheme.fontFamily.sans],
        {
          fontFeatureSettings: '"cv11"'
        }
      ]
    },
    extend: {
      colors: {
        background: 'rgba(var(--hf-background))',
        foreground: 'rgba(var(--hf-foreground))',
        input: 'rgba(var(--hf-input))',
        primary: {
          DEFAULT: 'rgba(var(--hf-primary))',
          light: 'rgba(var(--hf-primary-light))'
        },
        secondary: {
          DEFAULT: 'rgba(var(--hf-secondary))',
          light: 'rgba(var(--hf-secondary-light))'
        },
        accent: {
          DEFAULT: 'rgba(var(--hf-accent))',
          light: 'rgba(var(--hf-accent-light))'
        },
        error: 'rgba(var(--hf-error))'
      },
      screens: {
        'builder-md': '1230px',
        'builder-lg': '1440px'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/forms')]
}
