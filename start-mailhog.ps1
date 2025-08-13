# Script pour démarrer MailHog et les bases de données
Write-Host "📧 Démarrage de MailHog et des bases de données..." -ForegroundColor Green

# Démarrer les services
docker-compose -f docker-compose-dev.yml up -d

# Attendre que les services soient prêts
Start-Sleep -Seconds 10

# Afficher les informations
Write-Host ""
Write-Host "🎉 Services démarrés avec succès!" -ForegroundColor Green
Write-Host "📊 PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor Cyan
Write-Host "📧 MailHog SMTP: localhost:1025" -ForegroundColor Cyan
Write-Host "🌐 MailHog Web UI: http://localhost:8025" -ForegroundColor Cyan
Write-Host "📊 Grafana: http://localhost:3001 (admin/admin)" -ForegroundColor Cyan
Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Pour arrêter: docker-compose -f docker-compose-dev.yml down" -ForegroundColor Yellow
Write-Host "📋 Pour voir les logs: docker-compose -f docker-compose-dev.yml logs -f" -ForegroundColor Yellow
