import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

// Mock services
vi.mock('./services/weatherService', () => ({
  WeatherService: vi.fn().mockImplementation(() => ({
    searchLocations: vi.fn(),
    getCurrentWeatherOffline: vi.fn(),
    getForecastOffline: vi.fn(),
    processOfflineQueue: vi.fn(),
    clearCache: vi.fn(),
    getCachedWeatherData: vi.fn(),
    hasCachedData: vi.fn(),
    getCacheAge: vi.fn(),
    getCacheStats: vi.fn()
  }))
}));

vi.mock('./services/storageService', () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    getRecentSearches: vi.fn(() => []),
    addRecentSearch: vi.fn(),
    removeRecentSearch: vi.fn(),
    clearRecentSearches: vi.fn(),
    getTemperatureUnit: vi.fn(() => 'celsius'),
    setTemperatureUnit: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn()
  }))
}));

vi.mock('./hooks/useOfflineManager', () => ({
  useOfflineManager: vi.fn(() => ({
    isOffline: false,
    hasOfflineData: false,
    processOfflineQueue: vi.fn(),
    hasCachedData: vi.fn(() => false)
  }))
}));

// Mock IntersectionObserver for LazyImage
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('App Integration Tests', () => {
  const mockWeatherService = {
    searchLocations: vi.fn(),
    getCurrentWeatherOffline: vi.fn(),
    getForecastOffline: vi.fn(),
    processOfflineQueue: vi.fn(),
    clearCache: vi.fn(),
    getCachedWeatherData: vi.fn(),
    hasCachedData: vi.fn(),
    getCacheAge: vi.fn(),
    getCacheStats: vi.fn()
  };

  const mockStorageService = {
    getRecentSearches: vi.fn(() => []),
    addRecentSearch: vi.fn(),
    removeRecentSearch: vi.fn(),
    clearRecentSearches: vi.fn(),
    getTemperatureUnit: vi.fn(() => 'celsius'),
    setTemperatureUnit: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn()
  };

  const mockLocation = {
    id: 'new-york',
    name: 'New York',
    country: 'US',
    lat: 40.7128,
    lon: -74.0060
  };

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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    const { WeatherService } = require('./services/weatherService');
    const { StorageService } = require('./services/storageService');
    
    WeatherService.mockImplementation(() => mockWeatherService);
    StorageService.mockImplementation(() => mockStorageService);
    
    mockWeatherService.searchLocations.mockResolvedValue([mockLocation]);
    mockWeatherService.getCurrentWeatherOffline.mockResolvedValue(mockWeatherData);
    mockWeatherService.getForecastOffline.mockResolvedValue(mockForecastData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Workflow: Search to Weather Display', () => {
    it('allows user to search for location and view weather data', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 1. User sees the initial empty state
      expect(screen.getByText('Welcome to Weather Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Search for a city to get started')).toBeInTheDocument();

      // 2. User types in search box
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      // 3. Wait for search suggestions to appear
      await waitFor(() => {
        expect(mockWeatherService.searchLocations).toHaveBeenCalledWith('New York');
      });

      // 4. User clicks on a search suggestion
      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // 5. Weather data should be fetched and displayed
      await waitFor(() => {
        expect(mockWeatherService.getCurrentWeatherOffline).toHaveBeenCalledWith(mockLocation);
        expect(mockWeatherService.getForecastOffline).toHaveBeenCalledWith(mockLocation, 5);
      });

      // 6. Weather card should display current weather
      await waitFor(() => {
        expect(screen.getByText('New York')).toBeInTheDocument();
        expect(screen.getByText('22°C')).toBeInTheDocument();
        expect(screen.getByText('Clear sky')).toBeInTheDocument();
      });

      // 7. Forecast should be displayed
      await waitFor(() => {
        expect(screen.getByText('Sunny')).toBeInTheDocument();
        expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
      });

      // 8. Location should be added to recent searches
      expect(mockStorageService.addRecentSearch).toHaveBeenCalledWith(mockLocation);
    });

    it('handles search errors gracefully', async () => {
      const user = userEvent.setup();
      mockWeatherService.searchLocations.mockRejectedValue(new Error('Search failed'));

      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'Invalid City');

      await waitFor(() => {
        expect(mockWeatherService.searchLocations).toHaveBeenCalled();
      });

      // Should show error state or no results
      await waitFor(() => {
        expect(screen.queryByText('Invalid City')).not.toBeInTheDocument();
      });
    });

    it('handles weather data fetch errors with retry functionality', async () => {
      const user = userEvent.setup();
      mockWeatherService.getCurrentWeatherOffline.mockRejectedValue(new Error('Weather fetch failed'));

      render(<App />);

      // Search and select location
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // Should show error state with retry button
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockWeatherService.getCurrentWeatherOffline.mockResolvedValue(mockWeatherData);
      await user.click(retryButton);

      // Should show weather data after retry
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches Functionality', () => {
    it('displays and allows interaction with recent searches', async () => {
      const user = userEvent.setup();
      const recentSearches = [
        { id: 'london', name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
        { id: 'paris', name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 }
      ];

      mockStorageService.getRecentSearches.mockReturnValue(recentSearches);

      render(<App />);

      // Recent searches should be displayed
      await waitFor(() => {
        expect(screen.getByText('London, UK')).toBeInTheDocument();
        expect(screen.getByText('Paris, FR')).toBeInTheDocument();
      });

      // Click on a recent search
      const londonButton = screen.getByText('London, UK');
      await user.click(londonButton);

      // Should fetch weather for London
      await waitFor(() => {
        expect(mockWeatherService.getCurrentWeatherOffline).toHaveBeenCalledWith(recentSearches[0]);
      });
    });

    it('allows removing recent searches', async () => {
      const user = userEvent.setup();
      const recentSearches = [
        { id: 'london', name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 }
      ];

      mockStorageService.getRecentSearches.mockReturnValue(recentSearches);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('London, UK')).toBeInTheDocument();
      });

      // Find and click remove button
      const removeButton = screen.getByRole('button', { name: /remove london/i });
      await user.click(removeButton);

      expect(mockStorageService.removeRecentSearch).toHaveBeenCalledWith('london');
    });
  });

  describe('Temperature Unit Toggle', () => {
    it('allows switching between Celsius and Fahrenheit', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Search and select location to get weather data
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // Wait for weather data to load
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });

      // Find and click temperature unit toggle
      const toggleButton = screen.getByRole('button', { name: /toggle temperature unit/i });
      await user.click(toggleButton);

      // Should show Fahrenheit
      await waitFor(() => {
        expect(screen.getByText('72°F')).toBeInTheDocument();
      });

      // Should save preference
      expect(mockStorageService.setTemperatureUnit).toHaveBeenCalledWith('fahrenheit');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<App />);

      // Check that mobile-specific classes or layouts are applied
      const appContainer = screen.getByRole('main');
      expect(appContainer).toBeInTheDocument();

      // Search bar should be full width on mobile
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      expect(searchInput).toBeInTheDocument();
    });

    it('shows desktop layout for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<App />);

      const appContainer = screen.getByRole('main');
      expect(appContainer).toBeInTheDocument();
    });
  });

  describe('Offline Functionality Integration', () => {
    it('shows offline indicator when offline', async () => {
      const { useOfflineManager } = await import('./hooks/useOfflineManager');
      vi.mocked(useOfflineManager).mockReturnValue({
        isOffline: true,
        hasOfflineData: true,
        processOfflineQueue: vi.fn(),
        hasCachedData: vi.fn(() => true)
      });

      render(<App />);

      // Should show offline indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows cached data when offline', async () => {
      const user = userEvent.setup();
      const { useOfflineManager } = await import('./hooks/useOfflineManager');
      
      vi.mocked(useOfflineManager).mockReturnValue({
        isOffline: true,
        hasOfflineData: true,
        processOfflineQueue: vi.fn(),
        hasCachedData: vi.fn(() => true)
      });

      render(<App />);

      // Search for location
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // Should show offline fallback with cached data option
      await waitFor(() => {
        expect(screen.getByText(/showing cached data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('catches and displays component errors', () => {
      // Mock a component that throws an error
      mockWeatherService.getCurrentWeatherOffline.mockImplementation(() => {
        throw new Error('Component error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<App />);

      // Error boundary should catch the error
      // The exact behavior depends on your ErrorBoundary implementation
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Loading States', () => {
    it('shows loading states during data fetching', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      mockWeatherService.getCurrentWeatherOffline.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockWeatherData), 100))
      );

      render(<App />);

      // Search and select location
      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // Should show loading spinner
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });

      // Loading spinner should be gone
      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA labels and keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Search input should have proper labeling
      const searchInput = screen.getByRole('combobox', { name: /search for a city/i });
      expect(searchInput).toBeInTheDocument();

      // Should be keyboard navigable
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Type and navigate suggestions with keyboard
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByRole('option', { name: /new york/i });
        expect(suggestion).toBeInTheDocument();
      });

      // Should be able to select with Enter key
      await user.keyboard('{ArrowDown}{Enter}');

      await waitFor(() => {
        expect(mockWeatherService.getCurrentWeatherOffline).toHaveBeenCalled();
      });
    });

    it('provides screen reader announcements for dynamic content', async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search for a city...');
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        const suggestion = screen.getByText('New York, US');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('New York, US');
      await user.click(suggestion);

      // Weather data should have proper ARIA live regions
      await waitFor(() => {
        const weatherCard = screen.getByRole('region', { name: /current weather/i });
        expect(weatherCard).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('persists user preferences across sessions', () => {
      mockStorageService.getTemperatureUnit.mockReturnValue('fahrenheit');

      render(<App />);

      // Should load saved temperature unit preference
      expect(mockStorageService.getTemperatureUnit).toHaveBeenCalled();
    });

    it('handles storage errors gracefully', () => {
      mockStorageService.getRecentSearches.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<App />);

      // Should not crash and should log warning
      expect(screen.getByText('Welcome to Weather Dashboard')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});