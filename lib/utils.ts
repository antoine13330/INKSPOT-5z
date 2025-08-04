import { designTokens } from './design-tokens'

// ===== UTILITAIRES DE FORMATAGE =====

/**
 * Formate un timestamp en format relatif (maintenant, hier, date)
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    return 'Maintenant'
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diffInHours < 48) {
    return 'Hier'
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }
}

/**
 * Formate un timestamp en format court (HH:MM)
 */
export function formatTime(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/**
 * Génère les initiales d'un nom
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ===== UTILITAIRES DE VALIDATION =====

/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un nom d'utilisateur
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * Valide un mot de passe
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

// ===== UTILITAIRES DE CLASSE CSS =====

/**
 * Génère des classes CSS conditionnelles
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Génère des classes CSS avec variants
 */
export function variantClasses(
  base: string,
  variants: Record<string, Record<string, string>>,
  props: Record<string, string>
): string {
  const classes = [base]
  
  Object.entries(props).forEach(([key, value]) => {
    if (variants[key]?.[value]) {
      classes.push(variants[key][value])
    }
  })
  
  return classes.join(' ')
}

// ===== UTILITAIRES DE DESIGN SYSTEM =====

/**
 * Obtient une couleur du design system
 */
export function getColor(color: keyof typeof designTokens.colors): string {
  return designTokens.colors[color]
}

/**
 * Obtient un espacement du design system
 */
export function getSpacing(spacing: keyof typeof designTokens.spacing): string {
  return designTokens.spacing[spacing]
}

/**
 * Obtient un rayon de bordure du design system
 */
export function getBorderRadius(radius: keyof typeof designTokens.borderRadius): string {
  return designTokens.borderRadius[radius]
}

// ===== UTILITAIRES DE NAVIGATION =====

/**
 * Génère un lien de navigation
 */
export function createNavLink(href: string, label: string, icon?: React.ComponentType<any>) {
  return { href, label, icon }
}

/**
 * Vérifie si un lien est actif
 */
export function isActiveLink(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

// ===== UTILITAIRES DE GESTION D'ÉTAT =====

/**
 * Gère l'état de chargement avec timeout
 */
export function createLoadingState(timeout = 3000) {
  return {
    isLoading: true,
    error: null as string | null,
    data: null as any,
    startLoading: () => ({ isLoading: true, error: null }),
    setError: (error: string) => ({ isLoading: false, error, data: null }),
    setData: (data: any) => ({ isLoading: false, error: null, data }),
  }
}

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ===== UTILITAIRES DE LOCALISATION =====

/**
 * Formate un nombre selon la locale
 */
export function formatNumber(number: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(number)
}

/**
 * Formate une date selon la locale
 */
export function formatDate(date: Date | string, locale = 'fr-FR'): string {
  return new Date(date).toLocaleDateString(locale)
}

/**
 * Formate une date et heure selon la locale
 */
export function formatDateTime(date: Date | string, locale = 'fr-FR'): string {
  return new Date(date).toLocaleString(locale)
}

// ===== UTILITAIRES DE STOCKAGE =====

/**
 * Stocke des données dans le localStorage avec expiration
 */
export function setLocalStorageWithExpiry(key: string, value: any, ttl: number): void {
  const item = {
    value,
    expiry: Date.now() + ttl,
  }
  localStorage.setItem(key, JSON.stringify(item))
}

/**
 * Récupère des données du localStorage avec vérification d'expiration
 */
export function getLocalStorageWithExpiry(key: string): any {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) return null

  const item = JSON.parse(itemStr)
  if (Date.now() > item.expiry) {
    localStorage.removeItem(key)
    return null
  }

  return item.value
}

// ===== UTILITAIRES DE GESTION D'ERREURS =====

/**
 * Gère les erreurs de manière cohérente
 */
export function handleError(error: unknown, context = 'Operation'): string {
  console.error(`${context} error:`, error)
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'Une erreur inattendue s\'est produite'
}

/**
 * Retry une fonction avec délai exponentiel
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
