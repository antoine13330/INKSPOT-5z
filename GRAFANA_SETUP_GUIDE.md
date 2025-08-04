# 🚀 Guide de Configuration Grafana pour INKSPOT-5z

## ✅ **Environnement de Monitoring Démarré !**

Votre environnement de monitoring est maintenant opérationnel avec tous les services nécessaires.

## 🌐 **Accès aux Services**

### 📊 **Grafana Dashboard**
- **URL:** http://localhost:3001
- **Username:** `admin`
- **Password:** `admin123`

### 📈 **Prometheus**
- **URL:** http://localhost:9090
- **Fonctionnalités:** Visualisation des métriques brutes, requêtes PromQL

### 🔍 **Node Exporter**
- **URL:** http://localhost:9100/metrics
- **Fonctionnalités:** Métriques système (CPU, mémoire, disque, réseau)

### 🗄️ **PostgreSQL Exporter**
- **URL:** http://localhost:9187/metrics
- **Fonctionnalités:** Métriques de base de données

### 🗄️ **Redis**
- **URL:** localhost:6379
- **Fonctionnalités:** Cache et session storage

## 📋 **Dashboards Disponibles**

Une fois connecté à Grafana, vous trouverez automatiquement ces dashboards :

### 1. **INKSPOT Overview** 📊
- Vue d'ensemble générale de la plateforme
- Métriques utilisateurs, posts, engagements
- Graphiques de tendances

### 2. **INKSPOT Business Metrics** 💼
- Métriques business (revenus, paiements, réservations)
- KPIs commerciaux
- Analyses de performance

### 3. **INKSPOT Technical Metrics** ⚙️
- Métriques techniques (performance, erreurs, latence)
- Monitoring système
- Alertes et notifications

### 4. **INKSPOT Real-time** ⚡
- Données en temps réel
- Activité utilisateur live
- Métriques de session

## 🔧 **Configuration des Sources de Données**

Les sources de données suivantes sont automatiquement configurées :

### 1. **Prometheus** (Source principale)
- **URL:** http://prometheus:9090
- **Type:** Prometheus
- **Statut:** ✅ Configuré automatiquement

### 2. **PostgreSQL** (Base de données)
- **URL:** postgres:5432
- **Type:** PostgreSQL
- **Statut:** ✅ Configuré automatiquement

### 3. **INKSPOT-API** (API personnalisée)
- **URL:** http://host.docker.internal:3000/api/grafana
- **Type:** JSON API
- **Statut:** ✅ Configuré automatiquement

## 📊 **Métriques Disponibles**

### 👥 **Métriques Utilisateurs**
- `inkspot_users_total` - Nombre total d'utilisateurs
- `inkspot_users_active` - Utilisateurs actifs
- `inkspot_users_pro` - Utilisateurs PRO
- `inkspot_users_verified` - Utilisateurs vérifiés
- `inkspot_users_new_today` - Nouveaux utilisateurs aujourd'hui

### 📝 **Métriques Posts**
- `inkspot_posts_total` - Nombre total de posts
- `inkspot_posts_published` - Posts publiés
- `inkspot_posts_today` - Posts créés aujourd'hui
- `inkspot_likes_total` - Total des likes
- `inkspot_comments_total` - Total des commentaires

### 💬 **Métriques Messagerie**
- `inkspot_conversations_total` - Total des conversations
- `inkspot_messages_total` - Total des messages
- `inkspot_messages_today` - Messages envoyés aujourd'hui

### 📅 **Métriques Réservations**
- `inkspot_bookings_total` - Total des réservations
- `inkspot_bookings_pending` - Réservations en attente
- `inkspot_bookings_confirmed` - Réservations confirmées
- `inkspot_bookings_completed` - Réservations terminées

### 💳 **Métriques Paiements**
- `inkspot_payments_total` - Total des paiements
- `inkspot_payments_successful` - Paiements réussis
- `inkspot_payments_failed` - Paiements échoués
- `inkspot_revenue_total` - Revenus totaux
- `inkspot_revenue_today` - Revenus aujourd'hui

## 🚀 **Commandes Utiles**

```bash
# Vérifier le statut des services
npm run monitoring:status

# Voir les logs des services
npm run monitoring:logs

# Redémarrer les services
npm run monitoring:restart

# Arrêter les services
npm run monitoring:stop

# Tester les métriques
npm run metrics:test

# Vérifier la santé de l'application
npm run health:check
```

## 🔍 **Dépannage**

### Problème: Grafana ne se charge pas
```bash
# Vérifier que le conteneur est en cours d'exécution
docker ps | grep grafana

# Voir les logs Grafana
docker logs inkspot_grafana
```

### Problème: Pas de métriques dans Prometheus
```bash
# Vérifier la configuration Prometheus
curl http://localhost:9090/api/v1/targets

# Voir les logs Prometheus
docker logs inkspot_prometheus
```

### Problème: Application Next.js ne répond pas
```bash
# Vérifier que l'application est démarrée
curl http://localhost:3000/api/health

# Redémarrer l'application
npm run dev
```

## 📱 **Accès Mobile**

Tous les dashboards sont responsives et accessibles sur mobile :
- **Grafana:** http://localhost:3001
- **Prometheus:** http://localhost:9090

## 🎯 **Prochaines Étapes**

1. **Connectez-vous à Grafana** avec les identifiants fournis
2. **Explorez les dashboards** pré-configurés
3. **Personnalisez les graphiques** selon vos besoins
4. **Configurez des alertes** pour les métriques importantes
5. **Ajoutez de nouveaux dashboards** si nécessaire

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez que Docker est démarré
2. Vérifiez que tous les services sont en cours d'exécution
3. Consultez les logs des services
4. Redémarrez les services si nécessaire

---

**🎉 Votre environnement de monitoring INKSPOT-5z est prêt !**

Connectez-vous à http://localhost:3001 pour commencer à visualiser vos métriques.