require("@testing-library/jest-dom")

// Expose a controllable IntersectionObserver mock
const mockIntersectionObserver = jest.fn((callback, options) => {
  return {
    observe: jest.fn(() => {
      // Do not auto-trigger; tests can call recorded callback via mockIntersectionObserver.mock.calls
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    _callback: callback,
    _options: options,
  }
})

global.mockIntersectionObserver = mockIntersectionObserver

global.IntersectionObserver = function (callback, options) {
  // Record the constructor call and return a mocked instance
  mockIntersectionObserver(callback, options)
  return mockIntersectionObserver.mock.results[mockIntersectionObserver.mock.calls.length - 1].value
}

// Ensure Redis uses the ioredis mock path in tests
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : 'http://localhost:3000'
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body || null
    this.formData = jest.fn().mockResolvedValue(new Map())
    this.json = jest.fn().mockResolvedValue(
      typeof this.body === 'string'
        ? (() => { try { return JSON.parse(this.body) } catch { return {} } })()
        : (this.body || {})
    )
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers || {})
    this.json = jest.fn().mockResolvedValue(body)
  }
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: jest.fn((data, init) => new global.Response(data, init)),
    redirect: jest.fn((url) => new global.Response(null, { status: 302, headers: { Location: url } })),
  },
}))

// Improved Mock URL to parse search params
global.URL = class MockURL {
  constructor(url, base) {
    this.href = url
    this.protocol = typeof url === 'string' && url.startsWith('https:') ? 'https:' : (typeof url === 'string' && url.startsWith('http:') ? 'http:' : 'file:')
    const queryIndex = typeof url === 'string' ? url.indexOf('?') : -1
    const query = queryIndex !== -1 ? url.slice(queryIndex + 1) : ''
    this.searchParams = new URLSearchParams(query)
  }
  toString() {
    return this.href
  }
}

// Mock URLSearchParams
global.URLSearchParams = class MockURLSearchParams {
  constructor(init) {
    this.params = new Map()
    if (init) {
      if (typeof init === 'string') {
        // Parse query string
        const pairs = init.split('&').filter(Boolean)
        pairs.forEach(pair => {
          const [rawKey, rawValue] = pair.split('=')
          if (rawKey) this.params.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue || ''))
        })
      } else if (Array.isArray(init)) {
        // Array of key-value pairs
        init.forEach(([key, value]) => this.params.set(key, value))
      } else if (init instanceof Object) {
        // Object
        Object.entries(init).forEach(([key, value]) => this.params.set(key, value))
      }
    }
  }

  get(key) {
    return this.params.get(key) || null
  }

  getAll(key) {
    return this.params.has(key) ? [this.params.get(key)] : []
  }

  has(key) {
    return this.params.has(key)
  }

  set(key, value) {
    this.params.set(key, value)
  }

  append(key, value) {
    this.params.set(key, value)
  }

  delete(key) {
    this.params.delete(key)
  }

  toString() {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  }
}

// Mock Headers
global.Headers = class MockHeaders {
  constructor(init = {}) {
    this.headers = new Map()
    Object.entries(init).forEach(([key, value]) => {
      this.headers.set(key.toLowerCase(), value)
    })
  }

  get(key) {
    return this.headers.get(key.toLowerCase()) || null
  }

  set(key, value) {
    this.headers.set(key.toLowerCase(), value)
  }

  has(key) {
    return this.headers.has(key.toLowerCase())
  }

  append(key, value) {
    this.headers.set(key.toLowerCase(), value)
  }

  delete(key) {
    this.headers.delete(key.toLowerCase())
  }

  forEach(callback) {
    this.headers.forEach((value, key) => callback(value, key))
  }
}

// Mock FormData - Fixed to properly handle getAll method
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map()
  }

  append(key, value) {
    if (!this.data.has(key)) {
      this.data.set(key, [])
    }
    this.data.get(key).push(value)
  }

  get(key) {
    const values = this.data.get(key)
    return values && values.length > 0 ? values[0] : null
  }

  getAll(key) {
    return this.data.get(key) || []
  }

  has(key) {
    return this.data.has(key) && this.data.get(key).length > 0
  }

  delete(key) {
    this.data.delete(key)
  }

  entries() {
    const entries = []
    this.data.forEach((values, key) => {
      values.forEach(value => {
        entries.push([key, value])
      })
    })
    return entries
  }

  keys() {
    return this.data.keys()
  }

  values() {
    const values = []
    this.data.forEach(valueArray => {
      values.push(...valueArray)
    })
    return values
  }

  forEach(callback) {
    this.data.forEach((values, key) => {
      values.forEach(value => callback(value, key))
    })
  }
}

// Mock File
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.name = name
    // Handle different types of bits (ArrayBuffer, Buffer, etc.)
    if (bits instanceof ArrayBuffer) {
      this.size = bits.byteLength
    } else if (Array.isArray(bits)) {
      // For array of strings, sum the lengths
      this.size = bits.reduce((total, bit) => total + (typeof bit === 'string' ? bit.length : 0), 0)
    } else if (typeof bits === 'string') {
      // For string content, use length directly
      this.size = bits.length
    } else if (bits && typeof bits === 'object' && bits.byteLength !== undefined) {
      this.size = bits.byteLength
    } else {
      this.size = 0
    }
    this.type = options.type || 'application/octet-stream'
    this.lastModified = options.lastModified || Date.now()
    this.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8))
  }
}

// Mock Blob
global.Blob = class MockBlob {
  constructor(content, options = {}) {
    this.size = content.length || 0
    this.type = options.type || 'application/octet-stream'
    this.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8))
  }
}

// Mock TextEncoder for File size calculation
global.TextEncoder = class MockTextEncoder {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf8'))
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
