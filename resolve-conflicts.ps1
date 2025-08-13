Write-Host "RESOLUTION DES CONFLITS DE MERGE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Supprimer les fichiers supprimes par la branche cursor
Write-Host "Suppression des fichiers supprimes..." -ForegroundColor Yellow
if (Test-Path "app/api/messages/route.ts") {
    Remove-Item "app/api/messages/route.ts" -Force
    Write-Host "  Supprime: app/api/messages/route.ts" -ForegroundColor Green
}
if (Test-Path "app/api/payments/route.ts") {
    Remove-Item "app/api/payments/route.ts" -Force
    Write-Host "  Supprime: app/api/payments/route.ts" -ForegroundColor Green
}

# Accepter la version HEAD pour les autres conflits
Write-Host "`nResolution des conflits..." -ForegroundColor Yellow
git add app/layout.tsx
git add app/page.tsx
git add package.json
git add package-lock.json

Write-Host "  Conflits resolus!" -ForegroundColor Green

# Commit de la resolution
Write-Host "`nCommit de la resolution..." -ForegroundColor Yellow
git commit -m "merge: resolution des conflits avec nettoyer-les-composants-obsol-tes"

Write-Host "  Merge termine avec succes!" -ForegroundColor Green
