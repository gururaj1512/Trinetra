/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Enhanced Orange Theme Palette
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        sacred: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f7b977',
          400: '#f39340',
          500: '#f0731a',
          600: '#e15a10',
          700: '#bb4410',
          800: '#953616',
          900: '#792e15',
          950: '#41150a',
        },
        divine: {
          50: '#fff8f0',
          100: '#ffeed9',
          200: '#ffdab3',
          300: '#ffc082',
          400: '#ff9f4f',
          500: '#ff7c1f',
          600: '#f05d15',
          700: '#c74412',
          800: '#9e3716',
          900: '#7f2f15',
          950: '#44150a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.8)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'sacred-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        'divine-gradient': 'linear-gradient(135deg, #ff7c1f 0%, #f05d15 50%, #c74412 100%)',
      },
      boxShadow: {
        'sacred': '0 10px 25px -5px rgba(249, 115, 22, 0.1), 0 10px 10px -5px rgba(249, 115, 22, 0.04)',
        'divine': '0 20px 40px -10px rgba(249, 115, 22, 0.2), 0 10px 20px -5px rgba(249, 115, 22, 0.1)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.3)',
      }
    },
  },
  plugins: [],
};
