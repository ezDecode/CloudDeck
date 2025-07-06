/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#f5f5f5',
        'secondary-bg': '#e0e0e0',
        'text-primary': '#000000',
        'text-secondary': '#666666',
        'text-placeholder': '#999999',
        'neutral-white': '#ffffff',
        'neutral-borders': '#cccccc',
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        'xxl': '64px',
        'xxxl': '96px',
      },
      fontFamily: {
        polysans: ["PolySans", "system-ui", "sans-serif"],
        'polysans-gx': ["PolySansGX", "PolySans", "system-ui", "sans-serif"],
        'polysans-italic-gx': ["PolySansItalicGX", "PolySans", "system-ui", "sans-serif"],
        sans: ['PolySans', 'Inter', 'system-ui', 'sans-serif'],
        'default': ['PolySans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['64px', { lineHeight: '1.1', fontWeight: '900' }],
        'h2': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['24px', { lineHeight: '1.4', fontWeight: '400' }],
        'label': ['18px', { fontWeight: '400' }],
        'button': ['20px', { fontWeight: '600' }],
      },
      borderRadius: {
        'design': '12px',
        'card': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.39, 0.575, 0.565, 1) both',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.39, 0.575, 0.565, 1) both',
        'subtle-slide-up': 'subtleSlideUp 0.5s cubic-bezier(0.39, 0.575, 0.565, 1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        subtleSlideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities, addBase, addComponents, theme }) {
      addUtilities({
        '.animated-gradient-text': {
          background: 'linear-gradient(90deg, #3b82f6, #f97316, #a855f7, #ec4899)',
          backgroundSize: '200% 200%',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          animation: 'gradient-animation 5s ease infinite',
        },
      });

      addBase({
        '@keyframes gradient-animation': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      });
    },
  ],
} 