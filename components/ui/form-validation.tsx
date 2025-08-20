"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type ValidationRule = {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'email' | 'phone' | 'url' | 'numeric' | 'date'
  value?: any
  message: string
  validator?: (value: any) => boolean | Promise<boolean>
}

export type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  touched: boolean
}

export type ValidationConfig = {
  rules: ValidationRule[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  showWarnings?: boolean
  debounceMs?: number
}

// ============================================================================
// HOOK DE VALIDATION
// ============================================================================

export function useFormValidation(
  initialValues: Record<string, any>,
  config: ValidationConfig
) {
  const [values, setValues] = useState(initialValues)
  const [validation, setValidation] = useState<Record<string, ValidationResult>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({})

  // ========================================================================
  // VALIDATION DES CHAMPS
  // ========================================================================
  
  const validateField = useCallback(async (fieldName: string, value: any): Promise<ValidationResult> => {
    const fieldRules = config.rules.filter(rule => 
      rule.type === 'custom' || 
      (rule.type === 'required' && value === undefined) ||
      (rule.type === 'minLength' && typeof value === 'string' && value.length < rule.value) ||
      (rule.type === 'maxLength' && typeof value === 'string' && value.length > rule.value) ||
      (rule.type === 'pattern' && rule.value && !rule.value.test(value)) ||
      (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
      (rule.type === 'phone' && !/^[+]?[1-9][\d]{0,15}$/.test(value)) ||
      (rule.type === 'url' && !/^https?:\/\/.+/.test(value)) ||
      (rule.type === 'numeric' && isNaN(Number(value))) ||
      (rule.type === 'date' && isNaN(Date.parse(value)))
    )

    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of fieldRules) {
      if (rule.type === 'custom' && rule.validator) {
        try {
          const isValid = await rule.validator(value)
          if (!isValid) {
            errors.push(rule.message)
          }
        } catch (error) {
          errors.push(`Erreur de validation: ${error.message}`)
        }
      } else if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
        errors.push(rule.message)
      } else if (rule.type === 'minLength' && typeof value === 'string' && value.length < rule.value) {
        errors.push(rule.message)
      } else if (rule.type === 'maxLength' && typeof value === 'string' && value.length > rule.value) {
        warnings.push(rule.message)
      } else if (rule.type === 'pattern' && rule.value && !rule.value.test(value)) {
        errors.push(rule.message)
      } else if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(rule.message)
      } else if (rule.type === 'phone' && !/^[+]?[1-9][\d]{0,15}$/.test(value)) {
        errors.push(rule.message)
      } else if (rule.type === 'url' && !/^https?:\/\/.+/.test(value)) {
        errors.push(rule.message)
      } else if (rule.type === 'numeric' && isNaN(Number(value))) {
        errors.push(rule.message)
      } else if (rule.type === 'date' && isNaN(Date.parse(value))) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: config.showWarnings ? warnings : [],
      touched: true
    }
  }, [config])

  const validateAllFields = useCallback(async (): Promise<boolean> => {
    const fieldValidations: Record<string, ValidationResult> = {}
    let allValid = true

    for (const [fieldName, value] of Object.entries(values)) {
      const validation = await validateField(fieldName, value)
      fieldValidations[fieldName] = validation
      
      if (!validation.isValid) {
        allValid = false
      }
    }

    setValidation(fieldValidations)
    return allValid
  }, [values, validateField])

  // ========================================================================
  // GESTION DES CHANGEMENTS
  // ========================================================================
  
  const setValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))

    // Validation en temps réel si configurée
    if (config.validateOnChange) {
      // Annuler le timer précédent
      if (debounceTimers[fieldName]) {
        clearTimeout(debounceTimers[fieldName])
      }

      // Créer un nouveau timer
      const timer = setTimeout(async () => {
        const fieldValidation = await validateField(fieldName, value)
        setValidation(prev => ({
          ...prev,
          [fieldName]: fieldValidation
        }))
      }, config.debounceMs || 300)

      setDebounceTimers(prev => ({
        ...prev,
        [fieldName]: timer
      }))
    }
  }, [config.validateOnChange, config.debounceMs, debounceTimers, validateField])

  const handleBlur = useCallback(async (fieldName: string) => {
    if (config.validateOnBlur) {
      const fieldValidation = await validateField(fieldName, values[fieldName])
      setValidation(prev => ({
        ...prev,
        [fieldName]: fieldValidation
      }))
    }
  }, [config.validateOnBlur, values, validateField])

  const handleSubmit = useCallback(async (onSubmit: (values: any) => void | Promise<void>) => {
    if (config.validateOnSubmit) {
      const isValid = await validateAllFields()
      if (!isValid) {
        return false
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
      return true
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [config.validateOnSubmit, validateAllFields, values])

  // ========================================================================
  // RÉINITIALISATION
  // ========================================================================
  
  const reset = useCallback(() => {
    setValues(initialValues)
    setValidation({})
    setIsSubmitting(false)
  }, [initialValues])

  const resetField = useCallback((fieldName: string) => {
    setValues(prev => ({ ...prev, [fieldName]: initialValues[fieldName] }))
    setValidation(prev => {
      const newValidation = { ...prev }
      delete newValidation[fieldName]
      return newValidation
    })
  }, [initialValues])

  // ========================================================================
  // UTILITAIRES
  // ========================================================================
  
  const getFieldError = useCallback((fieldName: string): string | null => {
    return validation[fieldName]?.errors[0] || null
  }, [validation])

  const getFieldWarning = useCallback((fieldName: string): string | null => {
    return validation[fieldName]?.warnings[0] || null
  }, [validation])

  const isFieldValid = useCallback((fieldName: string): boolean => {
    return validation[fieldName]?.isValid ?? true
  }, [validation])

  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return validation[fieldName]?.touched ?? false
  }, [validation])

  const hasErrors = useCallback((): boolean => {
    return Object.values(validation).some(field => field.errors.length > 0)
  }, [validation])

  const hasWarnings = useCallback((): boolean => {
    return Object.values(validation).some(field => field.warnings.length > 0)
  }, [validation])

  // ========================================================================
  // NETTOYAGE
  // ========================================================================
  
  useEffect(() => {
    return () => {
      // Nettoyer tous les timers
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer))
    }
  }, [debounceTimers])

  // ========================================================================
  // RETOUR
  // ========================================================================
  
  return {
    values,
    validation,
    isSubmitting,
    setValue,
    handleBlur,
    handleSubmit,
    reset,
    resetField,
    getFieldError,
    getFieldWarning,
    isFieldValid,
    isFieldTouched,
    hasErrors,
    hasWarnings,
    validateField,
    validateAllFields
  }
}

// ============================================================================
// COMPOSANTS DE VALIDATION
// ============================================================================

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  className?: string
}

export function ValidationMessage({ type, message, className }: ValidationMessageProps) {
  const icons = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  }

  const colors = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    success: 'text-green-600 bg-green-50 border-green-200'
  }

  const Icon = icons[type]

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-md border text-sm',
      colors[type],
      className
    )}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

interface ValidationFieldProps {
  fieldName: string
  label: string
  children: React.ReactNode
  validation: ValidationResult | undefined
  showWarnings?: boolean
  className?: string
}

export function ValidationField({ 
  fieldName, 
  label, 
  children, 
  validation, 
  showWarnings = true,
  className 
}: ValidationFieldProps) {
  const hasError = validation?.errors.length > 0
  const hasWarning = showWarnings && validation?.warnings.length > 0
  const isTouched = validation?.touched

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {children}
      
      {/* Messages d'erreur */}
      {isTouched && hasError && (
        <ValidationMessage 
          type="error" 
          message={validation.errors[0]} 
        />
      )}
      
      {/* Messages d'avertissement */}
      {isTouched && hasWarning && (
        <ValidationMessage 
          type="warning" 
          message={validation.warnings[0]} 
        />
      )}
    </div>
  )
}

// ============================================================================
// RÈGLES DE VALIDATION PRÉDÉFINIES
// ============================================================================

export const ValidationRules = {
  required: (message = 'Ce champ est requis'): ValidationRule => ({
    type: 'required',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: min,
    message: message || `Minimum ${min} caractères`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: max,
    message: message || `Maximum ${max} caractères`
  }),

  email: (message = 'Email invalide'): ValidationRule => ({
    type: 'email',
    message
  }),

  phone: (message = 'Numéro de téléphone invalide'): ValidationRule => ({
    type: 'phone',
    message
  }),

  url: (message = 'URL invalide'): ValidationRule => ({
    type: 'url',
    message
  }),

  numeric: (message = 'Valeur numérique requise'): ValidationRule => ({
    type: 'numeric',
    message
  }),

  date: (message = 'Date invalide'): ValidationRule => ({
    type: 'date',
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    value: regex,
    message
  }),

  custom: (validator: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
    type: 'custom',
    validator,
    message
  })
}

// ============================================================================
// HOOK POUR LA VALIDATION EN TEMPS RÉEL
// ============================================================================

export function useRealTimeValidation(
  value: any,
  rules: ValidationRule[],
  debounceMs = 300
) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    touched: false
  })

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value !== undefined && value !== null && value !== '') {
        const errors: string[] = []
        const warnings: string[] = []

        for (const rule of rules) {
          let isValid = true

          try {
            switch (rule.type) {
              case 'required':
                isValid = value !== undefined && value !== null && value !== ''
                break
              case 'minLength':
                isValid = typeof value === 'string' && value.length >= rule.value
                break
              case 'maxLength':
                isValid = typeof value === 'string' && value.length <= rule.value
                if (!isValid) warnings.push(rule.message)
                continue
              case 'pattern':
                isValid = rule.value && rule.value.test(value)
                break
              case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                break
              case 'phone':
                isValid = /^[+]?[1-9][\d]{0,15}$/.test(value)
                break
              case 'url':
                isValid = /^https?:\/\/.+/.test(value)
                break
              case 'numeric':
                isValid = !isNaN(Number(value))
                break
              case 'date':
                isValid = !isNaN(Date.parse(value))
                break
              case 'custom':
                if (rule.validator) {
                  isValid = await rule.validator(value)
                }
                break
            }

            if (!isValid) {
              errors.push(rule.message)
            }
          } catch (error) {
            errors.push(`Erreur de validation: ${error.message}`)
          }
        }

        setValidation({
          isValid: errors.length === 0,
          errors,
          warnings,
          touched: true
        })
      } else {
        setValidation({
          isValid: true,
          errors: [],
          warnings: [],
          touched: false
        })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, rules, debounceMs])

  return validation
}
