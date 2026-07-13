/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design system — Linear-inspired light mode
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted:   '#475569',
          faint:   '#94a3b8',
          ghost:   '#cbd5e1',
        },
        // Sidebar dark
        sidebar: {
          bg:     '#0f172a',
          hover:  '#1e293b',
          active: '#1e293b',
          border: '#1e293b',
          text:   '#94a3b8',
          active_text: '#f1f5f9',
        },
        // Semantic
        success: { DEFAULT: '#22c55e', light: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
        warning: { DEFAULT: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#92400e' },
        danger:  { DEFAULT: '#ef4444', light: '#fef2f2', border: '#fecaca', text: '#991b1b' },
        purple:  { light: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        modal:  '0 20px 60px rgba(15,23,42,0.14), 0 8px 24px rgba(15,23,42,0.08)',
        input:  '0 0 0 3px rgba(59,130,246,0.12)',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.25s ease both',
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':    'shimmer 1.6s infinite linear',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
