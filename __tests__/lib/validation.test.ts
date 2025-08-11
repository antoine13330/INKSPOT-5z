import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  phoneSchema,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  validateInput,
  userRegistrationSchema,
  userLoginSchema,
  postCreationSchema,
  bookingSchema,
  paymentSchema,
  searchSchema,
  generateCSRFToken,
  validateCSRFToken,
  validateFileUpload,
  sanitizeSQLInput,
  preventXSS,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('Email Schema', () => {
    it('should validate correct email', () => {
      const result = emailSchema.safeParse('test@example.com')
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email')
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  describe('Password Schema', () => {
    it('should validate password with 8+ characters', () => {
      const result = passwordSchema.safeParse('password123')
      expect(result.success).toBe(true)
    })

    it('should reject password with less than 8 characters', () => {
      const result = passwordSchema.safeParse('short')
      expect(result.success).toBe(false)
    })
  })

  describe('Username Schema', () => {
    it('should validate username with 3-30 characters', () => {
      const result = usernameSchema.safeParse('testuser')
      expect(result.success).toBe(true)
    })

    it('should reject username with less than 3 characters', () => {
      const result = usernameSchema.safeParse('ab')
      expect(result.success).toBe(false)
    })

    it('should reject username with more than 30 characters', () => {
      const result = usernameSchema.safeParse('a'.repeat(31))
      expect(result.success).toBe(false)
    })
  })

  describe('Phone Schema', () => {
    it('should validate valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '123 456 7890',
      ]
      
      validPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc-def-ghij',
        '123.456.7890',
        'invalid',
      ]
      
      invalidPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone)
        expect(result.success).toBe(false)
      })
    })
  })
})

describe('Sanitization Functions', () => {
  describe('HTML Sanitization', () => {
    it('should sanitize HTML content', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHtml(input)
      
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <a href="https://example.com">Link</a>'
      const result = sanitizeHtml(input)
      
      expect(result).toContain('<b>Bold</b>')
      expect(result).toContain('<i>Italic</i>')
      expect(result).toContain('<a href="https://example.com">Link</a>')
    })
  })

  describe('Text Sanitization', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeText(input)
      
      expect(result).toBe('Hello World')
    })

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeText(input)
      
      expect(result).toBe('')
    })

    it('should remove event handlers', () => {
      const input = 'onclick="alert(\'xss\')" onload="alert(\'xss\')"'
      const result = sanitizeText(input)
      
      expect(result).toBe('')
    })
  })

  describe('URL Sanitization', () => {
    it('should validate and return valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path?param=value',
      ]
      
      validUrls.forEach(url => {
        const result = sanitizeUrl(url)
        expect(result).toBe(url)
      })
    })

    it('should return empty string for invalid URLs', () => {
      const invalidUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com',
      ]
      
      invalidUrls.forEach(url => {
        const result = sanitizeUrl(url)
        expect(result).toBe('')
      })
    })
  })
})

describe('Validation Functions', () => {
  describe('validateInput', () => {
    it('should return success for valid data', () => {
      const result = validateInput(emailSchema, 'test@example.com')
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should return errors for invalid data', () => {
      const result = validateInput(emailSchema, 'invalid-email')
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toContain('Invalid email format')
      }
    })
  })
})

describe('Complex Schemas', () => {
  describe('User Registration Schema', () => {
    it('should validate complete user registration data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      }
      
      const result = userRegistrationSchema.safeParse(userData)
      expect(result.success).toBe(true)
    })

    it('should reject incomplete user registration data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
        username: 'ab',
        firstName: '',
        lastName: 'Doe',
      }
      
      const result = userRegistrationSchema.safeParse(userData)
      expect(result.success).toBe(false)
    })
  })

  describe('User Login Schema', () => {
    it('should validate login data', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }
      
      const result = userLoginSchema.safeParse(loginData)
      expect(result.success).toBe(true)
    })

    it('should reject empty password', () => {
      const loginData = {
        email: 'test@example.com',
        password: '',
      }
      
      const result = userLoginSchema.safeParse(loginData)
      expect(result.success).toBe(false)
    })
  })

  describe('Post Creation Schema', () => {
    it('should validate post creation data', () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content.',
        tags: ['test', 'example'],
        isPublic: true,
      }
      
      const result = postCreationSchema.safeParse(postData)
      expect(result.success).toBe(true)
    })

    it('should reject post with too many tags', () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content.',
        tags: Array(11).fill('tag'),
        isPublic: true,
      }
      
      const result = postCreationSchema.safeParse(postData)
      expect(result.success).toBe(false)
    })
  })

  describe('Booking Schema', () => {
    it('should validate booking data', () => {
      const bookingData = {
        proId: 'pro-123',
        date: '2024-01-15T10:00:00Z',
        time: '14:30',
        duration: 60,
        notes: 'Test booking',
      }
      
      const result = bookingSchema.safeParse(bookingData)
      expect(result.success).toBe(true)
    })

    it('should reject booking with invalid duration', () => {
      const bookingData = {
        proId: 'pro-123',
        date: '2024-01-15T10:00:00Z',
        time: '14:30',
        duration: 20, // Too short
        notes: 'Test booking',
      }
      
      const result = bookingSchema.safeParse(bookingData)
      expect(result.success).toBe(false)
    })
  })

  describe('Payment Schema', () => {
    it('should validate payment data', () => {
      const paymentData = {
        amount: 100.50,
        currency: 'USD',
        description: 'Test payment',
        metadata: { orderId: '123' },
      }
      
      const result = paymentSchema.safeParse(paymentData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const paymentData = {
        amount: -50,
        currency: 'USD',
        description: 'Test payment',
      }
      
      const result = paymentSchema.safeParse(paymentData)
      expect(result.success).toBe(false)
    })
  })

  describe('Search Schema', () => {
    it('should validate search data', () => {
      const searchData = {
        query: 'test search',
        filters: {
          category: 'all',
          location: 'New York',
          priceRange: { min: 10, max: 100 },
          rating: 4,
        },
        page: 1,
        limit: 20,
      }
      
      const result = searchSchema.safeParse(searchData)
      expect(result.success).toBe(true)
    })

    it('should reject empty query', () => {
      const searchData = {
        query: '',
        page: 1,
        limit: 20,
      }
      
      const result = searchSchema.safeParse(searchData)
      expect(result.success).toBe(false)
    })
  })
})

describe('Security Functions', () => {
  describe('CSRF Token', () => {
    it('should generate valid CSRF token', () => {
      const token = generateCSRFToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(10)
    })

    it('should validate matching CSRF tokens', () => {
      const token = generateCSRFToken()
      const isValid = validateCSRFToken(token, token)
      
      expect(isValid).toBe(true)
    })

    it('should reject non-matching CSRF tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      const isValid = validateCSRFToken(token1, token2)
      
      expect(isValid).toBe(false)
    })
  })

  describe('File Upload Validation', () => {
    it('should validate valid file upload', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      
      expect(result.valid).toBe(true)
    })

    it('should reject file that is too large', () => {
      const largeFile = new File(['x'.repeat(100)], 'large.jpg', { type: 'image/jpeg' })
      // Debug: check file size
      expect(largeFile.size).toBe(100)
      const result = validateFileUpload(largeFile, 50) // 50 bytes limit
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('File too large')
    })

    it('should reject unsupported file type', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
      const result = validateFileUpload(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('File type not allowed')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL input', () => {
      const input = "'; DROP TABLE users; --"
      const result = sanitizeSQLInput(input)
      
      expect(result).not.toContain("'")
      expect(result).not.toContain(';')
      expect(result).not.toContain('--')
    })

    it('should handle normal text', () => {
      const input = 'normal text'
      const result = sanitizeSQLInput(input)
      
      expect(result).toBe('normal text')
    })
  })

  describe('XSS Prevention', () => {
    it('should prevent XSS attacks', () => {
      const input = '<script>alert("xss")</script>'
      const result = preventXSS(input)
      
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).not.toContain('<script>')
    })

    it('should handle quotes and slashes', () => {
      const input = '"\'/'
      const result = preventXSS(input)
      
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
      expect(result).toContain('&#x2F;')
    })
  })
}) 