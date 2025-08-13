# Script pour démarrer le développement avec tunnel webhook
Write-Host "🚀 Démarrage du développement INKSPOT avec tunnel webhook..." -ForegroundColor Green

# Vérifier si LocalTunnel est installé
try {
    $ltVersion = lt --version 2>$null
    Write-Host "✅ LocalTunnel installé" -ForegroundColor Green
} catch {
    Write-Host "📦 Installation de LocalTunnel..." -ForegroundColor Yellow
    npm install -g localtunnel
}

# Démarrer les bases de données
Write-Host "📊 Démarrage des bases de données..." -ForegroundColor Yellow
.\start-db.ps1

# Attendre que les bases soient prêtes
Start-Sleep -Seconds 5

# Démarrer l'application Next.js
Write-Host "🌐 Démarrage de l'application Next.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Attendre que l'app démarre
Start-Sleep -Seconds 10

# Démarrer le tunnel LocalTunnel
Write-Host "🌍 Démarrage du tunnel LocalTunnel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "lt --port 3000 --subdomain inkspot-webhook"

# Afficher les informations
Write-Host ""
Write-Host "🎉 INKSPOT est prêt !" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌍 Tunnel public: https://inkspot-webhook.loca.lt" -ForegroundColor Cyan
Write-Host "🔗 Webhook Stripe: https://inkspot-webhook.loca.lt/api/stripe/webhook" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 URLs à configurer dans Stripe Dashboard:" -ForegroundColor Yellow
Write-Host "   - Webhook: https://inkspot-webhook.loca.lt/api/stripe/webhook" -ForegroundColor White
Write-Host "   - Redirect: https://inkspot-webhook.loca.lt/auth/callback" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Pour arrêter: Ctrl+C dans chaque terminal" -ForegroundColor Yellow
