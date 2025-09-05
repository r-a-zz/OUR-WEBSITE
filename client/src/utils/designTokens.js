export const designTokens = {
  colors: {
    glass: {
      light: 'bg-white/10',
      medium: 'bg-white/15',
      heavy: 'bg-white/20',
    },
    border: {
      light: 'border-white/10',
      medium: 'border-white/20',
      heavy: 'border-white/30',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-white/80',
      muted: 'text-white/60',
      disabled: 'text-white/40',
    },
    gradient: {
      primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
      hover: 'hover:from-blue-600 hover:to-purple-700',
    }
  },
  
  effects: {
    blur: 'backdrop-blur-md',
    shadow: {
      sm: 'shadow-sm',
      md: 'shadow-lg',
      lg: 'shadow-2xl',
    },
    transition: 'transition-all duration-300',
    hover: {
      scale: 'hover:scale-[1.01]',
      scaleUp: 'hover:scale-105',
    }
  },
  
  spacing: {
    card: 'p-6',
    cardSmall: 'p-4',
    section: 'space-y-8',
    grid: 'gap-6',
  },
  
  typography: {
    hero: 'text-6xl font-bold',
    heading: 'text-5xl font-bold',
    subheading: 'text-2xl font-semibold',
    body: 'text-lg',
  }
};
