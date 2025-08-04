# INKSPOT Design System Guide

## 🎨 **Identité Visuelle - Basée sur les Maquettes DA**

Ce guide documente le système de design cohérent d'INKSPOT, inspiré des maquettes de l'identité visuelle DA.

## 🌙 **Thème Sombre Principal**

INKSPOT utilise un thème sombre cohérent avec les maquettes :

### **Palette de Couleurs**

```css
/* Couleurs de Base */
--color-background: #0a0a0a;        /* Fond principal très sombre */
--color-surface: #1a1a1a;           /* Surfaces (cartes, navigation) */
--color-surface-elevated: #2a2a2a;  /* Surfaces surélevées */
--color-border: #333333;            /* Bordures */
--color-border-light: #404040;      /* Bordures légères */

/* Couleurs de Texte */
--color-text-primary: #ffffff;      /* Texte principal */
--color-text-secondary: #b3b3b3;   /* Texte secondaire */
--color-text-tertiary: #808080;     /* Texte tertiaire */
--color-text-disabled: #666666;     /* Texte désactivé */

/* Couleurs de Marque */
--color-primary: #3b82f6;           /* Bleu principal */
--color-primary-light: #60a5fa;     /* Bleu clair */
--color-primary-dark: #2563eb;      /* Bleu sombre */
--color-accent: #10b981;            /* Accent vert */
```

## 📱 **Composants Principaux**

### **1. Navigation du Bas**
- **Position** : Fixe en bas de l'écran
- **Fond** : `var(--color-surface)` avec blur
- **Bordures** : `var(--color-border)` en haut
- **Icônes** : 24px avec espacement cohérent
- **États** : Hover avec `var(--color-surface-elevated)`

### **2. Liste de Conversations**
- **Structure** : Avatar + Contenu + Métadonnées
- **Avatars** : 48px circulaires avec fallback d'initiales
- **Prévisualisation** : Texte tronqué avec ellipsis
- **Badges** : Compteurs de messages non lus
- **Timestamps** : Format relatif (maintenant, hier, date)

### **3. Interface de Chat**
- **Header** : Avatar + Nom + Statut + Actions
- **Messages** : Bulles avec coins arrondis asymétriques
- **Messages utilisateur** : Bleu (`var(--color-chat-user)`)
- **Messages autres** : Gris (`var(--color-chat-other)`)
- **Input** : Champ arrondi avec boutons d'action

## 🎯 **Principes de Design**

### **1. Cohérence Visuelle**
- **Espacement** : Système de spacing cohérent (xs, sm, md, lg, xl)
- **Typographie** : Police système avec hiérarchie claire
- **Bordures** : Rayons cohérents (sm, md, lg, xl, full)
- **Ombres** : Système d'ombres progressif

### **2. Hiérarchie de l'Information**
- **Texte principal** : Blanc pour les titres et contenus importants
- **Texte secondaire** : Gris clair pour les descriptions
- **Texte tertiaire** : Gris moyen pour les métadonnées
- **Accents** : Bleu pour les actions et éléments interactifs

### **3. États Interactifs**
- **Hover** : Changement de couleur de fond et de bordure
- **Active** : Couleur primaire pour l'élément sélectionné
- **Disabled** : Opacité réduite et couleur grisée
- **Focus** : Bordure bleue avec glow subtil

## 📐 **Système de Spacing**

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

## 🔄 **Transitions et Animations**

```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

### **Animations Principales**
- **Fade In** : Apparition progressive des éléments
- **Slide In** : Glissement depuis la gauche
- **Typing Indicator** : Points animés pour "écrit..."

## 📱 **Responsive Design**

### **Mobile First**
- **Navigation** : Toujours visible en bas
- **Contenu** : Padding adaptatif selon la taille d'écran
- **Messages** : Largeur maximale de 85% sur mobile
- **Cartes** : Padding réduit sur petits écrans

### **Breakpoints**
- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px

## 🎨 **Composants Réutilisables**

### **Classes Utilitaires**
```css
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.bg-surface { background-color: var(--color-surface); }
.border-border { border-color: var(--color-border); }
.rounded-lg { border-radius: var(--radius-lg); }
.shadow-md { box-shadow: var(--shadow-md); }
```

### **Composants CSS**
```css
.card { /* Cartes avec fond et bordures */ }
.btn { /* Boutons avec états */ }
.conversation-item { /* Éléments de liste */ }
.message-bubble { /* Bulles de chat */ }
.nav-item { /* Éléments de navigation */ }
```

## 🔧 **Implémentation**

### **1. Import du Design System**
```css
@import '../styles/design-system.css';
```

### **2. Utilisation des Classes**
```jsx
<div className="app-container">
  <div className="content-area">
    <div className="card">
      <h1 className="text-primary">Titre</h1>
      <p className="text-secondary">Description</p>
    </div>
  </div>
</div>
```

### **3. Composants React**
```jsx
<ConversationList 
  conversations={conversations}
  showSearch={true}
  title="Messages"
/>

<ChatInterface 
  participant={participant}
  messages={messages}
  onSendMessage={handleSend}
/>
```

## 📋 **Checklist de Cohérence**

### **Avant de Créer un Nouveau Composant**
- [ ] Utilise-t-il les couleurs du design system ?
- [ ] Respecte-t-il le système de spacing ?
- [ ] A-t-il des états hover/focus appropriés ?
- [ ] Est-il responsive ?
- [ ] Utilise-t-il les bonnes classes utilitaires ?

### **Avant de Modifier un Composant Existant**
- [ ] La modification respecte-t-elle l'identité visuelle ?
- [ ] Les changements sont-ils cohérents avec les autres composants ?
- [ ] Les transitions sont-elles fluides ?
- [ ] L'accessibilité est-elle préservée ?

## 🎯 **Objectifs de l'Identité Visuelle**

1. **Cohérence** : Tous les écrans suivent le même langage visuel
2. **Lisibilité** : Hiérarchie claire de l'information
3. **Accessibilité** : Contrastes suffisants et états clairs
4. **Performance** : Animations fluides et transitions rapides
5. **Scalabilité** : Système extensible pour de nouveaux composants

## 📚 **Ressources**

- **Fichier CSS** : `styles/design-system.css`
- **Composants** : `components/conversation-list.tsx`, `components/chat-interface.tsx`
- **Pages** : `app/conversations/page.tsx`
- **Navigation** : `components/bottom-navigation.tsx`

---

*Ce guide doit être mis à jour à chaque modification du système de design pour maintenir la cohérence de l'identité visuelle.* 