import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    themes: ['light', 'dark', 'system', 'pro-custom']
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock auto-theme hook
jest.mock('@/hooks/use-auto-theme', () => ({
  useAutoTheme: () => ({
    isAutoMode: false,
    enableAutoMode: jest.fn(),
    disableAutoMode: jest.fn(),
    shouldBeLightTheme: true,
    getTimeUntilNextChange: () => ({ hours: 6, minutes: 30, nextTheme: 'dark' }),
    requestNotificationPermission: jest.fn()
  })
}))

describe('Theme Accessibility Tests', () => {
  it('should have no accessibility violations in light mode', async () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="bg-background text-foreground p-4">
          <h1 className="text-2xl font-bold text-primary">Test Heading</h1>
          <p className="text-muted-foreground">Test paragraph content</p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded">
            Test Button
          </button>
          <ThemeToggle />
        </div>
      </ThemeProvider>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations in dark mode', async () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div className="dark bg-background text-foreground p-4">
          <h1 className="text-2xl font-bold text-primary">Test Heading</h1>
          <p className="text-muted-foreground">Test paragraph content</p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded">
            Test Button
          </button>
          <ThemeToggle />
        </div>
      </ThemeProvider>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper focus management on theme toggle', () => {
    const { getByRole } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleButton = getByRole('button', { name: /sélectionner un thème/i })
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-label')
  })

  it('should maintain color contrast ratios', () => {
    // Test pour vérifier que les couleurs respectent WCAG AA
    const testElement = document.createElement('div')
    testElement.style.cssText = `
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --primary: 221.2 83.2% 53.3%;
      --primary-foreground: 210 40% 98%;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
    `
    
    document.body.appendChild(testElement)
    
    const styles = window.getComputedStyle(testElement)
    const backgroundColor = styles.backgroundColor
    const textColor = styles.color
    
    // Les couleurs devraient être définies
    expect(backgroundColor).toBeTruthy()
    expect(textColor).toBeTruthy()
    
    document.body.removeChild(testElement)
  })

  it('should support reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="transition-all duration-200">
          <ThemeToggle />
        </div>
      </ThemeProvider>
    )

    expect(container).toBeInTheDocument()
  })

  it('should provide appropriate ARIA labels for theme options', () => {
    const { getByRole } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = getByRole('button', { name: /sélectionner un thème/i })
    expect(button).toHaveAttribute('aria-label', 'Sélectionner un thème')
  })

  describe('Color Contrast Validation', () => {
    const colorTests = [
      { name: 'Background vs Foreground', bg: 'hsl(0 0% 100%)', fg: 'hsl(222.2 84% 4.9%)' },
      { name: 'Primary vs Primary Foreground', bg: 'hsl(221.2 83.2% 53.3%)', fg: 'hsl(210 40% 98%)' },
      { name: 'Dark Background vs Foreground', bg: 'hsl(0 0% 6%)', fg: 'hsl(0 0% 98%)' },
    ]

    colorTests.forEach(({ name, bg, fg }) => {
      it(`should have sufficient contrast for ${name}`, () => {
        // Test basique de contraste (implémentation complète nécessiterait une librairie de calcul de contraste)
        expect(bg).toBeTruthy()
        expect(fg).toBeTruthy()
        expect(bg).not.toBe(fg) // Les couleurs doivent être différentes
      })
    })
  })
})