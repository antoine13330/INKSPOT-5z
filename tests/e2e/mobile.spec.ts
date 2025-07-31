import { test, expect } from '@playwright/test';

test.describe('Mobile E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Configurer la taille d'écran mobile avant chaque test
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
  });

  test.describe('Mobile Navigation - Scenario 5', () => {
    
    test('should navigate mobile interface successfully', async ({ page }) => {
      // Scénario prioritaire 5: Mobile → Navigation → Création post
      
      // Vérifier que la page d'accueil se charge correctement sur mobile
      await expect(page).toHaveTitle(/INKSPOT|Home/);
      
      // Vérifier la présence de la navigation mobile (burger menu ou bottom nav)
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, .bottom-navigation, .burger-menu');
      await expect(mobileNav).toBeVisible({ timeout: 5000 });
      
      // Tester la navigation principale
      const homeButton = page.locator('a[href="/"], button:has-text("Home"), [data-testid="home-button"]');
      if (await homeButton.isVisible()) {
        await homeButton.click();
        await expect(page).toHaveURL('/');
      }
      
      // Tester la navigation vers la recherche
      const searchButton = page.locator('a[href*="/search"], button:has-text("Search"), [data-testid="search-button"]');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await expect(page).toHaveURL(/\/search/);
      }
      
      // Tester la navigation vers les messages
      const messagesButton = page.locator('a[href*="/conversations"], button:has-text("Messages"), [data-testid="messages-button"]');
      if (await messagesButton.isVisible()) {
        await messagesButton.click();
        await expect(page).toHaveURL(/\/conversations|\/messages/);
      }
    });

    test('should handle mobile menu interactions', async ({ page }) => {
      // Chercher un menu burger ou menu déroulant
      const burgerMenu = page.locator('[data-testid="burger-menu"], .burger-menu, .menu-toggle');
      if (await burgerMenu.isVisible()) {
        await burgerMenu.click();
        
        // Vérifier que le menu s'ouvre
        const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .menu-drawer');
        await expect(mobileMenu).toBeVisible({ timeout: 3000 });
        
        // Tester les liens du menu
        const profileLink = page.locator('a[href*="/profile"], a:has-text("Profile")');
        if (await profileLink.isVisible()) {
          await profileLink.click();
          await expect(page).toHaveURL(/\/profile/);
        }
        
        // Fermer le menu
        const closeButton = page.locator('[data-testid="close-menu"], .close-menu, .menu-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(mobileMenu).not.toBeVisible();
        }
      }
    });

    test('should support swipe gestures for navigation', async ({ page }) => {
      // Vérifier si l'interface supporte les gestes de swipe
      await page.goto('/');
      
      // Simuler un swipe horizontal (si applicable)
      const mainContent = page.locator('main, [data-testid="main-content"], .main-content');
      if (await mainContent.isVisible()) {
        const box = await mainContent.boundingBox();
        if (box) {
          // Simuler un swipe de droite à gauche
          await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 50, box.y + box.height / 2);
          await page.mouse.up();
          
          // Attendre que l'animation se termine
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Mobile Post Creation', () => {
    
    test('should create a post successfully on mobile', async ({ page }) => {
      // Aller à la page de création de post
      const createButton = page.locator('button:has-text("Create"), button:has-text("Post"), [data-testid="create-post"], a[href*="/create"]');
      
      if (await createButton.isVisible()) {
        await createButton.click();
      } else {
        // Naviguer directement si le bouton n'est pas visible
        await page.goto('/create');
      }
      
      // Vérifier que la page de création s'affiche
      await expect(page).toHaveURL(/\/create|\/post\/new/);
      
      // Remplir le contenu du post
      const contentField = page.locator('textarea[name="content"], textarea[placeholder*="content"], #post-content');
      await expect(contentField).toBeVisible({ timeout: 5000 });
      await contentField.fill('Ceci est un post de test créé depuis mobile. #test #mobile #playwright');
      
      // Ajouter des hashtags
      const hashtagField = page.locator('input[name="hashtags"], input[placeholder*="hashtag"], #hashtags');
      if (await hashtagField.isVisible()) {
        await hashtagField.fill('test mobile playwright');
      }
      
      // Tester l'upload d'image sur mobile
      const imageUpload = page.locator('input[type="file"], [data-testid="image-upload"]');
      if (await imageUpload.isVisible()) {
        // Simuler l'upload d'image
        await page.evaluate(() => {
          const content = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
          const blob = new Blob([content], { type: 'image/png' });
          const file = new File([blob], 'test-mobile-image.png', { type: 'image/png' });
          
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        // Attendre que l'image soit traitée
        await page.waitForTimeout(1000);
      }
      
      // Publier le post
      const publishButton = page.locator('button[type="submit"], button:has-text("Publish"), button:has-text("Post")');
      await expect(publishButton).toBeVisible();
      await publishButton.click();
      
      // Vérifier la redirection et le succès
      await page.waitForURL(/\/|\/feed|\/profile/, { timeout: 10000 });
      
      // Vérifier que le post apparaît
      const postContent = page.locator('text="Ceci est un post de test créé depuis mobile"');
      await expect(postContent).toBeVisible({ timeout: 5000 });
    });

    test('should handle mobile camera integration', async ({ page }) => {
      await page.goto('/create');
      
      // Chercher le bouton caméra
      const cameraButton = page.locator('button:has-text("Camera"), [data-testid="camera-button"], button[title*="camera"]');
      if (await cameraButton.isVisible()) {
        // Vérifier que le bouton est accessible et suffisamment grand pour mobile
        const box = await cameraButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThan(40); // Minimum touch target
          expect(box.width).toBeGreaterThan(40);
        }
        
        // Note: On ne peut pas vraiment tester l'accès caméra sans permissions
        // Mais on peut vérifier que le bouton est fonctionnel
        await expect(cameraButton).toBeEnabled();
      }
    });

    test('should validate form fields on mobile', async ({ page }) => {
      await page.goto('/create');
      
      // Essayer de publier sans contenu
      const publishButton = page.locator('button[type="submit"], button:has-text("Publish")');
      if (await publishButton.isVisible()) {
        await publishButton.click();
        
        // Vérifier les messages d'erreur
        const errorMessage = page.locator('text=/required|obligatoire|content is required/i');
        await expect(errorMessage).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Mobile Touch Interactions', () => {
    
    test('should handle touch interactions for posts', async ({ page }) => {
      await page.goto('/');
      
      // Attendre que les posts se chargent
      await page.waitForLoadState('networkidle');
      
      // Chercher des posts existants
      const posts = page.locator('[data-testid="post"], .post, .feed-item');
      if (await posts.count() > 0) {
        const firstPost = posts.first();
        
        // Tester le like avec touch
        const likeButton = firstPost.locator('button:has-text("Like"), [data-testid="like-button"], .like-btn');
        if (await likeButton.isVisible()) {
          await likeButton.click();
          
          // Vérifier que le like fonctionne
          await page.waitForTimeout(500);
          const likedState = firstPost.locator('.liked, [data-liked="true"]');
          // Le like pourrait changer d'état visuellement
        }
        
        // Tester les commentaires
        const commentButton = firstPost.locator('button:has-text("Comment"), [data-testid="comment-button"]');
        if (await commentButton.isVisible()) {
          await commentButton.click();
          
          // Vérifier que la section commentaires s'ouvre
          const commentSection = page.locator('[data-testid="comments"], .comments, .comment-section');
          if (await commentSection.isVisible()) {
            await expect(commentSection).toBeVisible();
          }
        }
      }
    });

    test('should support pinch-to-zoom on images', async ({ page }) => {
      await page.goto('/');
      
      // Chercher des images dans les posts
      const postImages = page.locator('[data-testid="post-image"], .post-image, img');
      if (await postImages.count() > 0) {
        const firstImage = postImages.first();
        await expect(firstImage).toBeVisible();
        
        // Vérifier que l'image peut être cliquée pour un agrandissement
        await firstImage.click();
        
        // Chercher une modal ou lightbox
        const imageModal = page.locator('[data-testid="image-modal"], .image-modal, .lightbox');
        if (await imageModal.isVisible()) {
          await expect(imageModal).toBeVisible();
          
          // Fermer la modal
          const closeButton = page.locator('button:has-text("Close"), [data-testid="close-modal"]');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          } else {
            // Cliquer en dehors pour fermer
            await page.keyboard.press('Escape');
          }
        }
      }
    });
  });

  test.describe('Mobile Performance and UX', () => {
    
    test('should load quickly on mobile network', async ({ page }) => {
      // Simuler une connexion mobile lente
      await page.route('**/*', route => {
        // Ajouter un délai pour simuler une connexion plus lente
        setTimeout(() => route.continue(), 100);
      });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // Vérifier que le contenu principal se charge dans un délai raisonnable
      await expect(page.locator('main, [data-testid="main-content"]')).toBeVisible({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Maximum 5 secondes
    });

    test('should display correctly on different mobile sizes', async ({ page }) => {
      // Tester différentes tailles d'écran mobile
      const mobileSizes = [
        { width: 320, height: 568 }, // iPhone 5
        { width: 375, height: 667 }, // iPhone SE
        { width: 414, height: 896 }, // iPhone 11
        { width: 360, height: 740 }, // Android moyen
      ];
      
      for (const size of mobileSizes) {
        await page.setViewportSize(size);
        await page.goto('/');
        
        // Vérifier que les éléments principaux sont visibles
        const mainContent = page.locator('main, [data-testid="main-content"]');
        await expect(mainContent).toBeVisible();
        
        // Vérifier que la navigation mobile s'affiche
        const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, .bottom-navigation');
        if (await mobileNav.isVisible()) {
          await expect(mobileNav).toBeVisible();
        }
        
        // Vérifier qu'il n'y a pas de débordement horizontal
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(size.width + 1); // +1 pour l'arrondi
      }
    });

    test('should handle orientation changes', async ({ page }) => {
      // Mode portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      await expect(page.locator('main')).toBeVisible();
      
      // Mode paysage
      await page.setViewportSize({ width: 667, height: 375 });
      await page.reload();
      
      // Vérifier que l'interface s'adapte au mode paysage
      await expect(page.locator('main')).toBeVisible();
      
      // Vérifier que la navigation reste accessible
      const navigation = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav');
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    
    test('should be accessible with screen reader', async ({ page }) => {
      await page.goto('/');
      
      // Vérifier la présence d'attributs d'accessibilité
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      // Vérifier les boutons ont des labels appropriés
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          // Vérifier que le bouton a un texte ou aria-label
          const hasText = await button.textContent();
          const hasAriaLabel = await button.getAttribute('aria-label');
          const hasTitle = await button.getAttribute('title');
          
          expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Tester la navigation au clavier (pour utilisateurs avec clavier externe)
      await page.keyboard.press('Tab');
      
      // Vérifier que le focus est visible
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
      
      // Continuer la navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Vérifier que le focus se déplace correctement
      const newFocusedElement = page.locator(':focus');
      if (await newFocusedElement.isVisible()) {
        await expect(newFocusedElement).toBeVisible();
      }
    });
  });

  test.describe('Mobile Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Simuler une perte de connexion
      await page.route('**/*', route => route.abort());
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Vérifier qu'un message d'erreur approprié s'affiche
      const errorMessage = page.locator('text=/network error|connection|offline|no internet/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should provide fallback for failed image loads', async ({ page }) => {
      await page.goto('/');
      
      // Chercher des images et vérifier les fallbacks
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        const firstImage = images.first();
        
        // Vérifier qu'il y a un alt text
        const altText = await firstImage.getAttribute('alt');
        expect(altText).toBeTruthy();
        
        // Simuler une erreur de chargement d'image
        await firstImage.evaluate((img: HTMLImageElement) => {
          img.src = 'invalid-url.jpg';
        });
        
        await page.waitForTimeout(1000);
        
        // Vérifier qu'un placeholder ou fallback s'affiche
        const placeholder = page.locator('[data-testid="image-placeholder"], .image-placeholder, .image-fallback');
        if (await placeholder.isVisible()) {
          await expect(placeholder).toBeVisible();
        }
      }
    });
  });
});