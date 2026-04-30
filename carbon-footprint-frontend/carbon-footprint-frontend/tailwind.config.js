/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfff7',
          100: '#d5fff0',
          200: '#aefee0',
          300: '#70fac8',
          400: '#2becaa',
          500: '#05d08e',
          600: '#00a872',
          700: '#00875d',
          800: '#006b4a',
          900: '#00573d',
          950: '#003124',
        },
        surface: {
          900: '#0b0f0e',
          800: '#111816',
          700: '#18201d',
          600: '#1e2926',
          500: '#253330',
          400: '#2d3f3b',
          300: '#3a514c',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 40% 20%, hsla(160,100%,30%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(190,80%,25%,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(150,60%,20%,0.05) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 168, 114, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 168, 114, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
