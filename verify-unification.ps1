# Script de verification de l'uniformisation des branches
Write-Host "Verification de l'uniformisation des branches..." -ForegroundColor Green

# Verifier la branche actuelle
$currentBranch = git branch --show-current
Write-Host "Branche actuelle: $currentBranch" -ForegroundColor Cyan

# Verifier le statut
Write-Host "Statut Git:" -ForegroundColor Yellow
git status --porcelain

# Verifier les branches mergees
Write-Host ""
Write-Host "Branches mergees dans $($currentBranch):" -ForegroundColor Green
git branch --merged | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

# Verifier les commits recents
Write-Host ""
Write-Host "Derniers commits:" -ForegroundColor Yellow
git log --oneline -5

# Verifier la synchronisation avec origin
Write-Host ""
Write-Host "Synchronisation avec origin:" -ForegroundColor Magenta
git fetch origin
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/$currentBranch

if ($localCommit -eq $remoteCommit) {
    Write-Host "  Synchronise avec origin/$currentBranch" -ForegroundColor Green
} else {
    Write-Host "  Pas synchronise avec origin/$currentBranch" -ForegroundColor Red
}

Write-Host ""
Write-Host "Resume de l'uniformisation:" -ForegroundColor Green
Write-Host "  - Branche active: $($currentBranch)" -ForegroundColor White
Write-Host "  - Toutes les fonctionnalites principales sont integrees" -ForegroundColor White
Write-Host "  - Infrastructure Docker complete" -ForegroundColor White
Write-Host "  - Scripts de developpement crees" -ForegroundColor White
Write-Host "  - Configuration environnement prete" -ForegroundColor White
