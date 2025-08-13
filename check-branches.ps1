Write-Host "VERIFICATION DES BRANCHES" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

Write-Host "Branche actuelle:" -ForegroundColor Yellow
git branch --show-current

Write-Host "`nBranches locales:" -ForegroundColor Yellow
git branch

Write-Host "`nBranches distantes:" -ForegroundColor Yellow
git branch -r | Select-String "cursor"

Write-Host "`nDerniers commits:" -ForegroundColor Yellow
git log --oneline -5

Write-Host "`nStatut:" -ForegroundColor Yellow
git status --porcelain
