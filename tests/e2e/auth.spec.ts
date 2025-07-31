import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil avant chaque test
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    
    test('should register a new CLIENT user successfully', async ({ page }) => {
      // Aller à la page d'inscription
      await page.goto('/auth/register');
      
      // Vérifier que la page d'inscription s'affiche
      await expect(page).toHaveTitle(/Register|Sign up/i);
      await expect(page.locator('h1, h2').first()).toContainText(/register|sign up|create account/i);
      
      // Sélectionner le type d'utilisateur CLIENT
      await page.locator('[data-testid="user-type-client"], input[value="CLIENT"]').first().click();
      
      // Remplir les informations de base
      await page.fill('input[name="username"], #username', 'testclient123');
      await page.fill('input[name="email"], #email', 'testclient@example.com');
      await page.fill('input[name="password"], #password', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"], #confirmPassword', 'TestPassword123!');
      await page.fill('input[name="firstName"], #firstName', 'Test');
      await page.fill('input[name="lastName"], #lastName', 'Client');
      await page.fill('input[name="phone"], #phone', '+33123456789');
      
      // Passer à l'étape suivante si c'est un formulaire multi-étapes
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Suivant")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Remplir les informations supplémentaires si présentes
      const bioField = page.locator('textarea[name="bio"], #bio');
      if (await bioField.isVisible()) {
        await bioField.fill('Je suis un client test qui cherche des services de qualité.');
      }
      
      const locationField = page.locator('input[name="location"], #location');
      if (await locationField.isVisible()) {
        await locationField.fill('Paris, France');
      }
      
      // Soumettre le formulaire
      await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Create Account")');
      
      // Vérifier la redirection vers la page de connexion ou confirmation
      await page.waitForURL(/\/auth\/login|\/auth\/verify|\//, { timeout: 10000 });
      
      // Vérifier le message de succès
      await expect(page.locator('text=/registration successful|account created|check your email/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should register a new PRO user successfully - Scenario 1', async ({ page }) => {
      // Scénario prioritaire 1: Inscription PRO → Vérification → Première réservation
      await page.goto('/auth/register');
      
      // Sélectionner le type d'utilisateur PRO
      await page.locator('[data-testid="user-type-pro"], input[value="PRO"]').first().click();
      
      // Remplir les informations de base
      await page.fill('input[name="username"], #username', 'testpro123');
      await page.fill('input[name="email"], #email', 'testpro@example.com');
      await page.fill('input[name="password"], #password', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"], #confirmPassword', 'TestPassword123!');
      await page.fill('input[name="firstName"], #firstName', 'Test');
      await page.fill('input[name="lastName"], #lastName', 'Professional');
      await page.fill('input[name="phone"], #phone', '+33987654321');
      
      // Passer à l'étape suivante
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Suivant")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Remplir les informations professionnelles
      const businessNameField = page.locator('input[name="businessName"], #businessName');
      if (await businessNameField.isVisible()) {
        await businessNameField.fill('Test Business SARL');
      }
      
      const businessAddressField = page.locator('input[name="businessAddress"], #businessAddress');
      if (await businessAddressField.isVisible()) {
        await businessAddressField.fill('123 Rue de Test, 75001 Paris');
      }
      
      const siretField = page.locator('input[name="siret"], #siret');
      if (await siretField.isVisible()) {
        await siretField.fill('12345678901234');
      }
      
      const hourlyRateField = page.locator('input[name="hourlyRate"], #hourlyRate');
      if (await hourlyRateField.isVisible()) {
        await hourlyRateField.fill('75');
      }
      
      // Ajouter des spécialités
      const specialtyInput = page.locator('input[name="specialty"], #specialty, input[placeholder*="specialty"]');
      if (await specialtyInput.isVisible()) {
        await specialtyInput.fill('Développement Web');
        await page.keyboard.press('Enter');
        await specialtyInput.fill('Consulting IT');
        await page.keyboard.press('Enter');
      }
      
      // Soumettre le formulaire
      await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Create Account")');
      
      // Vérifier la redirection et le message de succès
      await page.waitForURL(/\/auth\/login|\/auth\/verify|\//, { timeout: 10000 });
      await expect(page.locator('text=/registration successful|account created|verification/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Essayer de soumettre sans remplir les champs requis
      await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Create Account")');
      
      // Vérifier les messages d'erreur de validation
      const errorMessages = page.locator('text=/required|obligatoire|email|password/i');
      await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/auth/register');
      
      await page.fill('input[name="email"], #email', 'test@example.com');
      await page.fill('input[name="password"], #password', 'password123');
      await page.fill('input[name="confirmPassword"], #confirmPassword', 'differentpassword');
      
      await page.click('button[type="submit"], button:has-text("Register")');
      
      // Vérifier le message d'erreur pour les mots de passe différents
      await expect(page.locator('text=/password.*match|mots de passe.*identiques/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('User Login', () => {
    
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Vérifier que la page de connexion s'affiche
      await expect(page).toHaveTitle(/Login|Sign in/i);
      await expect(page.locator('h1, h2').first()).toContainText(/welcome back|sign in|login/i);
      
      // Remplir les identifiants
      await page.fill('input[name="email"], #email', 'test@example.com');
      await page.fill('input[name="password"], #password', 'testpassword');
      
      // Se connecter
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      
      // Vérifier la redirection vers la page d'accueil
      await page.waitForURL('/', { timeout: 10000 });
      await expect(page).toHaveURL('/');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Essayer de se connecter avec des identifiants invalides
      await page.fill('input[name="email"], #email', 'invalid@example.com');
      await page.fill('input[name="password"], #password', 'wrongpassword');
      
      await page.click('button[type="submit"], button:has-text("Sign In")');
      
      // Vérifier le message d'erreur
      await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Essayer de soumettre sans remplir les champs
      await page.click('button[type="submit"], button:has-text("Sign In")');
      
      // Vérifier les messages d'erreur de validation
      const emailError = page.locator('input[name="email"], #email');
      const passwordError = page.locator('input[name="password"], #password');
      
      await expect(emailError).toHaveAttribute('required');
      await expect(passwordError).toHaveAttribute('required');
    });
  });

  test.describe('Navigation between auth pages', () => {
    
    test('should navigate from login to register', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Cliquer sur le lien d'inscription
      await page.click('a[href*="/auth/register"], a:has-text("Sign up"), a:has-text("Register")');
      
      // Vérifier la redirection vers la page d'inscription
      await expect(page).toHaveURL(/\/auth\/register/);
    });

    test('should navigate from register to login', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Cliquer sur le lien de connexion
      await page.click('a[href*="/auth/login"], a:has-text("Sign in"), a:has-text("Login")');
      
      // Vérifier la redirection vers la page de connexion
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Responsive Authentication', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Définir une taille d'écran mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/auth/login');
      
      // Vérifier que la page s'affiche correctement sur mobile
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="email"], #email')).toBeVisible();
      await expect(page.locator('input[name="password"], #password')).toBeVisible();
      
      // Tester la saisie sur mobile
      await page.fill('input[name="email"], #email', 'mobile@test.com');
      await page.fill('input[name="password"], #password', 'mobiletest');
      
      // Vérifier que les boutons sont cliquables
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });
});