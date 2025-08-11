import crypto from 'crypto'

export interface SecretConfig {
  name: string
  value: string
  encrypted: boolean
  environment: string
  lastRotated?: Date
}

class SecretsManager {
  private static instance: SecretsManager
  private secrets: Map<string, SecretConfig> = new Map()
  private encryptionKey: string

  private constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
  }

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager()
    }
    return SecretsManager.instance
  }

  // Encrypt a secret value
  private encrypt(value: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey)
    
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  // Decrypt a secret value
  private decrypt(encryptedValue: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedValue.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // Store a secret
  async storeSecret(name: string, value: string, environment = 'production'): Promise<void> {
    const encrypted = this.encrypt(value)
    
    const secret: SecretConfig = {
      name,
      value: encrypted,
      encrypted: true,
      environment,
      lastRotated: new Date(),
    }
    
    this.secrets.set(name, secret)
    
    // In a real implementation, this would be stored in a secure database
    // or external secrets management service like AWS Secrets Manager
    console.log(`Secret '${name}' stored for environment '${environment}'`)
  }

  // Retrieve a secret
  async getSecret(name: string, environment = 'production'): Promise<string | null> {
    const secret = this.secrets.get(name)
    
    if (!secret || secret.environment !== environment) {
      return null
    }
    
    if (secret.encrypted) {
      return this.decrypt(secret.value)
    }
    
    return secret.value
  }

  // Rotate a secret
  async rotateSecret(name: string, newValue: string, environment = 'production'): Promise<void> {
    await this.storeSecret(name, newValue, environment)
    console.log(`Secret '${name}' rotated for environment '${environment}'`)
  }

  // List all secrets
  async listSecrets(environment?: string): Promise<SecretConfig[]> {
    const secrets = Array.from(this.secrets.values())
    
    if (environment) {
      return secrets.filter(secret => secret.environment === environment)
    }
    
    return secrets
  }

  // Delete a secret
  async deleteSecret(name: string, environment = 'production'): Promise<boolean> {
    const secret = this.secrets.get(name)
    
    if (secret && secret.environment === environment) {
      this.secrets.delete(name)
      console.log(`Secret '${name}' deleted from environment '${environment}'`)
      return true
    }
    
    return false
  }

  // Validate secret strength
  validateSecretStrength(value: string): { valid: boolean; score: number; suggestions: string[] } {
    const suggestions: string[] = []
    let score = 0
    
    // Length check
    if (value.length >= 12) {
      score += 2
    } else {
      suggestions.push('Secret should be at least 12 characters long')
    }
    
    // Complexity checks
    if (/[a-z]/.test(value)) score += 1
    if (/[A-Z]/.test(value)) score += 1
    if (/[0-9]/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1
    
    // Common patterns check
    if (/(.)\1{2,}/.test(value)) {
      score -= 1
      suggestions.push('Avoid repeated characters')
    }
    
    if (/123|abc|password|admin/i.test(value)) {
      score -= 2
      suggestions.push('Avoid common patterns')
    }
    
    const valid = score >= 3
    
    return {
      valid,
      score: Math.max(0, score),
      suggestions,
    }
  }

  // Generate a secure random secret
  generateSecureSecret(length = 32): string {
    return crypto.randomBytes(length).toString('base64')
  }

  // Check for exposed secrets in code
  async scanForExposedSecrets(): Promise<{ found: boolean; locations: string[] }> {
    // This would scan the codebase for potential secret exposures
    // Implementation would depend on the specific requirements
    return {
      found: false,
      locations: [],
    }
  }
}

export const secretsManager = SecretsManager.getInstance()

// Environment-specific secret helpers
export const getProductionSecret = (name: string) => secretsManager.getSecret(name, 'production')
export const getStagingSecret = (name: string) => secretsManager.getSecret(name, 'staging')
export const getDevelopmentSecret = (name: string) => secretsManager.getSecret(name, 'development') 