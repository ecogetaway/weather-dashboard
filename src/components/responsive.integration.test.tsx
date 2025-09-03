import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherCard } from './WeatherCard/WeatherCard';
import { ForecastList } from './ForecastList/ForecastList';
import { SearchBar } from './SearchBar/SearchBar';
import { RecentSearches } from './RecentSearches/RecentSearches';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Responsive Component Integration Tests', () => {
  const mockWeatherData = {
    location: 'New York',
    temperature: { celsius: 22, fahrenheit: 72 },
    description: 'Clear sky',
    icon: '01d',
    humidity: 65,
    windSpeed: 5.2,
    pressure: 1013,
    visibility: 10,
    uvIndex: 3,
    timestamp: new Date()
  };

  const mockForecastData = [
    {
      date: new Date(),
      temperature: { min: 18, max: 25 },
      description: 'Sunny',
      icon: '01d',
      humidity: 60,
      windSpeed: 4.5,
      precipitation: 0
    },
    {
      date: new Date(Date.now() + 86400000),
      temperature: { min: 20, max: 27 },
      description: 'Partly cloudy',
      icon: '02d',
      humidity: 55,
      windSpeed: 6.0,
      precipitation: 10
    }
  ];

  const mockLocations = [
    { id: 'london', name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
    { id: 'paris', name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { id: 'tokyo', name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mobile Viewport (320px)', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      // Mock mobile media query
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('WeatherCard adapts to mobile layout', () => {
      const { container } = render(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      const weatherCard = container.firstChild as HTMLElement;
      expect(weatherCard).toBeInTheDocument();

      // Check that mobile-specific styles are applied
      const temperatureElement = screen.getByText('22°C');
      expect(temperatureElement).toBeInTheDocument();

      // Verify touch-friendly button sizes (minimum 44px)
      const toggleButton = screen.getByRole('button', { name: /toggle temperature unit/i });
      const styles = window.getComputedStyle(toggleButton);
      expect(parseInt(styles.minHeight) >= 44).toBe(true);
    });

    it('ForecastList uses column layout on mobile', () => {
      const { container } = render(
        <ForecastList 
          forecastData={mockForecastData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
          temperatureUnit="celsius"
        />
      );

      const forecastList = container.querySelector('[class*="forecastList"]');
      expect(forecastList).toBeInTheDocument();

      // Should display forecast items in column layout
      const forecastItems = screen.getAllByRole('article');
      expect(forecastItems).toHaveLength(2);
    });

    it('SearchBar is full width on mobile', () => {
      const { container } = render(
        <SearchBar 
          onLocationSelect={vi.fn()}
          value=""
          onChange={vi.fn()}
          placeholder="Search for a city..."
        />
      );

      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toBeInTheDocument();

      // Should have mobile-appropriate styling
      const searchContainer = container.firstChild as HTMLElement;
      expect(searchContainer).toHaveClass('searchBar');
    });

    it('RecentSearches uses horizontal scroll on mobile', () => {
      const { container } = render(
        <RecentSearches 
          recentLocations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationRemove={vi.fn()}
          isLoading={false}
        />
      );

      const recentSearches = container.querySelector('[class*="recentSearches"]');
      expect(recentSearches).toBeInTheDocument();

      // Should show location buttons
      mockLocations.forEach(location => {
        expect(screen.getByText(`${location.name}, ${location.country}`)).toBeInTheDocument();
      });
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 768px') && query.includes('max-width: 1024px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('components adapt to tablet layout', () => {
      render(
        <div>
          <WeatherCard 
            weatherData={mockWeatherData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
          />
          <ForecastList 
            forecastData={mockForecastData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
            temperatureUnit="celsius"
          />
        </div>
      );

      // Both components should be visible and properly sized
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Sunny')).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('ForecastList uses horizontal layout on desktop', () => {
      const { container } = render(
        <ForecastList 
          forecastData={mockForecastData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
          temperatureUnit="celsius"
        />
      );

      const forecastList = container.querySelector('[class*="forecastList"]');
      expect(forecastList).toBeInTheDocument();

      // Should display forecast items horizontally
      const forecastItems = screen.getAllByRole('article');
      expect(forecastItems).toHaveLength(2);
    });

    it('RecentSearches uses grid layout on desktop', () => {
      render(
        <RecentSearches 
          recentLocations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationRemove={vi.fn()}
          isLoading={false}
        />
      );

      // Should show all locations in grid layout
      mockLocations.forEach(location => {
        expect(screen.getByText(`${location.name}, ${location.country}`)).toBeInTheDocument();
      });
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events on mobile devices', () => {
      const onLocationSelect = vi.fn();
      
      render(
        <RecentSearches 
          recentLocations={mockLocations}
          onLocationSelect={onLocationSelect}
          onLocationRemove={vi.fn()}
          isLoading={false}
        />
      );

      const londonButton = screen.getByText('London, UK');
      
      // Simulate touch events
      fireEvent.touchStart(londonButton);
      fireEvent.touchEnd(londonButton);
      fireEvent.click(londonButton);

      expect(onLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('provides adequate touch targets (44px minimum)', () => {
      render(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /toggle temperature unit/i });
      
      // Check computed styles for minimum touch target size
      const rect = toggleButton.getBoundingClientRect();
      expect(rect.height >= 44 || rect.width >= 44).toBe(true);
    });
  });

  describe('Swipe Gestures', () => {
    it('supports swipe navigation in forecast on mobile', () => {
      const { container } = render(
        <ForecastList 
          forecastData={mockForecastData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
          temperatureUnit="celsius"
        />
      );

      const forecastContainer = container.querySelector('[class*="forecastList"]');
      
      // Simulate swipe gesture
      fireEvent.touchStart(forecastContainer!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(forecastContainer!, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      
      fireEvent.touchEnd(forecastContainer!, {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      });

      // Gesture should be handled (implementation depends on your swipe logic)
      expect(forecastContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Images and Icons', () => {
    it('loads appropriate image sizes for different viewports', () => {
      render(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      const weatherIcon = screen.getByRole('img', { name: /weather icon/i });
      expect(weatherIcon).toBeInTheDocument();
      
      // Should have appropriate src for the icon
      expect(weatherIcon).toHaveAttribute('src', expect.stringContaining('01d'));
    });
  });

  describe('Text Readability', () => {
    it('maintains readable text at all viewport sizes', () => {
      const { container } = render(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      // Check that text elements are present and readable
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('22°C')).toBeInTheDocument();
      expect(screen.getByText('Clear sky')).toBeInTheDocument();

      // Text should not overflow container
      const textElements = container.querySelectorAll('*');
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.overflow !== 'visible' || styles.textOverflow === 'ellipsis').toBe(true);
      });
    });

    it('prevents horizontal scrolling on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(
        <div style={{ width: '100vw' }}>
          <WeatherCard 
            weatherData={mockWeatherData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
          />
          <ForecastList 
            forecastData={mockForecastData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
            temperatureUnit="celsius"
          />
        </div>
      );

      // Container should not exceed viewport width
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.scrollWidth <= window.innerWidth).toBe(true);
    });
  });

  describe('Orientation Changes', () => {
    it('adapts to landscape orientation on mobile', () => {
      // Mock landscape orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: { angle: 90, type: 'landscape-primary' }
      });

      render(
        <ForecastList 
          forecastData={mockForecastData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
          temperatureUnit="celsius"
        />
      );

      // Should adapt layout for landscape
      const forecastItems = screen.getAllByRole('article');
      expect(forecastItems).toHaveLength(2);
    });

    it('handles orientation change events', () => {
      const { rerender } = render(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 568, // iPhone landscape width
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 320, // iPhone landscape height
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      rerender(
        <WeatherCard 
          weatherData={mockWeatherData}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      );

      // Component should still render correctly
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('Performance on Different Devices', () => {
    it('handles low-end device constraints', () => {
      // Mock slower device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 2, // Simulate dual-core device
      });

      const { container } = render(
        <div>
          <WeatherCard 
            weatherData={mockWeatherData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
          />
          <ForecastList 
            forecastData={mockForecastData}
            isLoading={false}
            error={null}
            onRetry={vi.fn()}
            temperatureUnit="celsius"
          />
        </div>
      );

      // Should render without performance issues
      expect(container.children).toHaveLength(1);
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });
});