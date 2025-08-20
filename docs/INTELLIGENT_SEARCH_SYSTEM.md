# Système de Recherche Intelligent - Documentation Complète

## Vue d'ensemble

Le **Système de Recherche Intelligent** est une solution avancée de recherche qui combine des fonctionnalités modernes avec une architecture robuste et performante. Il offre une expérience utilisateur exceptionnelle avec des suggestions intelligentes, des filtres avancés, et des analyses détaillées.

## 🚀 Fonctionnalités Principales

### 1. Recherche Intelligente
- **Recherche instantanée** avec suggestions en temps réel
- **Recherche manuelle** pour un contrôle total
- **Suggestions contextuelles** basées sur l'historique et les tendances
- **Scoring de pertinence** intelligent et personnalisé

### 2. Filtres Avancés
- **Localisation** avec rayon personnalisable
- **Fourchette de prix** dynamique
- **Note minimum** avec système d'étoiles
- **Expérience** en années
- **Options booléennes** (vérifié, réservation instantanée, consultation virtuelle)

### 3. Suggestions Intelligentes
- **Suggestions directes** basées sur le contenu de la base de données
- **Tendances** populaires et en hausse
- **Historique personnel** des recherches
- **Suggestions contextuelles** basées sur les patterns de recherche
- **Suggestions de filtres** intelligentes

### 4. Analytics et Insights
- **Métriques de performance** détaillées
- **Comportement utilisateur** analysé
- **Tendances de recherche** sur le temps
- **Insights par catégorie** et localisation
- **Suivi des conversions** et du taux de clic

### 5. Gestion des Données
- **Cache intelligent** avec TTL configurable
- **Historique des recherches** persistant
- **Recherches sauvegardées** pour un accès rapide
- **Export des données** d'analyse

## 🏗️ Architecture Technique

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    IntelligentSearchSystem                  │
│                     (React Component)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    SearchService                            │
│                   (Service Layer)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    API Endpoints                           │
│              (/api/search/*)                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    Database Layer                           │
│              (Prisma + Cache)                              │
└─────────────────────────────────────────────────────────────┘
```

### Structure des Fichiers

```
components/search/
├── IntelligentSearchSystem.tsx    # Composant principal
└── AdvancedFilters.tsx            # Filtres avancés

app/api/search/
├── suggestions/route.ts           # Suggestions intelligentes
├── analytics/route.ts             # Analytics et métriques
└── [query]/route.ts               # Recherche principale

lib/services/
└── search-service.ts              # Logique métier

types/
└── search.ts                      # Types TypeScript
```

## 🔧 Configuration et Installation

### 1. Dépendances Requises

```bash
npm install @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-switch
npm install @radix-ui/react-slider @radix-ui/react-label
npm install date-fns sonner lucide-react
```

### 2. Variables d'Environnement

```env
# Configuration de la base de données
DATABASE_URL="postgresql://..."

# Configuration du cache Redis (optionnel)
REDIS_URL="redis://..."

# Configuration des analytics
ANALYTICS_ENABLED=true
SEARCH_CACHE_TTL=300000
```

### 3. Configuration du Service

```typescript
import { SearchService } from '@/lib/services/search-service'

const searchService = new SearchService({
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxResults: 100,
  relevanceThreshold: 0.1
})
```

## 📊 Interface Utilisateur

### Composant Principal

```typescript
<IntelligentSearchSystem
  onSearch={handleSearch}
  onResultClick={handleResultClick}
  onFilterChange={handleFilterChange}
  className="w-full"
/>
```

### Props du Composant

| Prop | Type | Description |
|------|------|-------------|
| `onSearch` | `(query: string, filters: SearchFilters) => Promise<SearchResult[]>` | Fonction de recherche |
| `onResultClick` | `(result: SearchResult) => void` | Gestionnaire de clic sur un résultat |
| `onFilterChange` | `(filters: SearchFilters) => void` | Gestionnaire de changement de filtres |
| `className` | `string` | Classes CSS personnalisées |

### États du Composant

- **`searchQuery`** : Requête de recherche actuelle
- **`filters`** : Filtres appliqués
- **`results`** : Résultats de la recherche
- **`suggestions`** : Suggestions affichées
- **`isSearching`** : Indicateur de chargement
- **`activeTab`** : Onglet actif (résultats, analyses, sauvegardées)

## 🔍 Algorithmes de Recherche

### 1. Scoring de Pertinence

Le système utilise un algorithme de scoring multi-facteurs :

```typescript
relevanceScore = 
  textRelevance * 0.4 +      // Correspondance texte
  filterRelevance * 0.3 +    // Correspondance filtres
  recencyBonus * 0.1 +       // Bonus de fraîcheur
  popularityBonus * 0.1 +    // Bonus de popularité
  qualityScore * 0.1          // Score de qualité
```

#### Text Relevance
- **Correspondance exacte** : +50 points
- **Titre contient la requête** : +30 points
- **Description contient la requête** : +15 points
- **Correspondance mot par mot** : +10 points par mot

#### Filter Relevance
- **Localisation** : +20 points si correspondance
- **Distance** : +15 points maximum (décroissant avec la distance)
- **Prix** : +10 points si dans la fourchette
- **Note** : +5 points par étoile au-dessus du minimum
- **Options booléennes** : +5 points chacune

#### Recency Bonus
- **Aujourd'hui** : +10 points
- **Cette semaine** : +5 points
- **Ce mois** : +2 points

#### Popularity Bonus
- **Note** : +2 points par étoile
- **Avis** : +1 point par 10 avis (plafonné à 10)

#### Quality Score
- **Vérifié** : +5 points
- **Image** : +3 points
- **Tags** : +2 points
- **Disponibilité** : +2 points

### 2. Cache Intelligent

```typescript
interface CacheEntry {
  results: SearchResult[]
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, CacheEntry>()
```

**Stratégies de cache :**
- **Clé de cache** : Combinaison de la requête et des filtres
- **TTL** : 5 minutes par défaut
- **Invalidation** : Automatique après expiration
- **Taille maximale** : 100 entrées (LRU)

### 3. Suggestions Intelligentes

#### Types de Suggestions

1. **Directes** (relevance: 0.9)
   - Recherche dans les professionnels
   - Recherche dans les services
   - Recherche dans les spécialisations

2. **Tendances** (relevance: 0.6-0.8)
   - Requêtes populaires
   - Tendances en hausse/baisse
   - Basé sur le volume de recherche

3. **Personnelles** (relevance: 0.5-0.7)
   - Historique utilisateur
   - Recherches récentes
   - Préférences personnalisées

4. **Contextuelles** (relevance: 0.4)
   - Patterns de recherche
   - Expansions automatiques
   - Suggestions liées

5. **Filtres** (relevance: 0.3)
   - Localisation (code postal)
   - Prix (gratuit, économique)
   - Note (excellent, 5 étoiles)

## 📈 Analytics et Métriques

### Métriques Collectées

#### Performance de Recherche
- **Temps de réponse** moyen
- **Taux de cache** (hit rate)
- **Taux d'erreur**
- **Nombre total de requêtes**
- **Requêtes réussies/échouées**

#### Comportement Utilisateur
- **Taux de clic** (CTR)
- **Durée de session** moyenne
- **Taux de rebond**
- **Requêtes par session** moyenne
- **Filtres les plus utilisés**
- **Taux d'abandon** de recherche

#### Tendances et Insights
- **Volume de recherche** par jour
- **Résultats moyens** par requête
- **Catégories populaires**
- **Insights par localisation**
- **Heures de pointe** de recherche

### API Analytics

```typescript
// GET /api/search/analytics
interface AnalyticsResponse {
  totalSearches: number
  averageResults: number
  popularQueries: PopularQuery[]
  searchPerformance: SearchPerformance
  userBehavior: UserBehavior
  searchTrends: SearchTrend[]
  topCategories: TopCategory[]
  locationInsights: LocationInsight[]
}

// POST /api/search/analytics/track
interface TrackSearchRequest {
  query: string
  resultCount: number
  filters: SearchFilters
  timestamp: string
  responseTime?: number
  clickedResults?: string[]
}
```

## 🎯 Optimisations et Performance

### 1. Optimisations Frontend

- **Debouncing** des suggestions (300ms)
- **Recherche instantanée** avec délai (500ms)
- **Lazy loading** des résultats
- **Virtualisation** pour de grandes listes
- **Memoization** des composants coûteux

### 2. Optimisations Backend

- **Cache Redis** pour les suggestions
- **Indexation** des champs de recherche
- **Requêtes optimisées** avec Prisma
- **Pagination** intelligente
- **Compression** des réponses

### 3. Optimisations Base de Données

```sql
-- Index pour la recherche textuelle
CREATE INDEX idx_professionals_search ON professionals 
USING gin(to_tsvector('french', name || ' ' || description));

-- Index pour les filtres fréquents
CREATE INDEX idx_professionals_location ON professionals(location);
CREATE INDEX idx_professionals_rating ON professionals(rating);
CREATE INDEX idx_professionals_verified ON professionals(verified);

-- Index composite pour les requêtes complexes
CREATE INDEX idx_professionals_composite ON professionals 
(location, rating, verified, last_active);
```

## 🔒 Sécurité et Validation

### 1. Validation des Entrées

```typescript
// Validation de la requête
const validation = validateField('searchQuery', query)
if (!validation.isValid) {
  setError(validation.errors[0])
  return
}

// Validation des filtres
const sanitizedFilters = sanitizeFilters(filters)
```

### 2. Protection contre les Attaques

- **Injection SQL** : Requêtes paramétrées avec Prisma
- **XSS** : Échappement des entrées utilisateur
- **CSRF** : Tokens de sécurité
- **Rate Limiting** : Limitation des requêtes par utilisateur

### 3. Authentification et Autorisation

```typescript
// Vérification de session
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}

// Vérification des permissions
if (!hasSearchPermission(session.user.id)) {
  return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
}
```

## 🧪 Tests et Qualité

### 1. Tests Unitaires

```typescript
describe('SearchService', () => {
  it('should score results correctly', () => {
    const service = new SearchService()
    const result = mockSearchResult()
    const score = service['calculateTextRelevance'](result, 'tatouage')
    expect(score).toBeGreaterThan(0)
  })

  it('should cache results appropriately', async () => {
    const service = new SearchService()
    const results = await service.search('test', {})
    const cached = service['cache'].get('test:{}')
    expect(cached).toBeDefined()
  })
})
```

### 2. Tests d'Intégration

```typescript
describe('Search API', () => {
  it('should return suggestions for valid query', async () => {
    const response = await request(app)
      .get('/api/search/suggestions?q=tatouage')
      .expect(200)
    
    expect(response.body.suggestions).toBeInstanceOf(Array)
  })
})
```

### 3. Tests de Performance

```typescript
describe('Search Performance', () => {
  it('should respond within 200ms for simple queries', async () => {
    const start = Date.now()
    await searchService.search('test', {})
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(200)
  })
})
```

## 🚀 Déploiement et Production

### 1. Configuration Production

```typescript
// lib/config/search-config.ts
export const searchConfig = {
  production: {
    cacheEnabled: true,
    cacheTTL: 10 * 60 * 1000, // 10 minutes
    maxResults: 200,
    enableAnalytics: true,
    logLevel: 'warn'
  },
  development: {
    cacheEnabled: false,
    cacheTTL: 1 * 60 * 1000, // 1 minute
    maxResults: 50,
    enableAnalytics: false,
    logLevel: 'debug'
  }
}
```

### 2. Monitoring et Alertes

- **Métriques de performance** en temps réel
- **Alertes** sur les temps de réponse élevés
- **Logs structurés** pour le debugging
- **Tracing** des requêtes lentes

### 3. Scaling

- **Load balancing** pour les API
- **Cache distribué** avec Redis Cluster
- **Base de données** avec réplication
- **CDN** pour les assets statiques

## 📚 Utilisation et Exemples

### 1. Recherche Simple

```typescript
const handleSearch = async (query: string, filters: SearchFilters) => {
  try {
    const results = await searchService.search(query, filters)
    setResults(results)
  } catch (error) {
    toast.error('Erreur lors de la recherche')
  }
}
```

### 2. Filtres Avancés

```typescript
const updateFilters = (newFilters: Partial<SearchFilters>) => {
  const updatedFilters = { ...filters, ...newFilters }
  setFilters(updatedFilters)
  
  if (searchMode === 'instant' && searchQuery.trim()) {
    performSearch(searchQuery, updatedFilters)
  }
}
```

### 3. Suggestions Personnalisées

```typescript
const generateSuggestions = async (query: string) => {
  if (query.length < 2) return
  
  const suggestions = await searchService.generateSuggestions(query, userId)
  setSuggestions(suggestions)
}
```

### 4. Analytics Avancés

```typescript
const loadAnalytics = async () => {
  const analytics = await searchService.getSearchAnalytics(userId, 'month')
  setAnalytics(analytics)
}
```

## 🔮 Évolutions Futures

### 1. Fonctionnalités Planifiées

- **Recherche sémantique** avec IA
- **Recommandations** personnalisées
- **Recherche vocale** intégrée
- **Filtres géolocalisés** avancés
- **Analytics prédictifs**

### 2. Améliorations Techniques

- **Elasticsearch** pour la recherche avancée
- **Machine Learning** pour le scoring
- **GraphQL** pour les requêtes complexes
- **WebSockets** pour les suggestions en temps réel
- **PWA** pour l'utilisation hors ligne

### 3. Intégrations

- **Google Analytics** 4
- **Hotjar** pour l'analyse comportementale
- **Segment** pour la collecte de données
- **Mixpanel** pour les analytics avancés

## 📞 Support et Maintenance

### 1. Documentation API

- **Swagger/OpenAPI** pour la documentation interactive
- **Exemples** de code pour chaque endpoint
- **Schémas** de validation
- **Codes d'erreur** documentés

### 2. Monitoring

- **Health checks** automatiques
- **Métriques** de performance
- **Alertes** proactives
- **Logs** centralisés

### 3. Maintenance

- **Mises à jour** régulières
- **Optimisations** continues
- **Sauvegardes** automatiques
- **Récupération** de sinistre

---

## 📝 Notes de Version

### v1.0.0 (Actuel)
- ✅ Système de recherche de base
- ✅ Filtres avancés
- ✅ Suggestions intelligentes
- ✅ Analytics de base
- ✅ Cache intelligent

### v1.1.0 (Planifié)
- 🔄 Recherche sémantique
- 🔄 Recommandations IA
- 🔄 Analytics prédictifs

### v1.2.0 (Planifié)
- 🔄 Recherche vocale
- 🔄 Filtres géolocalisés
- 🔄 Intégrations tierces

---

*Cette documentation est maintenue par l'équipe de développement. Pour toute question ou suggestion, veuillez créer une issue sur le repository GitHub.*
