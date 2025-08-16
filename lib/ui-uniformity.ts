import { cn } from "@/lib/utils"

// Design tokens for consistent UI
export const designTokens = {
  // Colors
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      900: '#0f172a'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem'     // 64px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
}

// Animation classes for consistent transitions
export const animations = {
  // Fade animations
  fade: {
    in: 'animate-in fade-in duration-200',
    out: 'animate-out fade-out duration-200',
    inUp: 'animate-in fade-in slide-in-from-top-4 duration-300',
    inDown: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
    inLeft: 'animate-in fade-in slide-in-from-left-4 duration-300',
    inRight: 'animate-in fade-in slide-in-from-right-4 duration-300'
  },
  
  // Scale animations
  scale: {
    in: 'animate-in zoom-in-95 duration-200',
    out: 'animate-out zoom-out-95 duration-200',
    inBounce: 'animate-in zoom-in-95 duration-300 ease-out',
    outBounce: 'animate-out zoom-out-95 duration-300 ease-in'
  },
  
  // Slide animations
  slide: {
    inUp: 'animate-in slide-in-from-top-full duration-300',
    inDown: 'animate-in slide-in-from-bottom-full duration-300',
    inLeft: 'animate-in slide-in-from-left-full duration-300',
    inRight: 'animate-in slide-in-from-right-full duration-300',
    outUp: 'animate-out slide-out-to-top-full duration-300',
    outDown: 'animate-out slide-out-to-bottom-full duration-300',
    outLeft: 'animate-out slide-out-to-left-full duration-300',
    outRight: 'animate-out slide-out-to-right-full duration-300'
  }
}

// Component variants for consistent styling
export const componentVariants = {
  // Button variants
  button: {
    base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    sizes: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
      xl: 'h-12 px-10 text-base'
    },
    variants: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    }
  },
  
  // Card variants
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    variants: {
      default: 'border-border',
      elevated: 'border-border shadow-md hover:shadow-lg transition-shadow',
      interactive: 'border-border cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]',
      glass: 'border-border/50 bg-card/80 backdrop-blur-sm'
    }
  },
  
  // Input variants
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      default: 'border-input',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-success focus-visible:ring-success'
    }
  }
}

// Utility functions for consistent styling
export const uiUtils = {
  // Apply consistent spacing
  spacing: (size: keyof typeof designTokens.spacing) => designTokens.spacing[size],
  
  // Apply consistent colors
  color: (color: string, shade: '50' | '100' | '500' | '600' | '700' | '900' = '500') => {
    const colorObj = designTokens.colors[color as keyof typeof designTokens.colors]
    if (colorObj && shade in colorObj) {
      return (colorObj as any)[shade] || color
    }
    return color
  },
  
  // Apply consistent transitions
  transition: (type: keyof typeof designTokens.transitions = 'normal') => 
    `transition-all ${designTokens.transitions[type]}`,
  
  // Apply consistent shadows
  shadow: (size: keyof typeof designTokens.shadows = 'md') => 
    designTokens.shadows[size],
  
  // Apply consistent border radius
  radius: (size: keyof typeof designTokens.borderRadius = 'md') => 
    designTokens.borderRadius[size],
  
  // Apply consistent z-index
  z: (level: keyof typeof designTokens.zIndex) => 
    designTokens.zIndex[level]
}

// CSS-in-JS helper for consistent styling
export const createStyles = (styles: Record<string, any>) => {
  return Object.entries(styles).reduce((acc, [key, value]) => {
    acc[key] = cn(value)
    return acc
  }, {} as Record<string, string>)
}

// Responsive design utilities
export const responsive = {
  // Breakpoint utilities
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
  
  // Responsive spacing
  spacing: (sizes: Partial<Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', keyof typeof designTokens.spacing>>) => {
    return Object.entries(sizes).map(([breakpoint, size]) => 
      `${responsive[breakpoint as keyof typeof responsive]}${designTokens.spacing[size]}`
    ).join(' ')
  }
}

// Animation presets for common interactions
export const animationPresets = {
  // Hover effects
  hover: {
    lift: 'hover:scale-105 hover:shadow-lg transition-all duration-200',
    glow: 'hover:shadow-lg hover:shadow-primary/25 transition-all duration-200',
    slide: 'hover:translate-x-1 transition-transform duration-200',
    fade: 'hover:opacity-80 transition-opacity duration-200'
  },
  
  // Focus effects
  focus: {
    ring: 'focus:ring-2 focus:ring-primary focus:ring-offset-2',
    outline: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  },
  
  // Loading states
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    ping: 'animate-ping'
  }
}

// Export everything for easy importing
export default {
  designTokens,
  animations,
  componentVariants,
  uiUtils,
  createStyles,
  responsive,
  animationPresets
}
