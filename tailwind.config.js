/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a0a2e',
        'bg-secondary': '#2d1b4e',
        'bg-card': '#3d2b5e',
        'text-primary': '#ffffff',
        'text-secondary': '#b8a9c9',
        'accent': '#7c3aed',
        'accent-hover': '#8b5cf6',
        'success': '#10b981',
        'danger': '#ef4444',
        'warning': '#f59e0b',
      },
    },
  },
  plugins: [],
}
