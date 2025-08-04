const { Octokit } = require('@octokit/rest');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'antoine13330';
const REPO_NAME = 'INKSPOT-5z';

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Définition des tickets par branche
const issues = [
  {
    title: '🔐 Feature: Authentication System Enhancement',
    body: `## 🎯 Objectif
Compléter le système d'authentification avec toutes les fonctionnalités avancées.

## ✅ Fonctionnalités implémentées
- [x] Email verification system with token-based verification
- [x] Password recovery flow with secure reset tokens
- [x] Rate limiting for login attempts
- [x] Enhanced session management with 30-day sessions
- [x] Google OAuth integration with automatic verification
- [x] User verification status tracking
- [x] Last login tracking

## 📁 Fichiers modifiés/créés
- [x] \`app/api/auth/verify-email/route.ts\` - Email verification API
- [x] \`app/api/auth/reset-password/route.ts\` - Password reset API
- [x] \`app/auth/verify-email/page.tsx\` - Email verification page
- [x] \`app/auth/reset-password/page.tsx\` - Password reset page
- [x] \`lib/email.ts\` - Enhanced email functionality
- [x] \`lib/rate-limit.ts\` - Rate limiting utility
- [x] \`lib/auth.ts\` - Enhanced auth configuration
- [x] \`prisma/schema.prisma\` - Added VerificationToken model

## 🧪 Tests
- [x] Email verification flow tests
- [x] Password reset flow tests
- [x] Rate limiting tests
- [x] OAuth integration tests

## 📋 Checklist de validation
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Ready for merge to dev

## 🏷️ Labels
- feature
- authentication
- security
- high-priority

## 🔗 Branche associée
\`feature/authentication-enhancement\`

---
*Créé automatiquement pour organiser les modifications du système d'authentification*`,
    labels: ['feature', 'authentication', 'security', 'high-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '💬 Feature: Real-time Messaging System',
    body: `## 🎯 Objectif
Implémenter un système de messagerie en temps réel pour les conversations entre utilisateurs.

## 📋 Fonctionnalités à implémenter
- [ ] WebSocket implementation
- [ ] Real-time message delivery
- [ ] Message read status
- [ ] Typing indicators
- [ ] File/image sharing in messages
- [ ] Message search functionality
- [ ] Message notifications
- [ ] Conversation management

## 📁 Fichiers à créer/modifier
- [ ] \`lib/websocket.ts\` - WebSocket server setup
- [ ] \`app/api/messages/realtime/route.ts\` - Real-time API
- [ ] \`components/chat/MessageInput.tsx\` - Message input component
- [ ] \`components/chat/MessageList.tsx\` - Message display component
- [ ] \`components/chat/TypingIndicator.tsx\` - Typing indicator
- [ ] \`hooks/useWebSocket.ts\` - WebSocket hook
- [ ] \`components/chat/FileUpload.tsx\` - File sharing component

## 🧪 Tests à implémenter
- [ ] WebSocket connection tests
- [ ] Message delivery tests
- [ ] Real-time functionality tests
- [ ] File upload tests

## 📋 Checklist de validation
- [ ] WebSocket server implemented
- [ ] Real-time messaging working
- [ ] File sharing implemented
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security implemented

## 🏷️ Labels
- feature
- real-time
- messaging
- medium-priority

## 🔗 Branche associée
\`feature/real-time-messaging\`

---
*Créé automatiquement pour organiser le développement du système de messagerie*`,
    labels: ['feature', 'real-time', 'messaging', 'medium-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '💳 Feature: Payment System Enhancement',
    body: `## 🎯 Objectif
Améliorer le système de paiement avec des fonctionnalités avancées et une meilleure gestion des transactions.

## 📋 Fonctionnalités à implémenter
- [ ] Stripe webhooks implementation
- [ ] Refund processing
- [ ] Automatic payouts to PROs
- [ ] Invoice generation
- [ ] Payment dispute handling
- [ ] Financial reporting
- [ ] Subscription management
- [ ] Payment analytics

## 📁 Fichiers à créer/modifier
- [ ] \`app/api/stripe/webhooks/route.ts\` - Complete webhook handlers
- [ ] \`app/api/payments/refund/route.ts\` - Refund processing
- [ ] \`app/api/payments/payout/route.ts\` - Automatic payouts
- [ ] \`lib/invoice-generator.ts\` - Invoice generation
- [ ] \`app/pro/dashboard/financial/page.tsx\` - Financial dashboard
- [ ] \`components/payments/PaymentHistory.tsx\` - Payment history
- [ ] \`components/payments/InvoiceViewer.tsx\` - Invoice display

## 🧪 Tests à implémenter
- [ ] Webhook processing tests
- [ ] Refund flow tests
- [ ] Payout system tests
- [ ] Invoice generation tests

## 📋 Checklist de validation
- [ ] Webhooks properly configured
- [ ] Refund system working
- [ ] Payout system implemented
- [ ] Invoice generation working
- [ ] All tests passing
- [ ] Security audit completed

## 🏷️ Labels
- feature
- payment
- stripe
- medium-priority

## 🔗 Branche associée
\`feature/payment-system-enhancement\`

---
*Créé automatiquement pour organiser l'amélioration du système de paiement*`,
    labels: ['feature', 'payment', 'stripe', 'medium-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '👥 Feature: User Management Enhancement',
    body: `## 🎯 Objectif
Améliorer la gestion des utilisateurs avec des fonctionnalités avancées pour les comptes PRO.

## 📋 Fonctionnalités à implémenter
- [ ] PRO account verification system
- [ ] Portfolio management
- [ ] User rating/review system
- [ ] Profile customization for PROs
- [ ] User blocking/reporting
- [ ] Profile analytics
- [ ] User search and filtering
- [ ] User activity tracking

## 📁 Fichiers à créer/modifier
- [ ] \`app/api/users/verify-pro/route.ts\` - PRO verification
- [ ] \`app/api/users/portfolio/route.ts\` - Portfolio management
- [ ] \`app/api/users/reviews/route.ts\` - Review system
- [ ] \`app/profile/portfolio/page.tsx\` - Portfolio page
- [ ] \`app/profile/customize/page.tsx\` - Profile customization
- [ ] \`components/profile/PortfolioEditor.tsx\` - Portfolio editor
- [ ] \`components/profile/ReviewSystem.tsx\` - Review component

## 🧪 Tests à implémenter
- [ ] PRO verification tests
- [ ] Portfolio management tests
- [ ] Review system tests
- [ ] User blocking tests

## 📋 Checklist de validation
- [ ] PRO verification working
- [ ] Portfolio system implemented
- [ ] Review system working
- [ ] User blocking implemented
- [ ] All tests passing
- [ ] UI/UX polished

## 🏷️ Labels
- feature
- user-management
- profile
- medium-priority

## 🔗 Branche associée
\`feature/user-management-enhancement\`

---
*Créé automatiquement pour organiser l'amélioration de la gestion des utilisateurs*`,
    labels: ['feature', 'user-management', 'profile', 'medium-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '🔍 Feature: Advanced Search & Recommendations',
    body: `## 🎯 Objectif
Implémenter un système de recherche avancée et de recommandations intelligentes.

## 📋 Fonctionnalités à implémenter
- [ ] AI-powered recommendations
- [ ] Advanced search filters
- [ ] Geographic search
- [ ] Search analytics
- [ ] Auto-complete suggestions
- [ ] Search history management
- [ ] Smart matching algorithm
- [ ] Search result ranking

## 📁 Fichiers à créer/modifier
- [ ] \`lib/recommendations-ai.ts\` - AI recommendations
- [ ] \`app/api/search/advanced/route.ts\` - Advanced search API
- [ ] \`app/api/search/geographic/route.ts\` - Geographic search
- [ ] \`components/search/AdvancedFilters.tsx\` - Advanced filters
- [ ] \`components/search/AutoComplete.tsx\` - Auto-complete
- [ ] \`hooks/useRecommendations.ts\` - Recommendations hook
- [ ] \`components/search/SearchHistory.tsx\` - Search history

## 🧪 Tests à implémenter
- [ ] Search algorithm tests
- [ ] Recommendation tests
- [ ] Geographic search tests
- [ ] Auto-complete tests

## 📋 Checklist de validation
- [ ] AI recommendations working
- [ ] Advanced search implemented
- [ ] Geographic search working
- [ ] Auto-complete functional
- [ ] All tests passing
- [ ] Performance optimized

## 🏷️ Labels
- feature
- search
- ai
- recommendations
- medium-priority

## 🔗 Branche associée
\`feature/search-recommendations\`

---
*Créé automatiquement pour organiser le développement du système de recherche*`,
    labels: ['feature', 'search', 'ai', 'recommendations', 'medium-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '⚙️ Feature: Admin Dashboard',
    body: `## 🎯 Objectif
Créer un tableau de bord administrateur complet pour la gestion de la plateforme.

## 📋 Fonctionnalités à implémenter
- [ ] User management interface
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] System configuration
- [ ] Log monitoring
- [ ] Backup management
- [ ] User activity monitoring
- [ ] System health monitoring

## 📁 Fichiers à créer/modifier
- [ ] \`app/admin/users/page.tsx\` - User management
- [ ] \`app/admin/moderation/page.tsx\` - Content moderation
- [ ] \`app/admin/analytics/page.tsx\` - Analytics dashboard
- [ ] \`app/admin/settings/page.tsx\` - System settings
- [ ] \`components/admin/UserManagement.tsx\` - User management component
- [ ] \`components/admin/ContentModeration.tsx\` - Moderation component
- [ ] \`components/admin/AnalyticsChart.tsx\` - Analytics charts

## 🧪 Tests à implémenter
- [ ] Admin access tests
- [ ] User management tests
- [ ] Moderation tools tests
- [ ] Analytics tests

## 📋 Checklist de validation
- [ ] Admin interface working
- [ ] User management functional
- [ ] Moderation tools implemented
- [ ] Analytics dashboard working
- [ ] All tests passing
- [ ] Security implemented

## 🏷️ Labels
- feature
- admin
- dashboard
- low-priority

## 🔗 Branche associée
\`feature/admin-dashboard\`

---
*Créé automatiquement pour organiser le développement du tableau de bord admin*`,
    labels: ['feature', 'admin', 'dashboard', 'low-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '🚀 Feature: Performance Optimization',
    body: `## 🎯 Objectif
Optimiser les performances de l'application pour une meilleure expérience utilisateur.

## 📋 Fonctionnalités à implémenter
- [ ] Redis caching implementation
- [ ] Image optimization
- [ ] Bundle optimization
- [ ] CDN setup
- [ ] Database query optimization
- [ ] Service worker implementation
- [ ] Lazy loading
- [ ] Code splitting

## 📁 Fichiers à créer/modifier
- [ ] \`lib/cache.ts\` - Redis integration
- [ ] \`lib/image-optimization.ts\` - Image optimization
- [ ] \`next.config.mjs\` - Performance config
- [ ] \`public/sw.js\` - Service worker
- [ ] \`lib/database-optimization.ts\` - Database optimization
- [ ] \`components/ui/LazyImage.tsx\` - Lazy loading images

## 🧪 Tests à implémenter
- [ ] Performance tests
- [ ] Caching tests
- [ ] Image optimization tests
- [ ] Bundle size tests

## 📋 Checklist de validation
- [ ] Redis caching working
- [ ] Images optimized
- [ ] Bundle size reduced
- [ ] CDN configured
- [ ] Database optimized
- [ ] Service worker working

## 🏷️ Labels
- feature
- performance
- optimization
- low-priority

## 🔗 Branche associée
\`feature/performance-optimization\`

---
*Créé automatiquement pour organiser l'optimisation des performances*`,
    labels: ['feature', 'performance', 'optimization', 'low-priority'],
    assignees: ['antoine13330']
  },
  {
    title: '🐛 Fix: Test Configuration Issues',
    body: `## 🎯 Objectif
Corriger les problèmes de configuration des tests pour assurer une couverture complète.

## ✅ Problèmes résolus
- [x] Fixed \`ReferenceError: Request is not defined\` in API tests
- [x] Updated Next.js API route mocking in \`jest.config.js\`
- [x] Fixed API route test setup in \`__tests__/api/*.test.ts\`
- [x] Added proper Request/Response mocking in \`jest.setup.js\`
- [x] Created helper functions in \`__tests__/helpers/api-test-helper.ts\`

## 📁 Fichiers modifiés
- [x] \`jest.config.js\` - Updated Next.js API route mocking
- [x] \`__tests__/api/*.test.ts\` - Fixed API route test setup
- [x] \`jest.setup.js\` - Added proper Request/Response mocking
- [x] \`__tests__/helpers/api-test-helper.ts\` - Created helper functions

## 🧪 Résultats des tests
- [x] Post creation tests: 10/10 passing (was 7 failing, 3 passing)
- [x] All API route tests now properly configured for Next.js 14
- [x] Notifications tests: 4/4 passing
- [x] VAPID configuration fixed

## 📋 Checklist de validation
- [x] All tests passing
- [x] Configuration properly set up
- [x] Helper functions working
- [x] Ready for merge to dev

## 🏷️ Labels
- fix
- tests
- configuration
- high-priority

## 🔗 Branche associée
\`fix/test-configuration\`

---
*Créé automatiquement pour organiser les corrections de configuration des tests*`,
    labels: ['fix', 'tests', 'configuration', 'high-priority'],
    assignees: ['antoine13330']
  }
];

// Fonction pour créer un ticket
async function createIssue(issue) {
  try {
    const response = await octokit.rest.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      assignees: issue.assignees,
    });
    
    console.log(`✅ Ticket créé: ${issue.title} (#${response.data.number})`);
    return response.data.number;
  } catch (error) {
    console.error(`❌ Erreur lors de la création du ticket: ${issue.title}`, error.message);
    return null;
  }
}

// Fonction principale
async function createAllIssues() {
  console.log('🚀 Création des tickets GitHub pour toutes les branches...\n');
  
  const createdIssues = [];
  
  for (const issue of issues) {
    const issueNumber = await createIssue(issue);
    if (issueNumber) {
      createdIssues.push({
        number: issueNumber,
        title: issue.title,
        branch: issue.body.match(/Branche associée\s*\n`([^`]+)`/)?.[1] || 'N/A'
      });
    }
    // Pause entre les créations pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Résumé des tickets créés:');
  createdIssues.forEach(issue => {
    console.log(`  #${issue.number} - ${issue.title} (${issue.branch})`);
  });
  
  console.log(`\n✅ ${createdIssues.length}/${issues.length} tickets créés avec succès!`);
}

// Vérification du token
if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

// Exécution
createAllIssues().catch(console.error); 