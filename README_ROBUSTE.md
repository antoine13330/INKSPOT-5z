# 🚀 **Système de Réservation et Paiement Robustifié - Guide d'Utilisation**

## 📋 **Vue d'ensemble**

Ce guide explique comment utiliser le système robustifié de réservation et de paiement d'InkSpot. Le système a été conçu pour être **facile à utiliser**, **fiable** et **maintenable**.

## 🚀 **Démarrage Rapide**

### **1. Installation des Dépendances**

```bash
npm install zod @types/node
```

### **2. Configuration de Base**

```typescript
// lib/config/system-config.ts
import { SystemConfig } from './system-config'

// La configuration est automatiquement chargée
console.log(SystemConfig.appointments.validation.title.minLength) // 3
```

### **3. Utilisation Basique**

```typescript
import { useAppointments } from '@/hooks/useAppointments'
import { ErrorBoundary } from '@/components/ui/error-boundary'

function AppointmentsList() {
  const [state, actions] = useAppointments({
    autoRefresh: true,
    refreshInterval: 30000
  })

  return (
    <ErrorBoundary>
      {state.loading ? (
        <div>Chargement...</div>
      ) : (
        <div>
          {state.appointments.map(appointment => (
            <div key={appointment.id}>{appointment.title}</div>
          ))}
        </div>
      )}
    </ErrorBoundary>
  )
}
```

## 🏗️ **Architecture et Composants**

### **1. Service Layer**

#### **AppointmentService**

```typescript
import { AppointmentService } from '@/lib/services/appointment-service'

// Créer un appointment
const appointment = await AppointmentService.createAppointment({
  title: 'Tatouage personnalisé',
  description: 'Design unique sur mesure',
  type: 'TATTOO',
  startDate: new Date('2024-01-15T10:00:00Z'),
  endDate: new Date('2024-01-15T12:00:00Z'),
  duration: 120,
  price: 150,
  clientId: 'client_id',
  proId: 'pro_id'
})

// Récupérer un appointment
const appointment = await AppointmentService.getAppointmentById('id', 'user_id')

// Changer le statut
await AppointmentService.changeAppointmentStatus('id', 'ACCEPTED', 'user_id')
```

#### **PaymentService**

```typescript
import { PaymentService } from '@/lib/services/payment-service'

// Créer une intention de paiement
const { payment, paymentIntent } = await PaymentService.createPaymentIntent({
  amount: 50,
  currency: 'EUR',
  appointmentId: 'appointment_id',
  clientId: 'client_id',
  proId: 'pro_id',
  description: 'Acompte pour tatouage',
  type: 'DEPOSIT'
})

// Confirmer un paiement
const confirmedPayment = await PaymentService.confirmPayment({
  paymentIntentId: 'pi_xxx',
  appointmentId: 'appointment_id',
  clientId: 'client_id',
  proId: 'pro_id'
})
```

### **2. Hooks Personnalisés**

#### **useAppointments**

```typescript
import { useAppointments } from '@/hooks/useAppointments'

function AppointmentsManager() {
  const [state, actions] = useAppointments({
    autoRefresh: true,
    refreshInterval: 30000,
    filters: { 
      status: ['PROPOSED', 'ACCEPTED'],
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }
    },
    sort: { field: 'startDate', direction: 'asc' },
    limit: 20
  })

  const handleCreate = async (data) => {
    try {
      await actions.createAppointment(data)
      toast.success('Appointment créé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await actions.changeStatus(id, newStatus)
      toast.success('Statut mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div>
      {/* Affichage des appointments */}
      {state.appointments.map(appointment => (
        <AppointmentCard 
          key={appointment.id}
          appointment={appointment}
          onStatusChange={handleStatusChange}
        />
      ))}

      {/* Pagination infinie */}
      {state.hasMore && (
        <Button onClick={actions.loadMore}>
          Charger plus
        </Button>
      )}

      {/* Gestion des erreurs */}
      {state.error && (
        <div className="text-red-600">{state.error}</div>
      )}
    </div>
  )
}
```

#### **useAppointmentById**

```typescript
import { useAppointmentById } from '@/hooks/useAppointments'

function AppointmentDetails({ appointmentId }) {
  const { appointment, loading, error, refresh } = useAppointmentById(appointmentId)

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  if (!appointment) return <div>Appointment non trouvé</div>

  return (
    <div>
      <h1>{appointment.title}</h1>
      <p>Statut: {appointment.status}</p>
      <p>Prix: {appointment.price}€</p>
      <Button onClick={refresh}>Actualiser</Button>
    </div>
  )
}
```

### **3. Gestion d'Erreurs**

#### **ErrorBoundary**

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log l'erreur ou l'envoyer à un service de monitoring
        console.error('Error caught:', error, errorInfo)
      }}
    >
      <AppointmentsManager />
    </ErrorBoundary>
  )
}
```

#### **useErrorHandler**

```typescript
import { useErrorHandler } from '@/components/ui/error-boundary'

function MyComponent() {
  const { error, handleError, clearError, ErrorDisplay } = useErrorHandler()

  const handleRiskyOperation = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div>
      <ErrorDisplay />
      <Button onClick={handleRiskyOperation}>
        Opération risquée
      </Button>
    </div>
  )
}
```

### **4. Validation des Formulaires**

#### **useFormValidation**

```typescript
import { useFormValidation, ValidationRules } from '@/components/ui/form-validation'

function AppointmentForm() {
  const validation = useFormValidation(
    {
      title: '',
      description: '',
      price: 0,
      startDate: null,
      endDate: null
    },
    {
      rules: {
        title: [
          ValidationRules.required('Le titre est requis'),
          ValidationRules.minLength(3, 'Minimum 3 caractères'),
          ValidationRules.maxLength(100, 'Maximum 100 caractères')
        ],
        description: [
          ValidationRules.minLength(10, 'Minimum 10 caractères'),
          ValidationRules.maxLength(500, 'Maximum 500 caractères')
        ],
        price: [
          ValidationRules.required('Le prix est requis'),
          ValidationRules.numeric('Le prix doit être un nombre'),
          ValidationRules.custom(
            (value) => value > 0,
            'Le prix doit être positif'
          )
        ],
        startDate: [
          ValidationRules.required('La date de début est requise'),
          ValidationRules.custom(
            (value) => value > new Date(),
            'La date doit être dans le futur'
          )
        ]
      },
      validateOnChange: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      debounceMs: 300
    }
  )

  const handleSubmit = async (values) => {
    try {
      await createAppointment(values)
      toast.success('Appointment créé')
      validation.reset()
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  return (
    <form onSubmit={validation.handleSubmit(handleSubmit)}>
      <ValidationField
        fieldName="title"
        label="Titre"
        validation={validation.validation.title}
      >
        <Input
          value={validation.values.title}
          onChange={(e) => validation.setValue('title', e.target.value)}
          onBlur={() => validation.handleBlur('title')}
          className={validation.isFieldValid('title') ? '' : 'border-red-500'}
        />
      </ValidationField>

      <ValidationField
        fieldName="description"
        label="Description"
        validation={validation.validation.description}
      >
        <Textarea
          value={validation.values.description}
          onChange={(e) => validation.setValue('description', e.target.value)}
          onBlur={() => validation.handleBlur('description')}
        />
      </ValidationField>

      <ValidationField
        fieldName="price"
        label="Prix"
        validation={validation.validation.price}
      >
        <Input
          type="number"
          value={validation.values.price}
          onChange={(e) => validation.setValue('price', Number(e.target.value))}
          onBlur={() => validation.handleBlur('price')}
        />
      </ValidationField>

      <Button 
        type="submit" 
        disabled={validation.isSubmitting || validation.hasErrors()}
      >
        {validation.isSubmitting ? 'Création...' : 'Créer l\'appointment'}
      </Button>
    </form>
  )
}
```

## 🔧 **Configuration Avancée**

### **1. Configuration du Système**

```typescript
// lib/config/system-config.ts
export const SystemConfig = {
  appointments: {
    validation: {
      title: {
        minLength: 5, // Personnaliser la longueur minimale
        maxLength: 150 // Personnaliser la longueur maximale
      }
    },
    conflicts: {
      bufferTime: 45 * 60 * 1000 // 45 minutes entre appointments
    }
  },
  payments: {
    stripe: {
      currency: 'usd', // Changer la devise par défaut
      paymentMethods: ['card', 'apple_pay', 'google_pay']
    }
  }
}
```

### **2. Configuration des Hooks**

```typescript
const [state, actions] = useAppointments({
  autoRefresh: true,
  refreshInterval: 60000, // 1 minute
  filters: {
    status: ['PROPOSED', 'ACCEPTED'],
    type: ['TATTOO', 'PIERCING'],
    search: 'tatouage'
  },
  sort: {
    field: 'price',
    direction: 'desc'
  },
  limit: 50
})
```

### **3. Configuration de la Validation**

```typescript
const validation = useFormValidation(initialValues, {
  rules: {
    // Règles personnalisées
    customField: [
      ValidationRules.custom(
        async (value) => {
          // Validation asynchrone
          const response = await fetch('/api/validate', {
            method: 'POST',
            body: JSON.stringify({ value })
          })
          return response.ok
        },
        'Validation échouée'
      )
    ]
  },
  validateOnChange: false, // Désactiver la validation en temps réel
  validateOnBlur: true,    // Valider seulement au blur
  debounceMs: 500         // Délai de 500ms
})
```

## 📱 **Exemples d'Intégration**

### **1. Liste des Appointments avec Filtres**

```typescript
function AppointmentsList() {
  const [state, actions] = useAppointments({
    autoRefresh: true,
    filters: { status: ['PROPOSED', 'ACCEPTED'] }
  })

  const [filters, setFilters] = useState({
    status: ['PROPOSED', 'ACCEPTED'],
    search: '',
    dateRange: null
  })

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    actions.updateFilters(newFilters)
  }

  return (
    <div>
      {/* Filtres */}
      <FilterPanel 
        filters={filters}
        onChange={handleFilterChange}
        onReset={actions.resetFilters}
      />

      {/* Liste */}
      <div className="space-y-4">
        {state.appointments.map(appointment => (
          <AppointmentCard 
            key={appointment.id}
            appointment={appointment}
            onStatusChange={actions.changeStatus}
            onEdit={actions.updateAppointment}
          />
        ))}
      </div>

      {/* Pagination */}
      {state.hasMore && (
        <Button 
          onClick={actions.loadMore}
          disabled={state.loading}
          className="w-full mt-4"
        >
          {state.loading ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}
    </div>
  )
}
```

### **2. Formulaire de Création avec Validation**

```typescript
function CreateAppointmentForm() {
  const validation = useFormValidation(initialValues, validationConfig)
  const { createAppointment } = useAppointments()

  const handleSubmit = async (values) => {
    try {
      await createAppointment({
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString()
      })
      
      toast.success('Appointment créé avec succès')
      validation.reset()
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  return (
    <form onSubmit={validation.handleSubmit(handleSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ValidationField
          fieldName="title"
          label="Titre du rendez-vous"
          validation={validation.validation.title}
        >
          <Input
            placeholder="Ex: Tatouage personnalisé"
            value={validation.values.title}
            onChange={(e) => validation.setValue('title', e.target.value)}
            onBlur={() => validation.handleBlur('title')}
          />
        </ValidationField>

        <ValidationField
          fieldName="price"
          label="Prix (€)"
          validation={validation.validation.price}
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            value={validation.values.price}
            onChange={(e) => validation.setValue('price', Number(e.target.value))}
            onBlur={() => validation.handleBlur('price')}
          />
        </ValidationField>
      </div>

      <ValidationField
        fieldName="description"
        label="Description"
        validation={validation.validation.description}
      >
        <Textarea
          placeholder="Décrivez le rendez-vous..."
          rows={4}
          value={validation.values.description}
          onChange={(e) => validation.setValue('description', e.target.value)}
          onBlur={() => validation.handleBlur('description')}
        />
      </ValidationField>

      <div className="flex justify-end gap-4 mt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={validation.reset}
        >
          Réinitialiser
        </Button>
        
        <Button 
          type="submit"
          disabled={validation.isSubmitting || validation.hasErrors()}
        >
          {validation.isSubmitting ? 'Création...' : 'Créer le rendez-vous'}
        </Button>
      </div>
    </form>
  )
}
```

## 🧪 **Tests et Débogage**

### **1. Tests Unitaires**

```typescript
// __tests__/services/appointment-service.test.ts
import { AppointmentService } from '@/lib/services/appointment-service'

describe('AppointmentService', () => {
  it('should create appointment with valid data', async () => {
    const appointmentData = {
      title: 'Test Appointment',
      description: 'Test Description',
      type: 'TATTOO',
      startDate: new Date('2024-01-15T10:00:00Z'),
      endDate: new Date('2024-01-15T12:00:00Z'),
      duration: 120,
      price: 100,
      clientId: 'client_id',
      proId: 'pro_id'
    }

    const appointment = await AppointmentService.createAppointment(appointmentData)
    
    expect(appointment).toBeDefined()
    expect(appointment.title).toBe(appointmentData.title)
    expect(appointment.status).toBe('PROPOSED')
  })
})
```

### **2. Tests des Hooks**

```typescript
// __tests__/hooks/useAppointments.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAppointments } from '@/hooks/useAppointments'

describe('useAppointments', () => {
  it('should load appointments on mount', async () => {
    const { result } = renderHook(() => useAppointments())
    
    expect(result.current[0].loading).toBe(true)
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    expect(result.current[0].loading).toBe(false)
  })
})
```

### **3. Débogage**

```typescript
// Activer les logs de débogage
const [state, actions] = useAppointments({
  autoRefresh: true,
  refreshInterval: 30000
})

// Logs automatiques dans la console
console.log('Appointments state:', state)
console.log('Appointments actions:', actions)

// Gestion des erreurs avec plus de détails
const handleError = (error) => {
  console.group('Appointment Error')
  console.error('Error:', error)
  console.error('State:', state)
  console.error('Timestamp:', new Date().toISOString())
  console.groupEnd()
}
```

## 📚 **Ressources Supplémentaires**

- **Documentation complète** : `docs/SYSTEME_ROBUSTE.md`
- **Configuration** : `lib/config/system-config.ts`
- **Exemples d'utilisation** : Ce fichier README
- **Tests** : Dossier `__tests__/`

## 🤝 **Support et Contribution**

Si vous rencontrez des problèmes ou avez des questions :

1. **Vérifiez la documentation** : `docs/SYSTEME_ROBUSTE.md`
2. **Consultez les exemples** : Ce fichier README
3. **Ouvrez une issue** : Décrivez le problème en détail
4. **Proposez une amélioration** : Pull request avec tests

---

*Ce système robustifié vous permet de créer des applications fiables et maintenables. N'hésitez pas à l'adapter à vos besoins spécifiques !*
