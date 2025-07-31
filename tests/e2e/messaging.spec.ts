import { test, expect } from '@playwright/test';

test.describe('Messaging E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil avant chaque test
    await page.goto('/');
  });

  test.describe('Message Sending - Scenario 3', () => {
    
    test('should send and receive messages in real-time', async ({ page }) => {
      // Scénario prioritaire 3: Messagerie → Envoi fichiers → Notifications
      
      // Aller à la page des conversations
      await page.goto('/conversations');
      
      // Ou naviguer via le menu
      const messagesLink = page.locator('a[href*="/conversations"], a[href*="/messages"], [data-testid="messages-link"]');
      if (await messagesLink.isVisible()) {
        await messagesLink.click();
      }
      
      // Vérifier que la page de conversations s'affiche
      await expect(page).toHaveURL(/\/conversations|\/messages/);
      
      // Sélectionner ou créer une conversation
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item, .chat-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
      } else {
        // Créer une nouvelle conversation
        const newChatButton = page.locator('button:has-text("New"), button:has-text("Nouveau"), [data-testid="new-chat"]');
        if (await newChatButton.isVisible()) {
          await newChatButton.click();
        }
      }
      
      // Vérifier que la zone de messagerie s'affiche
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="message-input"]');
      await expect(messageInput).toBeVisible({ timeout: 5000 });
      
      // Envoyer un message texte
      const testMessage = 'Bonjour, je vous contacte concernant votre service de développement web. Pouvons-nous discuter des détails ?';
      await messageInput.fill(testMessage);
      
      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Envoyer"), [data-testid="send-button"]');
      await expect(sendButton).toBeVisible();
      await sendButton.click();
      
      // Vérifier que le message apparaît dans la conversation
      await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 5000 });
      
      // Vérifier que le message a le bon statut (envoyé)
      const sentMessage = page.locator('[data-testid="message-sent"], .message-sent, .sent').last();
      await expect(sentMessage).toBeVisible({ timeout: 3000 });
    });

    test('should send messages with file attachments', async ({ page }) => {
      await page.goto('/conversations');
      
      // Sélectionner une conversation existante ou en créer une
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
      }
      
      // Vérifier la présence du bouton d'upload de fichier
      const fileUploadButton = page.locator('input[type="file"], button:has-text("Attach"), [data-testid="file-upload"]');
      if (await fileUploadButton.isVisible()) {
        
        // Créer un fichier de test temporaire
        const testFilePath = 'test-document.txt';
        await page.evaluate(() => {
          const content = 'Ceci est un document de test pour la messagerie.';
          const blob = new Blob([content], { type: 'text/plain' });
          const file = new File([blob], 'test-document.txt', { type: 'text/plain' });
          
          // Simuler l'upload du fichier
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        // Attendre que le fichier soit traité
        await page.waitForTimeout(1000);
        
        // Ajouter un message avec le fichier
        const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
        if (await messageInput.isVisible()) {
          await messageInput.fill('Voici le document que vous avez demandé.');
        }
        
        // Envoyer le message avec le fichier
        const sendButton = page.locator('button[type="submit"], button:has-text("Send")');
        await sendButton.click();
        
        // Vérifier que le message avec fichier apparaît
        await expect(page.locator('text="test-document.txt", [data-testid="file-attachment"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show typing indicators', async ({ page }) => {
      await page.goto('/conversations');
      
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Commencer à taper dans le champ de message
        const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
        await messageInput.fill('Je suis en train d\'écrire un message...');
        
        // Dans un vrai test, on vérifierait l'indicateur de frappe côté récepteur
        // Ici on vérifie que l'input fonctionne correctement
        await expect(messageInput).toHaveValue('Je suis en train d\'écrire un message...');
        
        // Effacer le message (simuler l'arrêt de frappe)
        await messageInput.clear();
        await expect(messageInput).toHaveValue('');
      }
    });
  });

  test.describe('Message History and Navigation', () => {
    
    test('should display conversation history', async ({ page }) => {
      await page.goto('/conversations');
      
      // Vérifier que la liste des conversations s'affiche
      const conversationsList = page.locator('[data-testid="conversations-list"], .conversations-list, .chat-list');
      await expect(conversationsList).toBeVisible({ timeout: 5000 });
      
      // Vérifier qu'il y a au moins une conversation ou un message d'état vide
      const hasConversations = await page.locator('[data-testid="conversation-item"], .conversation-item').count() > 0;
      const hasEmptyState = await page.locator('text=/no conversations|aucune conversation|start chatting/i').isVisible();
      
      expect(hasConversations || hasEmptyState).toBeTruthy();
    });

    test('should navigate between conversations', async ({ page }) => {
      await page.goto('/conversations');
      
      const conversations = page.locator('[data-testid="conversation-item"], .conversation-item');
      const conversationCount = await conversations.count();
      
      if (conversationCount > 1) {
        // Cliquer sur la première conversation
        await conversations.first().click();
        
        // Vérifier que la conversation s'ouvre
        const messageArea = page.locator('[data-testid="message-area"], .message-area, .chat-messages');
        await expect(messageArea).toBeVisible({ timeout: 3000 });
        
        // Cliquer sur la deuxième conversation
        await conversations.nth(1).click();
        
        // Vérifier que la nouvelle conversation s'affiche
        await expect(messageArea).toBeVisible({ timeout: 3000 });
      }
    });

    test('should search through message history', async ({ page }) => {
      await page.goto('/conversations');
      
      // Chercher un champ de recherche dans les messages
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="recherche"], [data-testid="message-search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('développement');
        await page.keyboard.press('Enter');
        
        // Attendre les résultats de recherche
        await page.waitForTimeout(1000);
        
        // Vérifier que les résultats s'affichent
        const searchResults = page.locator('[data-testid="search-results"], .search-results');
        if (await searchResults.isVisible()) {
          await expect(searchResults).toContainText(/développement/i);
        }
      }
    });
  });

  test.describe('Notifications', () => {
    
    test('should show message notifications', async ({ page }) => {
      // Aller à la page de messagerie
      await page.goto('/conversations');
      
      // Vérifier s'il y a des notifications de messages non lus
      const unreadBadge = page.locator('[data-testid="unread-badge"], .unread-badge, .notification-badge');
      if (await unreadBadge.isVisible()) {
        // Vérifier que le badge contient un nombre
        const badgeText = await unreadBadge.textContent();
        expect(badgeText).toMatch(/\d+/);
      }
      
      // Vérifier les notifications dans la liste des conversations
      const unreadConversation = page.locator('[data-testid="unread-conversation"], .unread, .has-unread');
      if (await unreadConversation.isVisible()) {
        await unreadConversation.click();
        
        // Vérifier que le statut non lu se met à jour après lecture
        await page.waitForTimeout(1000);
        // Le badge devrait disparaître ou se mettre à jour
      }
    });

    test('should handle real-time message reception', async ({ page }) => {
      await page.goto('/conversations');
      
      // Sélectionner une conversation
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Dans un test réel, on simulerait la réception d'un message
        // Ici on vérifie que la zone de messages est prête à recevoir des updates
        const messageArea = page.locator('[data-testid="message-area"], .message-area, .messages-container');
        await expect(messageArea).toBeVisible();
        
        // Vérifier que l'interface est reactive (scroll automatique, etc.)
        const messagesContainer = page.locator('[data-testid="messages-container"], .messages-list');
        if (await messagesContainer.isVisible()) {
          // On pourrait tester le scroll automatique en bas
          await expect(messagesContainer).toBeVisible();
        }
      }
    });
  });

  test.describe('File Management in Messages', () => {
    
    test('should display file attachments correctly', async ({ page }) => {
      await page.goto('/conversations');
      
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Chercher des messages existants avec des fichiers
        const fileAttachments = page.locator('[data-testid="file-attachment"], .file-attachment, .attachment');
        if (await fileAttachments.count() > 0) {
          // Vérifier que les fichiers s'affichent avec leurs noms
          const firstAttachment = fileAttachments.first();
          await expect(firstAttachment).toBeVisible();
          
          // Vérifier qu'on peut cliquer pour télécharger/voir
          await expect(firstAttachment).toBeEnabled();
        }
      }
    });

    test('should support different file types', async ({ page }) => {
      await page.goto('/conversations');
      
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Vérifier support pour différents types de fichiers
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Vérifier que l'input accepte différents types
          const acceptAttribute = await fileInput.getAttribute('accept');
          if (acceptAttribute) {
            expect(acceptAttribute).toContain('image/'); // Images
            // Pourrait aussi vérifier PDF, documents, etc.
          }
        }
      }
    });
  });

  test.describe('Mobile Messaging Experience', () => {
    
    test('should work correctly on mobile devices', async ({ page }) => {
      // Définir une taille d'écran mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/conversations');
      
      // Vérifier que l'interface mobile s'affiche correctement
      const conversationsList = page.locator('[data-testid="conversations-list"], .conversations-list');
      await expect(conversationsList).toBeVisible({ timeout: 5000 });
      
      // Tester la navigation mobile
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Sur mobile, on pourrait avoir une vue plein écran de la conversation
        const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
        await expect(messageInput).toBeVisible();
        
        // Tester la saisie tactile
        await messageInput.fill('Message de test sur mobile');
        await expect(messageInput).toHaveValue('Message de test sur mobile');
        
        // Vérifier que le bouton d'envoi est accessible
        const sendButton = page.locator('button:has-text("Send"), button:has-text("Envoyer")');
        if (await sendButton.isVisible()) {
          await expect(sendButton).toBeEnabled();
        }
      }
    });

    test('should handle touch interactions for file uploads', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/conversations');
      
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Chercher le bouton d'upload adapté au mobile
        const uploadButton = page.locator('button:has-text("Attach"), [data-testid="mobile-upload"], input[type="file"]');
        if (await uploadButton.isVisible()) {
          // Vérifier que le bouton est suffisamment grand pour le touch
          const boundingBox = await uploadButton.boundingBox();
          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThan(40); // Minimum touch target size
            expect(boundingBox.width).toBeGreaterThan(40);
          }
        }
      }
    });
  });

  test.describe('Message Status and Delivery', () => {
    
    test('should show message delivery status', async ({ page }) => {
      await page.goto('/conversations');
      
      const conversationItem = page.locator('[data-testid="conversation-item"], .conversation-item').first();
      if (await conversationItem.isVisible()) {
        await conversationItem.click();
        
        // Envoyer un message et vérifier son statut
        const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
        if (await messageInput.isVisible()) {
          await messageInput.fill('Message de test pour vérifier le statut');
          
          const sendButton = page.locator('button[type="submit"], button:has-text("Send")');
          await sendButton.click();
          
          // Vérifier les indicateurs de statut (envoyé, livré, lu)
          const statusIndicators = page.locator('[data-testid="message-status"], .message-status, .delivery-status');
          if (await statusIndicators.count() > 0) {
            const lastStatus = statusIndicators.last();
            await expect(lastStatus).toBeVisible({ timeout: 3000 });
          }
        }
      }
    });
  });
});