# Script pour configurer automatiquement les secrets GitHub
# Utilise l'API GitHub pour ajouter tous les secrets nécessaires

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$true)]
    [string]$Repository,
    
    [Parameter(Mandatory=$false)]
    [string]$Owner = "antoine13330"
)

# Configuration des variables d'environnement nécessaires
$secrets = @{
    # Stripe
    "STRIPE_SECRET_KEY" = "sk_test_...",
    "STRIPE_PUBLISHABLE_KEY" = "pk_test_...",
    "STRIPE_WEBHOOK_SECRET" = "whsec_...",
    
    # Base de données
    "DATABASE_URL" = "postgresql://...",
    "DIRECT_URL" = "postgresql://...",
    
    # NextAuth
    "NEXTAUTH_SECRET" = "your-nextauth-secret-here",
    "NEXTAUTH_URL" = "http://localhost:3000",
    
    # OAuth Providers
    "GOOGLE_CLIENT_ID" = "your-google-client-id",
    "GOOGLE_CLIENT_SECRET" = "your-google-client-secret",
    
    # Email (si vous utilisez un service d'email)
    "EMAIL_SERVER_HOST" = "smtp.gmail.com",
    "EMAIL_SERVER_PORT" = "587",
    "EMAIL_SERVER_USER" = "your-email@gmail.com",
    "EMAIL_SERVER_PASSWORD" = "your-app-password",
    
    # AWS S3 (si vous utilisez S3)
    "AWS_ACCESS_KEY_ID" = "your-aws-access-key",
    "AWS_SECRET_ACCESS_KEY" = "your-aws-secret-key",
    "AWS_REGION" = "eu-west-3",
    "AWS_S3_BUCKET" = "your-bucket-name",
    
    # Redis (si vous utilisez Redis)
    "REDIS_URL" = "redis://localhost:6379",
    
    # Monitoring
    "GRAFANA_URL" = "http://localhost:3001",
    "PROMETHEUS_URL" = "http://localhost:9090",
    
    # Snyk (pour le security scanning)
    "SNYK_TOKEN" = "your-snyk-token",
    
    # Autres services
    "SENTRY_DSN" = "your-sentry-dsn",
    "LOG_LEVEL" = "info"
}

Write-Host "🔐 Configuration des secrets GitHub pour $Owner/$Repository" -ForegroundColor Green
Write-Host ""

# Fonction pour ajouter un secret
function Add-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    try {
        # Encoder le secret en base64
        $encodedValue = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($SecretValue))
        
        # Préparer le payload pour l'API GitHub
        $body = @{
            encrypted_value = $encodedValue
            key_id = "your-key-id" # Vous devrez récupérer cette clé depuis GitHub
        } | ConvertTo-Json
        
        # Appel à l'API GitHub
        $headers = @{
            "Authorization" = "token $GitHubToken"
            "Accept" = "application/vnd.github.v3+json"
        }
        
        $uri = "https://api.github.com/repos/$Owner/$Repository/actions/secrets/$SecretName"
        
        $response = Invoke-RestMethod -Uri $uri -Method Put -Headers $headers -Body $body -ContentType "application/json"
        
        Write-Host "✅ $SecretName configuré avec succès" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erreur lors de la configuration de $SecretName : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Vérifier que le token GitHub est valide
Write-Host "🔍 Vérification du token GitHub..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Host "✅ Token GitHub valide pour l'utilisateur: $($userResponse.login)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Token GitHub invalide. Vérifiez votre token et réessayez." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Avant de continuer, vous devez récupérer la clé publique de chiffrement GitHub." -ForegroundColor Yellow
Write-Host "   Exécutez cette commande pour obtenir la clé:" -ForegroundColor Yellow
Write-Host "   curl -H 'Authorization: token $GitHubToken' https://api.github.com/repos/$Owner/$Repository/actions/secrets/public-key" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Voulez-vous continuer après avoir récupéré la clé ? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Configuration annulée." -ForegroundColor Yellow
    exit 0
}

# Demander la clé publique
$publicKey = Read-Host "Entrez la clé publique GitHub (key_id)"
if (-not $publicKey) {
    Write-Host "❌ Clé publique requise pour continuer." -ForegroundColor Red
    exit 1
}

# Mettre à jour la clé dans le script
$body = @{
    encrypted_value = $encodedValue
    key_id = $publicKey
} | ConvertTo-Json

Write-Host ""
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
    
    if (Add-GitHubSecret -SecretName $secret.Key -SecretValue $secretValue) {
        $successCount++
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
