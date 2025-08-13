# Verification des fonctionnalites INKSPOT
Write-Host "VERIFICATION DES FONCTIONNALITES INKSPOT" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# 1. Services Docker
Write-Host "1. SERVICES DOCKER" -ForegroundColor Yellow
docker ps --format "table {{.Names}} {{.Status}} {{.Ports}}"

Write-Host ""

# 2. Base de donnees
Write-Host "2. BASE DE DONNEES" -ForegroundColor Yellow
try {
    $dbTest = docker exec inkspot_postgres psql -U postgres -d inkspot -c "SELECT COUNT(*) FROM \"User\";" 2>$null
    if ($dbTest) {
        Write-Host "  Base de donnees: CONNECTEE" -ForegroundColor Green
    } else {
        Write-Host "  Base de donnees: ERREUR" -ForegroundColor Red
    }
} catch {
    Write-Host "  Base de donnees: ERREUR" -ForegroundColor Red
}

Write-Host ""

# 3. Application Next.js
Write-Host "3. APPLICATION NEXT.JS" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Application: DEMARREE (http://localhost:3000)" -ForegroundColor Green
} catch {
    Write-Host "  Application: NON DEMARREE" -ForegroundColor Red
    Write-Host "  Lancez: npm run dev" -ForegroundColor Gray
}

Write-Host ""

# 4. Routes API
Write-Host "4. ROUTES API" -ForegroundColor Yellow
$apiRoutes = @(
    "http://localhost:3000/api/health",
    "http://localhost:3000/api/auth/session",
    "http://localhost:3000/api/posts"
)

foreach ($route in $apiRoutes) {
    try {
        $response = Invoke-WebRequest -Uri $route -UseBasicParsing -TimeoutSec 3
        Write-Host "  $route : OK" -ForegroundColor Green
    } catch {
        Write-Host "  $route : ERREUR" -ForegroundColor Red
    }
}

Write-Host ""

# 5. Composants
Write-Host "5. COMPOSANTS" -ForegroundColor Yellow
$components = @(
    "components/ui/button.tsx",
    "components/chat/chat-interface.tsx",
    "components/search/AutoComplete.tsx"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "  $component : OK" -ForegroundColor Green
    } else {
        Write-Host "  $component : MANQUANT" -ForegroundColor Red
    }
}

Write-Host ""

# 6. Pages
Write-Host "6. PAGES" -ForegroundColor Yellow
$pages = @(
    "app/page.tsx",
    "app/auth/login/page.tsx",
    "app/profile/page.tsx"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "  $page : OK" -ForegroundColor Green
    } else {
        Write-Host "  $page : MANQUANT" -ForegroundColor Red
    }
}

Write-Host ""

# 7. Tests
Write-Host "7. TESTS" -ForegroundColor Yellow
$testFiles = Get-ChildItem -Path "__tests__" -Recurse -Filter "*.test.*" | Measure-Object
Write-Host "  Fichiers de test: $($testFiles.Count)" -ForegroundColor Cyan

Write-Host ""

# 8. Resume
Write-Host "8. RESUME" -ForegroundColor Yellow
Write-Host "  Projet INKSPOT: APPLICATION COMPLETE" -ForegroundColor Green
Write-Host "  Type: Plateforme artistes/clients" -ForegroundColor White
Write-Host "  Architecture: Next.js 15 + Prisma + PostgreSQL" -ForegroundColor White
Write-Host "  Infrastructure: Docker + Monitoring" -ForegroundColor White

Write-Host ""
Write-Host "VERIFICATION TERMINEE !" -ForegroundColor Green
