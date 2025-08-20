# Script simplifié pour configurer les secrets GitHub immédiatement
# Utilise GitHub CLI pour ajouter les secrets essentiels

Write-Host "🔐 Configuration des secrets GitHub pour INKSPOT-5z" -ForegroundColor Green
Write-Host "Repository: antoine13330/INKSPOT-5z" -ForegroundColor Cyan
Write-Host ""

# Vérifier l'authentification GitHub CLI
try {
    $authStatus = gh auth status
    Write-Host "✅ GitHub CLI authentifié" -ForegroundColor Green
}
catch {
    Write-Host "❌ GitHub CLI non authentifié. Exécutez 'gh auth login' d'abord" -ForegroundColor Red
    exit 1
}

# Secrets essentiels à configurer (avec valeurs par défaut)
$secrets = @{
    # Stripe (ESSENTIEL pour le build)
    "STRIPE_SECRET_KEY" = "sk_test_51Q...",
    "STRIPE_PUBLISHABLE_KEY" = "pk_test_51Q...",
    "STRIPE_WEBHOOK_SECRET" = "whsec_...",
    
    # Base de données
    "DATABASE_URL" = "postgresql://...",
    "DIRECT_URL" = "postgresql://...",
    
    # NextAuth
    "NEXTAUTH_SECRET" = "your-nextauth-secret-here",
    "NEXTAUTH_URL" = "http://localhost:3000",
    
    # OAuth
    "GOOGLE_CLIENT_ID" = "your-google-client-id",
    "GOOGLE_CLIENT_SECRET" = "your-google-client-secret",
    
    # AWS S3
    "AWS_ACCESS_KEY_ID" = "your-aws-access-key",
    "AWS_SECRET_ACCESS_KEY" = "your-aws-secret-key",
    "AWS_REGION" = "eu-west-3",
    "AWS_S3_BUCKET" = "your-bucket-name",
    
    # Monitoring
    "GRAFANA_URL" = "http://localhost:3001",
    "PROMETHEUS_URL" = "http://localhost:9090",
    
    # Security
    "SNYK_TOKEN" = "your-snyk-token"
}

Write-Host "🚀 Début de la configuration des secrets..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$totalCount = $secrets.Count

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "📝 Configuration de $($secret.Key)..." -ForegroundColor Blue
    
    # Demander la valeur du secret
    $secretValue = Read-Host "Entrez la valeur pour $($secret.Key) (ou appuyez sur Entrée pour utiliser la valeur par défaut)"
    
    if (-not $secretValue) {
        $secretValue = $secret.Value
    }
    
    # Utiliser GitHub CLI pour ajouter le secret
    try {
        gh secret set $secret.Key --repo "antoine13330/INKSPOT-5z" --body $secretValue
        Write-Host "✅ $($secret.Key) configuré avec succès" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "❌ Erreur lors de la configuration de $($secret.Key)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "✅ $successCount sur $totalCount secrets configurés avec succès" -ForegroundColor Green

if ($successCount -lt $totalCount) {
    Write-Host "⚠️  Certains secrets n'ont pas pu être configurés. Vérifiez les erreurs ci-dessus." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Vérifiez vos secrets sur: https://github.com/antoine13330/INKSPOT-5z/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Vérifiez que tous les secrets sont configurés" -ForegroundColor Yellow
Write-Host "   2. Relancez le workflow CI/CD sur GitHub" -ForegroundColor Yellow
Write-Host "   3. Le build devrait maintenant passer sans erreurs d'authentification" -ForegroundColor Yellow
