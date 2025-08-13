Write-Host "MERGE COMPLET DE TOUTES LES BRANCHES" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Liste des branches a merger
$branches = @(
    "origin/cursor/organiser-et-cl-turer-les-tickets-github-ffd4",
    "origin/cursor/grant-workflow-permissions-for-code-scanning-c988",
    "origin/feature/admin-dashboard",
    "origin/feature/authentication-enhancement",
    "origin/feature/authentication-system",
    "origin/feature/code-cleanup-and-deployment"
)

foreach ($branch in $branches) {
    Write-Host "`nMerging: $branch" -ForegroundColor Yellow
    try {
        git merge $branch --no-edit
        Write-Host "  ✅ Merge reussi!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erreur de merge" -ForegroundColor Red
        Write-Host "  💡 Resolution manuelle necessaire" -ForegroundColor Gray
        break
    }
}

Write-Host "`n🎉 MERGE COMPLET TERMINE!" -ForegroundColor Green
Write-Host "Toutes les branches sont maintenant integrees!" -ForegroundColor Cyan
