import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  LazyLoad,
  LazyImage,
  LazyComponent,
  LazyList,
  LazyModal,
  LazyRoute,
  useLazyLoad,
  useLazyLoadPerformance,
} from '@/components/ui/lazy-load'

// IntersectionObserver is mocked globally in jest.setup.js

// Mock dynamic import
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({ children, fallback }: any) => (
    <div data-testid="suspense">
      {fallback}
      {children}
    </div>
  ),
}))

describe('LazyLoad Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children when visible', () => {
    render(
      <LazyLoad>
        <div data-testid="lazy-content">Lazy Content</div>
      </LazyLoad>
    )

    expect(screen.getByTestId('lazy-content')).toBeInTheDocument()
  })

  it('should render fallback when not visible', () => {
    render(
      <LazyLoad fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="lazy-content">Lazy Content</div>
      </LazyLoad>
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <LazyLoad className="custom-class">
        <div>Content</div>
      </LazyLoad>
    )

    const container = screen.getByText('Content').parentElement
    expect(container).toHaveClass('custom-class')
  })
})

describe('LazyImage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render image when visible', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test Image"
        width={100}
        height={100}
      />
    )

    const img = screen.getByAltText('Test Image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test-image.jpg')
  })

  it('should show placeholder when image is loading', () => {
    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test Image"
        width={100}
        height={100}
      />
    )

    const placeholder = screen.getByAltText('Test Image').parentElement
    expect(placeholder).toHaveClass('relative')
  })

  it('should handle image load events', async () => {
    const onLoad = jest.fn()
    const onError = jest.fn()

    render(
      <LazyImage
        src="test-image.jpg"
        alt="Test Image"
        onLoad={onLoad}
        onError={onError}
      />
    )

    const img = screen.getByAltText('Test Image')
    
    // Simulate image load
    fireEvent.load(img)
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('should handle image error', async () => {
    const onError = jest.fn()

    render(
      <LazyImage
        src="invalid-image.jpg"
        alt="Test Image"
        onError={onError}
      />
    )

    const img = screen.getByAltText('Test Image')
    
    // Simulate image error
    fireEvent.error(img)
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})

describe('LazyComponent Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render component when visible', async () => {
    const mockComponent = jest.fn(() => <div data-testid="dynamic-component">Dynamic Component</div>)
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyComponent
        component={componentLoader}
        fallback={<div data-testid="fallback">Loading...</div>}
      />
    )

    // Initially shows fallback
    expect(screen.getByTestId('fallback')).toBeInTheDocument()

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument()
    })
  })

  it('should pass props to loaded component', async () => {
    const mockComponent = jest.fn((props: any) => (
      <div data-testid="dynamic-component">{props.message}</div>
    ))
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyComponent
        component={componentLoader}
        props={{ message: 'Hello World' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })
})

describe('LazyList Component', () => {
  const mockItems = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  const mockRenderItem = (item: any) => <div key={item.id}>{item.name}</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render initial items', () => {
    render(
      <LazyList
        items={mockItems}
        renderItem={mockRenderItem}
        pageSize={10}
      />
    )

    // Should render first 10 items
    expect(screen.getByText('Item 0')).toBeInTheDocument()
    expect(screen.getByText('Item 9')).toBeInTheDocument()
    expect(screen.queryByText('Item 10')).not.toBeInTheDocument()
  })

  it('should show loading indicator when more items are available', () => {
    render(
      <LazyList
        items={mockItems}
        renderItem={mockRenderItem}
        pageSize={10}
      />
    )

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('should load more items when scrolled to bottom', async () => {
    render(
      <LazyList
        items={mockItems}
        renderItem={mockRenderItem}
        pageSize={10}
      />
    )

    // Initially shows 10 items
    expect(screen.getByText('Item 0')).toBeInTheDocument()
    expect(screen.queryByText('Item 20')).not.toBeInTheDocument()

    // Simulate intersection observer trigger
    const observerCallback = mockIntersectionObserver.mock.calls[0][0]
    observerCallback([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('Item 20')).toBeInTheDocument()
    })
  })
})

describe('LazyModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    const mockComponent = jest.fn(() => <div>Modal Content</div>)
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyModal
        isOpen={false}
        onClose={jest.fn()}
        component={componentLoader}
      />
    )

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('should render modal when open', async () => {
    const mockComponent = jest.fn(() => <div>Modal Content</div>)
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyModal
        isOpen={true}
        onClose={jest.fn()}
        component={componentLoader}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = jest.fn()
    const mockComponent = jest.fn(({ onClose }: any) => (
      <button onClick={onClose}>Close</button>
    ))
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyModal
        isOpen={true}
        onClose={onClose}
        component={componentLoader}
      />
    )

    await waitFor(() => {
      const closeButton = screen.getByText('Close')
      userEvent.click(closeButton)
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('LazyRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render route with suspense', () => {
    const mockComponent = jest.fn(() => <div>Route Content</div>)
    const componentLoader = () => Promise.resolve({ default: mockComponent })

    render(
      <LazyRoute
        component={componentLoader}
        fallback={<div data-testid="route-fallback">Loading Route...</div>}
      />
    )

    expect(screen.getByTestId('suspense')).toBeInTheDocument()
    expect(screen.getByTestId('route-fallback')).toBeInTheDocument()
  })
})

describe('useLazyLoad Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return ref and visibility state', () => {
    const TestComponent = () => {
      const { ref, isVisible } = useLazyLoad()
      return (
        <div ref={ref} data-testid="lazy-element">
          {isVisible ? 'Visible' : 'Hidden'}
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('lazy-element')).toBeInTheDocument()
  })

  it('should accept custom threshold and rootMargin', () => {
    const TestComponent = () => {
      const { ref, isVisible } = useLazyLoad(0.5, '100px')
      return (
        <div ref={ref} data-testid="lazy-element">
          {isVisible ? 'Visible' : 'Hidden'}
        </div>
      )
    }

    render(<TestComponent />)

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5, rootMargin: '100px' }
    )
  })
})

describe('useLazyLoadPerformance Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return performance metrics', () => {
    const TestComponent = () => {
      const { metrics, trackLoad, trackError } = useLazyLoadPerformance()
      return (
        <div>
          <span data-testid="load-count">{metrics.loadCount}</span>
          <span data-testid="error-count">{metrics.errorCount}</span>
          <button onClick={() => trackLoad(100)}>Track Load</button>
          <button onClick={() => trackError()}>Track Error</button>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('load-count')).toHaveTextContent('0')
    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
  })

  it('should track load times', async () => {
    const TestComponent = () => {
      const { metrics, trackLoad } = useLazyLoadPerformance()
      return (
        <div>
          <span data-testid="load-time">{metrics.loadTime}</span>
          <button onClick={() => trackLoad(100)}>Track Load</button>
        </div>
      )
    }

    render(<TestComponent />)

    const trackButton = screen.getByText('Track Load')
    userEvent.click(trackButton)

    await waitFor(() => {
      expect(screen.getByTestId('load-time')).toHaveTextContent('100')
    })
  })

  it('should track errors', async () => {
    const TestComponent = () => {
      const { metrics, trackError } = useLazyLoadPerformance()
      return (
        <div>
          <span data-testid="error-count">{metrics.errorCount}</span>
          <button onClick={() => trackError()}>Track Error</button>
        </div>
      )
    }

    render(<TestComponent />)

    const trackButton = screen.getByText('Track Error')
    userEvent.click(trackButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    })
  })
})

// Helper function to simulate intersection observer
const fireEvent = {
  load: (element: HTMLElement) => {
    element.dispatchEvent(new Event('load'))
  },
  error: (element: HTMLElement) => {
    element.dispatchEvent(new Event('error'))
  },
} 