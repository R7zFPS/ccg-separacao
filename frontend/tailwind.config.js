/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Paleta Azul Marinho — Casa das Correntes (refinada)
        marinho: {
          50:  '#EDF2F9',
          100: '#C9D9EE',
          200: '#93B3D9',
          300: '#5B8CB9',
          400: '#2D6699',
          500: '#0F4880',
          600: '#0B3668',
          700: '#082650',
          800: '#051838',
          900: '#030E22',
          950: '#010814',
        },
        // Dourado — acento moderno premium
        dourado: {
          50:  '#FBF5E6',
          100: '#F5E3B3',
          200: '#EBCb76',
          300: '#D9AC40',
          400: '#C4902A',
          500: '#A87520',
          600: '#8A5C18',
          700: '#6D4512',
          800: '#50300C',
          900: '#341D07',
        },
        // Manter alias primário
        primario: {
          50:  '#EDF2F9',
          100: '#C9D9EE',
          200: '#93B3D9',
          300: '#5B8CB9',
          400: '#2D6699',
          500: '#0F4880',
          600: '#0B3668',
          700: '#082650',
          800: '#051838',
          900: '#030E22',
        },
        // Status das solicitações
        status: {
          aberta:                '#6b7280',
          em_separacao:          '#f59e0b',
          aguardando_atribuicao: '#ef4444',
          material_separado:     '#10b981',
          agendamento_realizado: '#0F4880',
          rota_enviada:          '#8b5cf6',
          entregue:              '#059669',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(10,22,40,0.06), 0 1px 2px -1px rgba(10,22,40,0.04)',
        'card-md': '0 4px 12px -2px rgba(10,22,40,0.10), 0 2px 4px -2px rgba(10,22,40,0.06)',
        'card-lg': '0 8px 24px -4px rgba(10,22,40,0.14), 0 4px 8px -4px rgba(10,22,40,0.08)',
        'gold':    '0 0 20px rgba(196,144,42,0.25)',
        'inner':   'inset 0 1px 3px rgba(10,22,40,0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'chain-draw': {
          from: { strokeDashoffset: '1000' },
          to:   { strokeDashoffset: '0' },
        },
        'gold-shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'slide-in-right':  'slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1)',
        'slide-in-left':   'slide-in-left  0.35s cubic-bezier(0.22,1,0.36,1)',
        'fade-up':         'fade-up  0.5s cubic-bezier(0.22,1,0.36,1)',
        'fade-in':         'fade-in  0.4s ease-out',
        'scale-in':        'scale-in 0.3s cubic-bezier(0.22,1,0.36,1)',
        'pulse-slow':      'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'chain-draw':      'chain-draw 2s ease-out forwards',
        'gold-shimmer':    'gold-shimmer 3s linear infinite',
        'float':           'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
