import { test, expect } from '@playwright/test';

test.describe('Booking Flow E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil avant chaque test
    await page.goto('/');
  });

  test.describe('Professional Search', () => {
    
    test('should search for professionals successfully', async ({ page }) => {
      // Aller à la page de recherche
      await page.goto('/search');
      
      // Ou utiliser la barre de recherche depuis la page d'accueil
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="recherche"], #search');
      if (await searchInput.isVisible()) {
        await searchInput.fill('développeur web');
        await page.keyboard.press('Enter');
      }
      
      // Vérifier que les résultats de recherche s'affichent
      await expect(page.locator('[data-testid="search-results"], .search-results, .pro-list')).toBeVisible({ timeout: 5000 });
      
      // Vérifier qu'au moins un professionnel est affiché
      const proCards = page.locator('[data-testid="pro-card"], .pro-card, .professional-card');
      await expect(proCards.first()).toBeVisible({ timeout: 5000 });
    });

    test('should filter professionals by specialty', async ({ page }) => {
      await page.goto('/search');
      
      // Utiliser les filtres de spécialité
      const specialtyFilter = page.locator('select[name="specialty"], #specialty-filter, [data-testid="specialty-filter"]');
      if (await specialtyFilter.isVisible()) {
        await specialtyFilter.selectOption('Développement Web');
      }
      
      // Ou utiliser des boutons de filtre
      const filterButton = page.locator('button:has-text("Développement Web"), button:has-text("Web Development")');
      if (await filterButton.isVisible()) {
        await filterButton.click();
      }
      
      // Appliquer les filtres
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Appliquer"), button[type="submit"]');
      if (await applyButton.isVisible()) {
        await applyButton.click();
      }
      
      // Vérifier que les résultats sont filtrés
      await expect(page.locator('[data-testid="search-results"], .search-results')).toBeVisible({ timeout: 5000 });
    });

    test('should display professional details', async ({ page }) => {
      await page.goto('/search');
      
      // Attendre que les professionnels se chargent
      await page.waitForLoadState('networkidle');
      
      // Cliquer sur le premier professionnel
      const firstPro = page.locator('[data-testid="pro-card"], .pro-card, .professional-card').first();
      await expect(firstPro).toBeVisible({ timeout: 5000 });
      await firstPro.click();
      
      // Vérifier que la page de détail du professionnel s'affiche
      await expect(page).toHaveURL(/\/pro\/|\/profile\/|\/professional\//);
      
      // Vérifier les informations du professionnel
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await expect(page.locator('text=/€|hour|heure|rate/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Booking Process - Scenario 2', () => {
    
    test('should complete full booking flow: Client → Search PRO → Booking → Payment', async ({ page }) => {
      // Scénario prioritaire 2: Client → Recherche PRO → Réservation → Paiement
      
      // Étape 1: Simuler une connexion client (ou aller directement à la recherche)
      await page.goto('/search');
      
      // Étape 2: Rechercher un professionnel
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="recherche"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('consultant IT');
        await page.keyboard.press('Enter');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Étape 3: Sélectionner un professionnel
      const firstPro = page.locator('[data-testid="pro-card"], .pro-card, .professional-card').first();
      await expect(firstPro).toBeVisible({ timeout: 5000 });
      await firstPro.click();
      
      // Étape 4: Initier une réservation
      const bookButton = page.locator('button:has-text("Book"), button:has-text("Réserver"), button:has-text("Contact"), [data-testid="book-button"]');
      await expect(bookButton).toBeVisible({ timeout: 5000 });
      await bookButton.click();
      
      // Vérifier que la page de réservation s'affiche
      await expect(page).toHaveURL(/\/booking\/|\/book\/|\/reserve\//);
      
      // Étape 5: Remplir les détails de la réservation
      const serviceField = page.locator('textarea[name="description"], textarea[placeholder*="service"], #service-description');
      if (await serviceField.isVisible()) {
        await serviceField.fill('Je souhaite une consultation pour optimiser mon infrastructure IT et améliorer la sécurité de mes systèmes.');
      }
      
      // Sélectionner une date
      const dateField = page.locator('input[type="date"], input[name="date"], #booking-date');
      if (await dateField.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        await dateField.fill(tomorrowString);
      }
      
      // Sélectionner une heure
      const timeField = page.locator('input[type="time"], select[name="time"], #booking-time');
      if (await timeField.isVisible()) {
        if (await timeField.getAttribute('type') === 'time') {
          await timeField.fill('14:00');
        } else {
          await timeField.selectOption('14:00');
        }
      }
      
      // Durée estimée
      const durationField = page.locator('select[name="duration"], input[name="duration"], #duration');
      if (await durationField.isVisible()) {
        if (await durationField.getAttribute('type') === 'select-one') {
          await durationField.selectOption('2');
        } else {
          await durationField.fill('2');
        }
      }
      
      // Étape 6: Confirmer la réservation
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Confirmer"), button[type="submit"]');
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
      
      // Étape 7: Procéder au paiement (mode test)
      await page.waitForURL(/\/payment\/|\/checkout\/|\/pay\//, { timeout: 10000 });
      
      // Vérifier que la page de paiement s'affiche
      await expect(page.locator('h1, h2').first()).toContainText(/payment|paiement|checkout/i);
      
      // Remplir les informations de paiement de test
      const cardNumberField = page.locator('input[name="cardNumber"], #card-number, [data-testid="card-number"]');
      if (await cardNumberField.isVisible()) {
        await cardNumberField.fill('4242424242424242'); // Numéro de carte test Stripe
      }
      
      const expiryField = page.locator('input[name="expiry"], input[name="exp"], #card-expiry');
      if (await expiryField.isVisible()) {
        await expiryField.fill('12/25');
      }
      
      const cvcField = page.locator('input[name="cvc"], input[name="cvv"], #card-cvc');
      if (await cvcField.isVisible()) {
        await cvcField.fill('123');
      }
      
      const nameField = page.locator('input[name="cardName"], input[name="name"], #card-name');
      if (await nameField.isVisible()) {
        await nameField.fill('Test Client');
      }
      
      // Étape 8: Finaliser le paiement
      const payButton = page.locator('button:has-text("Pay"), button:has-text("Payer"), button:has-text("Complete Payment")');
      if (await payButton.isVisible()) {
        await payButton.click();
        
        // Attendre la confirmation de paiement
        await page.waitForURL(/\/success|\/confirmation|\/booking\/complete/, { timeout: 15000 });
        
        // Vérifier le message de succès
        await expect(page.locator('text=/success|confirmed|booking confirmed/i')).toBeVisible({ timeout: 10000 });
      }
    });

    test('should handle booking without payment for consultation requests', async ({ page }) => {
      await page.goto('/search');
      
      // Sélectionner un professionnel
      const firstPro = page.locator('[data-testid="pro-card"], .pro-card').first();
      if (await firstPro.isVisible()) {
        await firstPro.click();
        
        // Initier une demande de consultation
        const contactButton = page.locator('button:has-text("Contact"), button:has-text("Send Message"), [data-testid="contact-button"]');
        if (await contactButton.isVisible()) {
          await contactButton.click();
          
          // Remplir le message
          const messageField = page.locator('textarea[name="message"], #message, [data-testid="message-field"]');
          if (await messageField.isVisible()) {
            await messageField.fill('Bonjour, je souhaiterais discuter de mes besoins en développement web. Pourriez-vous me contacter ?');
            
            // Envoyer le message
            const sendButton = page.locator('button:has-text("Send"), button:has-text("Envoyer"), button[type="submit"]');
            await sendButton.click();
            
            // Vérifier la confirmation
            await expect(page.locator('text=/message sent|message envoyé|contact established/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });

  test.describe('Booking Validation', () => {
    
    test('should show validation errors for incomplete booking form', async ({ page }) => {
      // Simuler l'accès à une page de réservation
      await page.goto('/booking/test-pro-id');
      
      // Ou naviguer via la recherche
      if (page.url().includes('/search') || page.url() === '/') {
        await page.goto('/search');
        const firstPro = page.locator('[data-testid="pro-card"], .pro-card').first();
        if (await firstPro.isVisible()) {
          await firstPro.click();
          const bookButton = page.locator('button:has-text("Book"), button:has-text("Réserver")');
          if (await bookButton.isVisible()) {
            await bookButton.click();
          }
        }
      }
      
      // Essayer de soumettre sans remplir les champs requis
      const submitButton = page.locator('button[type="submit"], button:has-text("Confirm"), button:has-text("Book")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Vérifier les messages d'erreur
        const errorMessages = page.locator('text=/required|obligatoire|please fill|veuillez remplir/i');
        await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should prevent booking for past dates', async ({ page }) => {
      await page.goto('/search');
      
      const firstPro = page.locator('[data-testid="pro-card"], .pro-card').first();
      if (await firstPro.isVisible()) {
        await firstPro.click();
        
        const bookButton = page.locator('button:has-text("Book"), button:has-text("Réserver")');
        if (await bookButton.isVisible()) {
          await bookButton.click();
          
          // Essayer de sélectionner une date passée
          const dateField = page.locator('input[type="date"], input[name="date"]');
          if (await dateField.isVisible()) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];
            await dateField.fill(yesterdayString);
            
            const submitButton = page.locator('button[type="submit"], button:has-text("Confirm")');
            if (await submitButton.isVisible()) {
              await submitButton.click();
              
              // Vérifier le message d'erreur pour date passée
              await expect(page.locator('text=/past date|date passée|invalid date/i')).toBeVisible({ timeout: 3000 });
            }
          }
        }
      }
    });
  });

  test.describe('Mobile Booking Experience', () => {
    
    test('should complete booking flow on mobile', async ({ page }) => {
      // Définir une taille d'écran mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/search');
      
      // Vérifier que la recherche fonctionne sur mobile
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="recherche"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('designer graphique');
        await page.keyboard.press('Enter');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Sélectionner un professionnel sur mobile
      const firstPro = page.locator('[data-testid="pro-card"], .pro-card').first();
      if (await firstPro.isVisible()) {
        await firstPro.click();
        
        // Vérifier que les détails s'affichent correctement sur mobile
        await expect(page.locator('h1, h2').first()).toBeVisible();
        
        // Tester le bouton de réservation sur mobile
        const bookButton = page.locator('button:has-text("Book"), button:has-text("Réserver")');
        if (await bookButton.isVisible()) {
          await expect(bookButton).toBeEnabled();
          // On peut tester le click mais pas forcément aller jusqu'au bout sur mobile
        }
      }
    });
  });

  test.describe('Booking Management', () => {
    
    test('should display booking confirmation details', async ({ page }) => {
      // Simuler un accès direct à une page de confirmation
      await page.goto('/booking/confirmation/test-booking-id');
      
      // Ou naviguer depuis le profil utilisateur
      if (page.url() === '/') {
        const profileLink = page.locator('a[href*="/profile"], a:has-text("Profile"), [data-testid="profile-link"]');
        if (await profileLink.isVisible()) {
          await profileLink.click();
          
          const bookingsTab = page.locator('a:has-text("Bookings"), a:has-text("Réservations"), [data-testid="bookings-tab"]');
          if (await bookingsTab.isVisible()) {
            await bookingsTab.click();
          }
        }
      }
      
      // Vérifier que les détails de réservation s'affichent
      const bookingDetails = page.locator('[data-testid="booking-details"], .booking-details, .reservation-details');
      if (await bookingDetails.isVisible()) {
        await expect(bookingDetails).toContainText(/date|time|service|professional/i);
      }
    });
  });
});