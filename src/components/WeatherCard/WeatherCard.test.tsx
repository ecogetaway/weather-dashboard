import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import WeatherCard from './WeatherCard';
import type { CurrentWeather, WeatherError } from '@/types';

// Mock the LoadingSpinner component
vi.mock('@/components', () => ({
  LoadingSpinner: ({ size, 'aria-label': ariaLabel }: { size: string; 'aria-label': string }) => (
    <div data-testid="loading-spinner" data-size={size} aria-label={ariaLabel}>
      Loading...
    </div>
  ),
}));

describe('WeatherCard', () => {
  const mockWeatherData: CurrentWeather = {
    location: {
      id: '1',
      name: 'New York',
      country: 'US',
      lat: 40.7128,
      lon: -74.0060,
    },
    temperature: {
      celsius: 22,
      fahrenheit: 72,
    },
    humidity: 65,
    windSpeed: 15,
    description: 'partly cloudy',
    icon: '02d',
    timestamp: new Date('2023-06-15T14:30:00Z'),
  };

  const mockError: WeatherError = {
    type: 'network',
    message: 'Network connection failed',
    retryable: true,
    code: 500,
  };

  const mockRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading spinner when isLoading is true', () => {
      render(<WeatherCard isLoading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'large');
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('aria-label', 'Loading weather data...');
    });

    it('does not render weather data when loading', () => {
      render(<WeatherCard isLoading={true} weatherData={mockWeatherData} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('New York')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when error is provided', () => {
      render(<WeatherCard error={mockError} onRetry={mockRetry} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to load weather data')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('renders retry button when error is retryable and onRetry is provided', () => {
      render(<WeatherCard error={mockError} onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry loading weather data/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Try Again');
    });

    it('calls onRetry when retry button is clicked', () => {
      render(<WeatherCard error={mockError} onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry loading weather data/i });
      fireEvent.click(retryButton);
      
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when error is not retryable', () => {
      const nonRetryableError: WeatherError = {
        ...mockError,
        retryable: false,
      };
      
      render(<WeatherCard error={nonRetryableError} onRetry={mockRetry} />);
      
      expect(screen.queryByRole('button', { name: /retry loading weather data/i })).not.toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<WeatherCard error={mockError} />);
      
      expect(screen.queryByRole('button', { name: /retry loading weather data/i })).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no weather data is provided', () => {
      render(<WeatherCard />);
      
      expect(screen.getByText('🌤️')).toBeInTheDocument();
      expect(screen.getByText('Search for a city to see weather information')).toBeInTheDocument();
    });

    it('renders empty state when weatherData is null', () => {
      render(<WeatherCard weatherData={null} />);
      
      expect(screen.getByText('Search for a city to see weather information')).toBeInTheDocument();
    });
  });

  describe('Weather Data Display', () => {
    it('renders weather data correctly', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('22°')).toBeInTheDocument();
      expect(screen.getByText('partly cloudy')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('15 km/h')).toBeInTheDocument();
    });

    it('displays timestamp correctly', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      // The timestamp should be formatted as "Updated HH:MM AM/PM"
      expect(screen.getByText(/Updated \d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument();
    });

    it('renders weather icon with correct src and alt text', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const icon = screen.getByRole('img', { name: /partly cloudy/i });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', 'https://openweathermap.org/img/wn/02d@2x.png');
      expect(icon).toHaveAttribute('alt', 'partly cloudy');
      expect(icon).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Temperature Toggle', () => {
    it('displays celsius by default', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      expect(screen.getByText('22°')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to fahrenheit/i })).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('toggles to fahrenheit when unit toggle is clicked', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('72°')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to celsius/i })).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('toggles back to celsius when clicked again', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      
      // Toggle to Fahrenheit
      fireEvent.click(toggleButton);
      expect(screen.getByText('72°')).toBeInTheDocument();
      
      // Toggle back to Celsius
      const newToggleButton = screen.getByRole('button', { name: /switch to celsius/i });
      fireEvent.click(newToggleButton);
      expect(screen.getByText('22°')).toBeInTheDocument();
    });

    it('has proper accessibility attributes for temperature toggle', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      expect(toggleButton).toHaveAttribute('title', 'Switch to Fahrenheit');
    });
  });

  describe('Details Section', () => {
    it('shows details by default', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      expect(screen.getByText('Humidity')).toBeInTheDocument();
      expect(screen.getByText('Wind Speed')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('15 km/h')).toBeInTheDocument();
    });

    it('hides details when showDetails is false', () => {
      render(<WeatherCard weatherData={mockWeatherData} showDetails={false} />);
      
      expect(screen.queryByText('Humidity')).not.toBeInTheDocument();
      expect(screen.queryByText('Wind Speed')).not.toBeInTheDocument();
    });

    it('formats wind speed correctly', () => {
      const weatherDataWithDecimalWind = {
        ...mockWeatherData,
        windSpeed: 15.7,
      };
      
      render(<WeatherCard weatherData={weatherDataWithDecimalWind} />);
      
      expect(screen.getByText('16 km/h')).toBeInTheDocument(); // Should round to nearest integer
    });
  });

  describe('Props and Customization', () => {
    it('applies custom className', () => {
      const { container } = render(
        <WeatherCard weatherData={mockWeatherData} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles missing optional props gracefully', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      // Should render without errors when optional props are not provided
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('Temperature Formatting', () => {
    it('rounds temperature to nearest integer', () => {
      const weatherDataWithDecimalTemp = {
        ...mockWeatherData,
        temperature: {
          celsius: 22.7,
          fahrenheit: 72.9,
        },
      };
      
      render(<WeatherCard weatherData={weatherDataWithDecimalTemp} />);
      
      expect(screen.getByText('23°')).toBeInTheDocument(); // Should round 22.7 to 23
      
      // Toggle to Fahrenheit
      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('73°')).toBeInTheDocument(); // Should round 72.9 to 73
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<WeatherCard error={mockError} onRetry={mockRetry} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry loading weather data/i })).toBeInTheDocument();
    });

    it('has proper button accessibility for temperature toggle', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const toggleButton = screen.getByRole('button', { name: /switch to fahrenheit/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Switch to Fahrenheit');
      expect(toggleButton).toHaveAttribute('title', 'Switch to Fahrenheit');
    });

    it('has proper image accessibility', () => {
      render(<WeatherCard weatherData={mockWeatherData} />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('alt', 'partly cloudy');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero temperature correctly', () => {
      const weatherDataWithZeroTemp = {
        ...mockWeatherData,
        temperature: {
          celsius: 0,
          fahrenheit: 32,
        },
      };
      
      render(<WeatherCard weatherData={weatherDataWithZeroTemp} />);
      
      expect(screen.getByText('0°')).toBeInTheDocument();
    });

    it('handles negative temperature correctly', () => {
      const weatherDataWithNegativeTemp = {
        ...mockWeatherData,
        temperature: {
          celsius: -10,
          fahrenheit: 14,
        },
      };
      
      render(<WeatherCard weatherData={weatherDataWithNegativeTemp} />);
      
      expect(screen.getByText('-10°')).toBeInTheDocument();
    });

    it('handles very long city names gracefully', () => {
      const weatherDataWithLongName = {
        ...mockWeatherData,
        location: {
          ...mockWeatherData.location,
          name: 'Very Long City Name That Should Still Display Properly',
        },
      };
      
      render(<WeatherCard weatherData={weatherDataWithLongName} />);
      
      expect(screen.getByText('Very Long City Name That Should Still Display Properly')).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      const weatherDataWithEmptyDescription = {
        ...mockWeatherData,
        description: '',
      };
      
      render(<WeatherCard weatherData={weatherDataWithEmptyDescription} />);
      
      // Should still render the component without errors
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });
});