/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./integrations/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Cores Primárias do carlOS
        olive: 'hsl(var(--primary))',
        primary: 'hsl(var(--primary))',
        
        // Fundo aquecido (Stone-50)
        cream: '#FAFAF9',
        
        // Tons de Café (Módulo Pessoal)
        coffee: '#3C3633',
        cappuccino: '#747264',
        
        // Acentos
        terracotta: '#A34343',
        
        // Stone Profundo para sidebars
        'deep-blue': '#1C1917',
        
        // Módulo Pessoal
        personal: {
          primary: 'var(--personal-primary)',
          accent: 'var(--personal-accent)',
          bg: 'var(--personal-bg)',
        },
        
        // Módulo Profissional
        professional: {
          primary: 'var(--professional-primary)',
          accent: 'var(--professional-accent)',
          bg: 'var(--professional-bg)',
        },
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}