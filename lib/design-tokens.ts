// Design Tokens - Centralisé pour éviter les doublons
export const designTokens = {
  colors: {
    // Base Colors
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceElevated: '#2a2a2a',
    border: '#333333',
    borderLight: '#404040',
    
    // Text Colors
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    textDisabled: '#666666',
    
    // Brand Colors
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    accent: '#10b981',
    accentLight: '#34d399',
    
    // Status Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Chat Colors
    chatUser: '#3b82f6',
    chatOther: '#2a2a2a',
    chatText: '#ffffff',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
  },
  
  zIndex: {
    base: 1,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },
} as const

// Types pour TypeScript
export type ColorToken = keyof typeof designTokens.colors
export type SpacingToken = keyof typeof designTokens.spacing
export type BorderRadiusToken = keyof typeof designTokens.borderRadius
export type FontSizeToken = keyof typeof designTokens.typography.fontSize
export type ShadowToken = keyof typeof designTokens.shadows
export type TransitionToken = keyof typeof designTokens.transitions
export type ZIndexToken = keyof typeof designTokens.zIndex 