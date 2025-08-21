// ============================================================================
// CONFIGURATION DU SYSTÈME ROBUSTIFIÉ
// ============================================================================

export const SystemConfig = {
  // ========================================================================
  // CONFIGURATION DES APPOINTMENTS
  // ========================================================================
  appointments: {
    // Limites de validation
    validation: {
      title: {
        minLength: 3,
        maxLength: 100
      },
      description: {
        minLength: 10,
        maxLength: 500
      },
      duration: {
        min: 15, // 15 minutes
        max: 480 // 8 heures
      },
      price: {
        min: 0,
        max: 10000 // 10 000€
      },
      deposit: {
        minPercentage: 0.1, // 10%
        maxPercentage: 0.5  // 50%
      }
    },

    // Statuts et transitions
    status: {
      allowedTransitions: {
        PROPOSED: ['ACCEPTED', 'CANCELLED'],
        ACCEPTED: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PAID', 'CANCELLED'],
        PAID: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: [],
        DRAFT: ['PROPOSED']
      },
      
      roles: {
        PROPOSED: ['CLIENT'],
        ACCEPTED: ['PRO'],
        CONFIRMED: ['CLIENT', 'PRO'],
        PAID: ['PRO'],
        IN_PROGRESS: ['PRO'],
        COMPLETED: ['PRO'],
        CANCELLED: ['CLIENT', 'PRO'],
        NO_SHOW: ['PRO'],
        DRAFT: ['PRO']
      }
    },

    // Gestion des conflits
    conflicts: {
      checkInterval: 15 * 60 * 1000, // 15 minutes
      bufferTime: 30 * 60 * 1000,    // 30 minutes entre appointments
      maxConcurrent: 1
    },

    // Notifications
    notifications: {
      enabled: true,
      channels: ['email', 'push', 'in_app'],
      templates: {
        proposal_received: {
          title: 'Nouvelle proposition de rendez-vous',
          message: 'Le professionnel vous a proposé un rendez-vous: "{title}"'
        },
        proposal_sent: {
          title: 'Proposition de rendez-vous envoyée',
          message: 'Vous avez proposé un rendez-vous à {clientName}: "{title}"'
        },
        status_changed: {
          title: 'Statut du rendez-vous mis à jour',
          message: 'Le rendez-vous "{title}" est maintenant {status}'
        }
      }
    }
  },

  // ========================================================================
  // CONFIGURATION DES PAIEMENTS
  // ========================================================================
  payments: {
    // Stripe
    stripe: {
      currency: 'eur',
      supportedCurrencies: ['eur', 'usd', 'gbp'],
      paymentMethods: ['card', 'sepa_debit', 'sofort'],
      captureMethod: 'automatic',
      confirmationMethod: 'automatic'
    },

    // Validation
    validation: {
      amount: {
        min: 0.01,
        max: 10000
      },
      description: {
        minLength: 3,
        maxLength: 200
      }
    },

    // Remboursements
    refunds: {
      enabled: true,
      maxDays: 30,
      reasons: [
        'requested_by_customer',
        'duplicate',
        'fraudulent',
        'product_not_received',
        'product_unacceptable',
        'incorrect_amount'
      ]
    },

    // Notifications
    notifications: {
      payment_received: {
        title: 'Paiement reçu',
        message: 'Vous avez reçu un paiement de {amount}€'
      },
      payment_confirmed: {
        title: 'Paiement confirmé',
        message: 'Votre paiement de {amount}€ a été confirmé'
      },
      refund_processed: {
        title: 'Remboursement effectué',
        message: 'Un remboursement de {amount}€ a été effectué'
      }
    }
  },

  // ========================================================================
  // CONFIGURATION DE LA GESTION D'ÉTAT
  // ========================================================================
  state: {
    // Auto-refresh
    autoRefresh: {
      enabled: true,
      defaultInterval: 30000, // 30 secondes
      intervals: {
        appointments: 30000,
        payments: 60000,
        notifications: 15000
      }
    },

    // Pagination
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
      loadMoreThreshold: 0.8 // Charger plus quand 80% de la liste est visible
    },

    // Cache
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100 // Nombre maximum d'éléments en cache
    }
  },

  // ========================================================================
  // CONFIGURATION DE LA GESTION D'ERREURS
  // ========================================================================
  errorHandling: {
    // Error Boundary
    errorBoundary: {
      enabled: true,
      reportErrors: true,
      showFallback: true,
      resetOnPropsChange: true
    },

    // Validation
    validation: {
      showWarnings: true,
      debounceMs: 300,
      validateOnChange: true,
      validateOnBlur: true,
      validateOnSubmit: true
    },

    // Réseau
    network: {
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 10000,
      showNetworkErrors: true
    },

    // Logging
    logging: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
      includeStack: process.env.NODE_ENV === 'development',
      includeUserAgent: true,
      includeUrl: true
    }
  },

  // ========================================================================
  // CONFIGURATION DE LA SÉCURITÉ
  // ========================================================================
  security: {
    // Authentification
    auth: {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
      refreshToken: true,
      requireEmailVerification: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    },

    // Autorisation
    authorization: {
      roleBased: true,
      permissionBased: true,
      checkOnEveryRequest: true
    },

    // Validation des entrées
    inputValidation: {
      sanitize: true,
      maxLength: 10000,
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: ['href', 'target']
    },

    // Rate limiting
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false
    }
  },

  // ========================================================================
  // CONFIGURATION DES PERFORMANCES
  // ========================================================================
  performance: {
    // Lazy loading
    lazyLoading: {
      enabled: true,
      threshold: 0.1,
      rootMargin: '50px'
    },

    // Debounce
    debounce: {
      search: 300,
      form: 500,
      scroll: 100
    },

    // Throttle
    throttle: {
      scroll: 100,
      resize: 250,
      mousemove: 16
    },

    // Optimisation des images
    images: {
      lazy: true,
      placeholder: true,
      responsive: true,
      formats: ['webp', 'avif', 'jpeg']
    }
  },

  // ========================================================================
  // CONFIGURATION DU MONITORING
  // ========================================================================
  monitoring: {
    // Métriques
    metrics: {
      enabled: true,
      interval: 60000, // 1 minute
      trackPerformance: true,
      trackErrors: true,
      trackUserActions: true
    },

    // Alertes
    alerts: {
      enabled: true,
      errorThreshold: 5, // Nombre d'erreurs avant alerte
      performanceThreshold: 3000, // Temps de réponse en ms
      notificationChannels: ['email', 'slack']
    },

    // Logs
    logs: {
      level: 'info',
      format: 'json',
      destination: 'console', // console, file, external
      retention: '30d'
    }
  },

  // ========================================================================
  // CONFIGURATION DES TESTS
  // ========================================================================
  testing: {
    // Tests unitaires
    unit: {
      coverage: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      },
      timeout: 5000
    },

    // Tests d'intégration
    integration: {
      timeout: 30000,
      retries: 2,
      parallel: true
    },

    // Tests E2E
    e2e: {
      timeout: 60000,
      retries: 1,
      parallel: false,
      browsers: ['chromium', 'firefox', 'webkit']
    }
  }
}

// ============================================================================
// TYPES DE CONFIGURATION
// ============================================================================

export type SystemConfigType = typeof SystemConfig

// ============================================================================
// UTILITAIRES DE CONFIGURATION
// ============================================================================

export function getConfig<T extends keyof SystemConfigType>(
  key: T
): SystemConfigType[T] {
  return SystemConfig[key]
}

export function getNestedConfig<T>(
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let value: any = SystemConfig

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return defaultValue
    }
  }

  return value
}

export function isFeatureEnabled(feature: string): boolean {
  const featureConfig = getNestedConfig<boolean>(`features.${feature}`)
  return featureConfig ?? false
}

export function getEnvironmentConfig(): Partial<SystemConfigType> {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return {
        errorHandling: {
          ...SystemConfig.errorHandling,
          logging: {
            ...SystemConfig.errorHandling.logging,
            level: 'error',
            includeStack: false
          }
        },
        monitoring: {
          ...SystemConfig.monitoring,
          metrics: {
            ...SystemConfig.monitoring.metrics,
            trackUserActions: false
          }
        }
      }
    
    case 'test':
      return {
        state: {
          ...SystemConfig.state,
          autoRefresh: {
            ...SystemConfig.state.autoRefresh,
            enabled: false
          }
        },
        monitoring: {
          ...SystemConfig.monitoring,
          metrics: {
            ...SystemConfig.monitoring.metrics,
            enabled: false
          }
        }
      }
    
    default:
      return SystemConfig
  }
}

// ============================================================================
// VALIDATION DE LA CONFIGURATION
// ============================================================================

export function validateConfig(): string[] {
  const errors: string[] = []

  // Validation des appointments
  if (SystemConfig.appointments.validation.duration.min < 0) {
    errors.push('La durée minimale des appointments ne peut pas être négative')
  }

  if (SystemConfig.appointments.validation.duration.max > 1440) {
    errors.push('La durée maximale des appointments ne peut pas dépasser 24 heures')
  }

  if (SystemConfig.appointments.validation.price.max > 100000) {
    errors.push('Le prix maximum des appointments ne peut pas dépasser 100 000€')
  }

  // Validation des paiements
  if (SystemConfig.payments.validation.amount.max > 100000) {
    errors.push('Le montant maximum des paiements ne peut pas dépasser 100 000€')
  }

  // Validation de la sécurité
  if (SystemConfig.security.auth.maxLoginAttempts < 1) {
    errors.push('Le nombre maximum de tentatives de connexion doit être au moins 1')
  }

  if (SystemConfig.security.rateLimiting.maxRequests < 1) {
    errors.push('Le nombre maximum de requêtes par fenêtre doit être au moins 1')
  }

  return errors
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default SystemConfig
