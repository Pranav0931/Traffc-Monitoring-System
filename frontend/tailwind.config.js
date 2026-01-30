/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'traffic-dark': '#0a0a0f',
        'traffic-card': '#12121a',
        'traffic-border': '#1e1e2e',
        'traffic-accent': '#3b82f6',
        'traffic-success': '#22c55e',
        'traffic-warning': '#eab308',
        'traffic-danger': '#ef4444',
        'traffic-emergency': '#dc2626',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash': 'flash 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        flash: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.3' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
