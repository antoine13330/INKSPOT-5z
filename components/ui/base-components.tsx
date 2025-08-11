import React from 'react'
import { cn } from '@/lib/utils'
import { BaseComponentProps } from '@/types'

// ===== COMPOSANTS DE BASE =====

/**
 * Container de base avec styles cohérents
 */
export function Container({ 
  children, 
  className, 
  maxWidth = 'lg',
  padding = true 
}: BaseComponentProps & {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  padding?: boolean
}) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div className={cn(
      'mx-auto',
      maxWidthClasses[maxWidth],
      padding && 'px-4',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Section de base avec espacement
 */
export function Section({ 
  children, 
  className,
  spacing = 'lg'
}: BaseComponentProps & {
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const spacingClasses = {
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-12'
  }

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  )
}

/**
 * Divider avec styles cohérents
 */
export function Divider({ 
  className,
  orientation = 'horizontal',
  spacing = 'md'
}: {
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
}) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-6' : 'mx-6'
  }

  return (
    <div className={cn(
      'border-border',
      orientation === 'horizontal' ? 'border-t' : 'border-l',
      spacingClasses[spacing],
      className
    )} />
  )
}

/**
 * Badge de base réutilisable
 */
export function Badge({ 
  children, 
  className,
  variant = 'default',
  size = 'md',
  onClick,
  ...props
}: BaseComponentProps & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border bg-transparent',
    destructive: 'bg-destructive text-destructive-foreground'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Avatar de base réutilisable
 */
export function Avatar({ 
  src, 
  alt, 
  fallback,
  className,
  size = 'md'
}: {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden bg-muted flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img 
          src={src} 
          alt={alt || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-muted-foreground">
          {fallback || 'U'}
        </span>
      )}
    </div>
  )
}

/**
 * Bouton de base réutilisable
 */
export function Button({ 
  children, 
  className,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent hover:bg-accent',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

/**
 * Input de base réutilisable
 */
export function Input({ 
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}) {
  return (
    <div className="space-y-1">
      <input
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

/**
 * Label de base réutilisable
 */
export function Label({ 
  children, 
  className,
  htmlFor,
  required = false
}: BaseComponentProps & {
  htmlFor?: string
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

/**
 * Card de base réutilisable
 */
export function Card({ 
  children, 
  className,
  padding = true
}: BaseComponentProps & {
  padding?: boolean
}) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      padding && 'p-6',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Header de card réutilisable
 */
export function CardHeader({ 
  children, 
  className 
}: BaseComponentProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  )
}

/**
 * Contenu de card réutilisable
 */
export function CardContent({ 
  children, 
  className 
}: BaseComponentProps) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  )
}

/**
 * Footer de card réutilisable
 */
export function CardFooter({ 
  children, 
  className 
}: BaseComponentProps) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  )
}

/**
 * Loading spinner réutilisable
 */
export function Spinner({ 
  className,
  size = 'md'
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size],
      className
    )} />
  )
}

/**
 * État de chargement réutilisable
 */
export function LoadingState({ 
  message = 'Chargement...',
  className 
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <Spinner size="lg" className="mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * État d'erreur réutilisable
 */
export function ErrorState({ 
  message = 'Une erreur s\'est produite',
  onRetry,
  className 
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-destructive text-xl">!</span>
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Réessayer
        </Button>
      )}
    </div>
  )
}

/**
 * État vide réutilisable
 */
export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className 
}: {
  icon?: React.ComponentType<unknown>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      {Icon && (
        <Icon className="w-12 h-12 text-muted-foreground mb-4" />
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-center mb-4">{description}</p>
      )}
      {action}
    </div>
  )
} 