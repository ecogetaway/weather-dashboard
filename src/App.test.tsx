import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import '@testing-library/jest-dom';
import App from './App';
import { WeatherService } from '@/services/weatherService';
import { StorageService } from '@/services/storageService';
import type { Location, CurrentWeather, ForecastDay } from '@/types';

// Mock the services
vi.mock('@/services/weatherService');
vi.mock('@/services/storageService');

// Mock the components to focus on integration logic
vi.mock('@/components', () => ({
  SearchBar: ({ onLocationSelect, value, onChange, placeholder, className }: any) => (
    <div data-testid="search-bar" className={className}>
      <input
        data-testid="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        data-testid="search-select-button"
        onClick={() => onLocationSelect({
          id: '1',
          name: 'New York',
          country: 'US',
          lat: 40.7128,
          lon: -74.006,
        })}
      >
        Select New York
      </button>
    </div>
  ),
  WeatherCard: ({ weatherData, isLoading, error, onRetry, className }: any) => (
    <div data-testid="weather-card" className={className}>
      {isLoading && <div data-testid="weather-loading">Loading weather...</div>}
      {error && (
        <div data-testid="weather-error">
          <span>{error.message}</span>
          {onRetry && <button data-testid="weather-retry" onClick={onRetry}>Retry</button>}
        </div>
      )}
      {weatherData && (
        <div data-testid="weather-data">
          <span data-testid="weather-location">{weatherData.location.name}</span>
          <span data-testid="weather-temp">{weatherData.temperature.celsius}°C</span>
        </div>
      )}
    </div>
  ),
  ForecastList: ({ forecastData, isLoading, error, onRetry, temperatureUnit, className }: any) => (
    <div data-testid="forecast-list" className={className}>
      {isLoading && <div data-testid="forecast-loading">Loading forecast...</div>}
      {error && (
        <div data-testid="forecast-error">
          <span>{error.message}</span>
          {onRetry && <button data-testid="forecast-retry" onClick={onRetry}>Retry</button>}
        </div>
      )}
      {forecastData && (
        <div data-testid="forecast-data">
          <span data-testid="forecast-unit">{temperatureUnit}</span>
          <span data-testid="forecast-count">{forecastData.length} days</span>
        </div>
      )}
    </div>
  ),
  RecentSearches: ({ recentLocations, onLocationSelect, onLocationRemove, isLoading, className }: any) => (
    <div data-testid="recent-searches" className={className}>
      {isLoading && <div data-testid="recent-loading">Loading recent...</div>}
      {recentLocations && recentLocations.map((location: Location) => (
        <div key={location.id} data-testid={`recent-item-${location.id}`}>
          <button onClick={() => onLocationSelect(location)}>{location.name}</button>
          {onLocationRemove && (
            <button onClick={() => onLocationRemove(location.id)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  ),
}));

describe('App Integration', () => {
  const mockWeatherService = WeatherService as Mock;
  const mockStorageService = StorageService as Mock;

  const mockLocation: Location = {
    id: '1',
    name: 'New York',
    country: 'US',
    lat: 40.7128,
    lon: -74.006,
  };

  const mockWeatherData: CurrentWeather = {
    location: mockLocation,
    temperature: {
      celsius: 22,
      fahrenheit: 72,
    },
    humidity: 65,
    windSpeed: 15,
    description: 'sunny',
    icon: '01d',
    timestamp: new Date('2023-06-15T14:30:00Z'),
  };

  const mockForecastData: ForecastDay[] = [
    {
      date: new Date('2023-06-15T00:00:00Z'),
      highTemp: 25,
      lowTemp: 18,
      description: 'sunny',
      icon: '01d',
    },
    {
      date: new Date('2023-06-16T00:00:00Z'),
      highTemp: 22,
      lowTemp: 15,
      description: 'cloudy',
      icon: '02d',
    },
  ];

  let mockWeatherServiceInstance: any;
  let mockStorageServiceInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock service instances
    mockWeatherServiceInstance = {
      getCurrentWeather: vi.fn(),
      getForecast: vi.fn(),
    };

    mockStorageServiceInstance = {
      getRecentSearches: vi.fn().mockReturnValue([]),
      addRecentSearch: vi.fn(),
      removeRecentSearch: vi.fn(),
      getTemperatureUnit: vi.fn().mockReturnValue('celsius'),
      setTemperatureUnit: vi.fn(),
    };

    mockWeatherService.mockImplementation(() => mockWeatherServiceInstance);
    mockStorageService.mockImplementation(() => mockStorageServiceInstance);
  });

  describe('Initial Render', () => {
    it('renders the main app structure', () => {
      render(<App />);

      expect(screen.getByText('Weather Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Get current weather and forecasts for any location')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Weather Dashboard')).toBeInTheDocument();
    });

    it('loads recent searches on initialization', () => {
      render(<App />);

      expect(mockStorageServiceInstance.getRecentSearches).toHaveBeenCalledTimes(1);
      expect(mockStorageServiceInstance.getTemperatureUnit).toHaveBeenCalledTimes(1);
    });

    it('displays recent searches when available', () => {
      mockStorageServiceInstance.getRecentSearches.mockReturnValue([mockLocation]);

      render(<App />);

      expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
      expect(screen.getByTestId('recent-item-1')).toBeInTheDocument();
    });

    it('shows empty state when no recent searches', () => {
      render(<App />);

      expect(screen.getByText('Welcome to Weather Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Search for any city to get current weather conditions and a 5-day forecast.')).toBeInTheDocument();
    });
  });

  describe('Weather Data Fetching', () => {
    it('fetches weather data when location is selected', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(mockWeatherServiceInstance.getCurrentWeather).toHaveBeenCalledWith('40.7128,-74.006');
        expect(mockWeatherServiceInstance.getForecast).toHaveBeenCalledWith('40.7128,-74.006', 5);
      });
    });

    it('displays weather data when successfully fetched', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('weather-data')).toBeInTheDocument();
        expect(screen.getByTestId('weather-location')).toHaveTextContent('New York');
        expect(screen.getByTestId('weather-temp')).toHaveTextContent('22°C');
      });
    });

    it('displays forecast data when successfully fetched', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-data')).toBeInTheDocument();
        expect(screen.getByTestId('forecast-unit')).toHaveTextContent('celsius');
        expect(screen.getByTestId('forecast-count')).toHaveTextContent('2 days');
      });
    });

    it('adds location to recent searches when weather fetch succeeds', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(mockStorageServiceInstance.addRecentSearch).toHaveBeenCalledWith(mockLocation);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays weather error when fetch fails', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockRejectedValue(new Error('Network error'));
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('weather-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load current weather data')).toBeInTheDocument();
      });
    });

    it('displays forecast error when fetch fails', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockRejectedValue(new Error('Network error'));

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load forecast data')).toBeInTheDocument();
      });
    });

    it('handles retry for weather data', async () => {
      mockWeatherServiceInstance.getCurrentWeather
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('weather-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('weather-retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('weather-data')).toBeInTheDocument();
      });

      expect(mockWeatherServiceInstance.getCurrentWeather).toHaveBeenCalledTimes(2);
    });

    it('handles retry for forecast data', async () => {
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('forecast-retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-data')).toBeInTheDocument();
      });

      expect(mockWeatherServiceInstance.getForecast).toHaveBeenCalledTimes(2);
    });
  });

  describe('Recent Searches Management', () => {
    it('handles location selection from recent searches', async () => {
      mockStorageServiceInstance.getRecentSearches.mockReturnValue([mockLocation]);
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const recentButton = screen.getByText('New York');
      fireEvent.click(recentButton);

      await waitFor(() => {
        expect(mockWeatherServiceInstance.getCurrentWeather).toHaveBeenCalledWith('40.7128,-74.006');
      });
    });

    it('handles location removal from recent searches', () => {
      mockStorageServiceInstance.getRecentSearches
        .mockReturnValueOnce([mockLocation])
        .mockReturnValueOnce([]);

      render(<App />);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      expect(mockStorageServiceInstance.removeRecentSearch).toHaveBeenCalledWith('1');
    });
  });

  describe('Temperature Unit Management', () => {
    it('loads temperature unit preference on initialization', () => {
      render(<App />);

      expect(mockStorageServiceInstance.getTemperatureUnit).toHaveBeenCalledTimes(1);
    });

    it('toggles temperature unit when footer button is clicked', () => {
      render(<App />);

      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      fireEvent.click(toggleButton);

      expect(mockStorageServiceInstance.setTemperatureUnit).toHaveBeenCalledWith('fahrenheit');
    });

    it('passes temperature unit to forecast component', async () => {
      mockStorageServiceInstance.getTemperatureUnit.mockReturnValue('fahrenheit');
      mockWeatherServiceInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      mockWeatherServiceInstance.getForecast.mockResolvedValue(mockForecastData);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-unit')).toHaveTextContent('fahrenheit');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading states during data fetching', async () => {
      let resolveWeather: (value: any) => void;
      let resolveForecast: (value: any) => void;

      const weatherPromise = new Promise(resolve => { resolveWeather = resolve; });
      const forecastPromise = new Promise(resolve => { resolveForecast = resolve; });

      mockWeatherServiceInstance.getCurrentWeather.mockReturnValue(weatherPromise);
      mockWeatherServiceInstance.getForecast.mockReturnValue(forecastPromise);

      render(<App />);

      const selectButton = screen.getByTestId('search-select-button');
      fireEvent.click(selectButton);

      // Should show loading states
      expect(screen.getByTestId('weather-loading')).toBeInTheDocument();
      expect(screen.getByTestId('forecast-loading')).toBeInTheDocument();

      // Resolve promises
      resolveWeather!(mockWeatherData);
      resolveForecast!(mockForecastData);

      await waitFor(() => {
        expect(screen.queryByTestId('weather-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('forecast-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Input Management', () => {
    it('manages search query state', () => {
      render(<App />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'London' } });

      expect(searchInput).toHaveValue('London');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<App />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Weather Dashboard');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Welcome to Weather Dashboard');
    });

    it('has proper button accessibility for temperature toggle', () => {
      render(<App />);

      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('has proper main landmark', () => {
      render(<App />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});