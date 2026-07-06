/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Sets Inter as the primary sans-serif face, falling back to standard system fonts
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      colors: {
        // Technical Industrial Blue Palette Matrix
        blue: {
          50: '#f0f7ff',   // Highlighted row backgrounds / active state backdrops
          100: '#e0effe',  // Structural accent block boundaries
          200: '#bae0fd',  // Light interactive borders
          500: '#3b8cf6',  // Standard info states
          600: '#2572eb',  // Main brand accent color (Sidebar indicators, primary buttons)
          700: '#1d5bd8',  // Hover states on interactive components
          900: '#1e3e8a',  // Deep high-contrast title typography headers
          950: '#111e4b',  // Main layout structural sidebar fill / text-dark
        },
        slate: {
          50: '#f8fafc',   // Main site layout background
          100: '#f1f5f9',  // Standard content box background / table header rows
          200: '#e2e8f0',  // Muted lines / structural dividers
          500: '#64748b',  // Secondary descriptive labels and descriptions
          800: '#1e293b',  // Base body text color
        }
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}