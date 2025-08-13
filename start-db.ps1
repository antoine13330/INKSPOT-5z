# Script pour démarrer la base de données PostgreSQL et Redis avec les nouveaux mots de passe
Write-Host "🚀 Démarrage des services de base de données..." -ForegroundColor Green

# Variables d'environnement
$POSTGRES_PASSWORD = "Z4qtMeWAXz7Bi5Sp"
$REDIS_PASSWORD = "v4icOhDasY3eCVrQ"

# Démarrer PostgreSQL avec Docker
Write-Host "📊 Démarrage de PostgreSQL..." -ForegroundColor Yellow
docker run -d --name inkspot-postgres `
    -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD `
    -e POSTGRES_DB=inkspot `
    -p 5432:5432 `
    postgres:15

# Démarrer Redis avec Docker
Write-Host "🔴 Démarrage de Redis..." -ForegroundColor Yellow
docker run -d --name inkspot-redis `
    -e REDIS_PASSWORD=$REDIS_PASSWORD `
    -p 6379:6379 `
    redis:7-alpine

# Attendre que les services soient prêts
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Vérifier le statut
Write-Host "✅ Services démarrés avec succès!" -ForegroundColor Green
Write-Host "📊 PostgreSQL: localhost:5432 (mot de passe: $POSTGRES_PASSWORD)" -ForegroundColor Cyan
Write-Host "🔴 Redis: localhost:6379 (mot de passe: $REDIS_PASSWORD)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Pour arrêter: docker stop inkspot-postgres inkspot-redis" -ForegroundColor Yellow
Write-Host "🗑️  Pour supprimer: docker rm inkspot-postgres inkspot-redis" -ForegroundColor Yellow
