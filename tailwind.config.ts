// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0f1114',
        surface: '#1a1e24',
        elevated: '#222830',
        border: '#2e3640',
        primary: '#d4d8dd',
        muted: '#7a8694',
        blue: '#6b8fa3',
        gold: '#c9a84c',
        success: '#4a7c59',
        danger: '#8b3a3a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { DEFAULT: '2px', sm: '2px', md: '4px', lg: '4px' },
    },
  },
}
export default config
