import { Page, Locator } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Helper pour attendre que la page soit complètement chargée
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Helper pour la navigation avec retry
  async navigateTo(url: string, retries: number = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.goto(url);
        await this.waitForPageLoad();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  // Helper pour remplir des formulaires avec retry
  async fillForm(fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.fill(selector, value);
    }
  }

  // Helper pour cliquer avec retry
  async clickElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
  }

  // Helper pour attendre qu'un élément soit visible
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector);
  }

  // Helper pour vérifier si on est sur une page de login
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/auth/login') || this.page.url().includes('/login');
  }

  // Helper pour simuler une connexion simple
  async performBasicLogin(email: string = 'test@example.com', password: string = 'testpassword') {
    if (await this.isOnLoginPage()) {
      await this.fillForm({
        'input[name="email"], #email': email,
        'input[name="password"], #password': password,
      });
      await this.clickElement('button[type="submit"], button:has-text("Sign In")');
      await this.waitForPageLoad();
    }
  }

  // Helper pour vérifier la présence de navigation mobile
  async hasMobileNavigation(): Promise<boolean> {
    const selectors = [
      '[data-testid="mobile-nav"]',
      '.mobile-nav',
      '.bottom-navigation',
      '.burger-menu',
      'nav',
      '.navigation'
    ];

    for (const selector of selectors) {
      if (await this.page.locator(selector).isVisible()) {
        return true;
      }
    }
    return false;
  }

  // Helper pour vérifier la présence d'éléments de contenu
  async hasContent(): Promise<boolean> {
    const contentSelectors = [
      'main',
      '[data-testid="main-content"]',
      '.main-content',
      'article',
      '.content'
    ];

    for (const selector of contentSelectors) {
      if (await this.page.locator(selector).isVisible()) {
        return true;
      }
    }
    return false;
  }

  // Helper pour attendre et gérer les erreurs de chargement
  async handlePageErrors() {
    // Capturer les erreurs de console
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Capturer les erreurs de page
    this.page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
  }

  // Helper pour bypass l'authentification en mode test
  async bypassAuth() {
    // Ajouter un cookie ou token de test si l'application le supporte
    await this.page.addInitScript(() => {
      // Simuler un utilisateur connecté
      window.localStorage.setItem('test-user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'CLIENT'
      }));
    });
  }

  // Helper pour nettoyer le state entre les tests
  async cleanup() {
    await this.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
}

// Constantes pour les tests
export const TEST_SELECTORS = {
  // Navigation
  mobileNav: [
    '[data-testid="mobile-nav"]',
    '.mobile-nav',
    '.bottom-navigation',
    '.burger-menu',
    'nav'
  ].join(', '),

  // Formulaires d'authentification
  loginForm: 'form, [data-testid="login-form"]',
  registerForm: 'form, [data-testid="register-form"]',
  
  // Boutons communs
  submitButton: 'button[type="submit"], button:has-text("Submit"), button:has-text("Save")',
  loginButton: 'button[type="submit"], button:has-text("Sign In"), button:has-text("Login")',
  registerButton: 'button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")',
  
  // Contenu principal
  mainContent: 'main, [data-testid="main-content"], .main-content',
  
  // Posts et cartes
  postCard: '[data-testid="post"], .post, .feed-item, article',
  proCard: '[data-testid="pro-card"], .pro-card, .professional-card, .user-card',
  
  // Messages et conversations
  conversationItem: '[data-testid="conversation-item"], .conversation-item, .chat-item',
  messageInput: 'textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="message-input"]',
  
  // Champs de formulaire
  emailInput: 'input[name="email"], #email, input[type="email"]',
  passwordInput: 'input[name="password"], #password, input[type="password"]',
  usernameInput: 'input[name="username"], #username',
};

export const TEST_TIMEOUTS = {
  short: 3000,
  medium: 5000,
  long: 10000,
  extraLong: 30000,
};

export const TEST_DATA = {
  validClient: {
    username: 'testclient123',
    email: 'testclient@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Client',
  },
  validPro: {
    username: 'testpro123',
    email: 'testpro@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Professional',
    businessName: 'Test Business SARL',
  },
};