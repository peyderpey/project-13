/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
   extend: {
    colors: {
      gray: {
        '25': '#FAFAFA',
        '50': '#F9FAFB',
        '100': '#F3F4F6',
        '150': '#EBEDEF',
        '200': '#E5E7EB',
        '250': '#DDDFE2',
        '300': '#D1D5DB',
        '350': '#B9BDC4',
        '400': '#9CA3AF',
        '450': '#8B92A5',
        '500': '#6B7280',
        '550': '#5D6470',
        '600': '#4B5563',
        '650': '#414750',
        '700': '#374151',
        '750': '#303640',
        '800': '#1F2937',
        '850': '#1A202C',
        '900': '#111827',
        '950': '#0B0E14'
      },
      teal: {
        '50': '#F0FDFA',
        '100': '#CCFBF1',
        '200': '#99F6E4',
        '300': '#5EEAD4',
        '400': '#2DD4BF',
        '500': '#14B8A6',
        '600': '#0D9488',
        '700': '#0F766E',
        '800': '#115E59',
        '900': '#134E4A',
        '950': '#042F2E'
      },
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))'
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))'
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))'
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))'
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))'
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))'
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))'
      },
      error: {
        DEFAULT: 'hsl(var(--error))',
        foreground: 'hsl(var(--error-foreground))'
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))'
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))'
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      chart: {
        '1': 'hsl(var(--chart-1))',
        '2': 'hsl(var(--chart-2))',
        '3': 'hsl(var(--chart-3))',
        '4': 'hsl(var(--chart-4))',
        '5': 'hsl(var(--chart-5))'
      }
    },
    fontFamily: {
      sans: [
        'Inter',
        'system-ui',
        'sans-serif'
      ]
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)'
    }
   }
  },
  plugins: [require("tailwindcss-animate")],
};