/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0D1B2A',
        neonBlue: '#00D4FF',
        neonGreen: '#00FF9C',
        neonPink: '#FF4DFF',
        glass: 'rgba(13, 27, 42, 0.72)',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 212, 255, 0.35)',
        green: '0 0 24px rgba(0, 255, 156, 0.35)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.08) 1px, transparent 1px)',
        aurora:
          'radial-gradient(circle at 10% 20%, rgba(0, 212, 255, 0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(0, 255, 156, 0.22), transparent 40%), radial-gradient(circle at 90% 80%, rgba(255, 77, 255, 0.18), transparent 40%)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
