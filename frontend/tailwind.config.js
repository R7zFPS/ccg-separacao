/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Azul Marinho — Casa das Correntes
        marinho: {
          50:  '#EBF2FA',
          100: '#C8DDEF',
          200: '#9EC3E3',
          300: '#6EA4D4',
          400: '#4285C1',
          500: '#1F6AAD',
          600: '#155491',
          700: '#0E3E73',
          800: '#092D56',
          900: '#051D3A',
          950: '#020E1E',
        },
        // Manter cor primária como alias
        primario: {
          50:  '#EBF2FA',
          100: '#C8DDEF',
          200: '#9EC3E3',
          300: '#6EA4D4',
          400: '#4285C1',
          500: '#1F6AAD',
          600: '#155491',
          700: '#0E3E73',
          800: '#092D56',
          900: '#051D3A',
        },
        // Status das solicitações
        status: {
          aberta:                '#6b7280',
          em_separacao:          '#f59e0b',
          aguardando_atribuicao: '#ef4444',
          material_separado:     '#10b981',
          agendamento_realizado: '#1F6AAD',
          rota_enviada:          '#8b5cf6',
          entregue:              '#059669',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-slow':     'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
