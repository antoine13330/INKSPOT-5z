# Script simple pour configurer les secrets GitHub avec GitHub CLI
# Plus simple et plus rapide que l'API REST

param(
    [Parameter(Mandatory=$false)]
    [string]$Repository = "INKSPOT-5z",
    
    [Parameter(Mandatory=$false)]
    [string]$Owner = "antoine13330"
)

Write-Host "🔐 Configuration des secrets GitHub avec GitHub CLI" -ForegroundColor Green
Write-Host "Repository: $Owner/$Repository" -ForegroundColor Cyan
Write-Host ""

# Vérifier si GitHub CLI est installé
try {
    $ghVersion = gh --version
    Write-Host "✅ GitHub CLI détecté: $ghVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ GitHub CLI non installé. Installez-le depuis: https://cli.github.com/" -ForegroundColor Red
    Write-Host "   Ou utilisez le script setup-github-secrets.ps1 qui utilise l'API REST" -ForegroundColor Yellow
    exit 1
}

# Vérifier l'authentification GitHub CLI
try {
    $authStatus = gh auth status
    Write-Host "✅ GitHub CLI authentifié" -ForegroundColor Green
}
catch {
    Write-Host "❌ GitHub CLI non authentifié. Exécutez 'gh auth login' d'abord" -ForegroundColor Red
    exit 1
}

# Liste des secrets à configurer
$secrets = @{
    # Stripe (essentiels pour le build)
    "STRIPE_SECRET_KEY" = "sk_test_...",
    "STRIPE_PUBLISHABLE_KEY" = "pk_test_...",
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
        gh secret set $secret.Key --repo "$Owner/$Repository" --body $secretValue
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
Write-Host "🔗 Vérifiez vos secrets sur: https://github.com/$Owner/$Repository/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Vérifiez que tous les secrets sont configurés" -ForegroundColor Yellow
Write-Host "   2. Relancez le workflow CI/CD sur GitHub" -ForegroundColor Yellow
Write-Host "   3. Le build devrait maintenant passer sans erreurs d'authentification" -ForegroundColor Yellow
