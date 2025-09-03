import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import ForecastList from './ForecastList';
import type { ForecastDay, WeatherError } from '@/types';

// Mock the LoadingSpinner component
vi.mock('@/components', () => ({
  LoadingSpinner: ({ size, 'aria-label': ariaLabel }: { size: string; 'aria-label': string }) => (
    <div data-testid="loading-spinner" data-size={size} aria-label={ariaLabel}>
      Loading...
    </div>
  ),
}));

describe('ForecastList', () => {
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
      description: 'partly cloudy',
      icon: '02d',
    },
    {
      date: new Date('2023-06-17T00:00:00Z'),
      highTemp: 20,
      lowTemp: 12,
      description: 'rainy',
      icon: '10d',
    },
    {
      date: new Date('2023-06-18T00:00:00Z'),
      highTemp: 28,
      lowTemp: 20,
      description: 'clear sky',
      icon: '01d',
    },
    {
      date: new Date('2023-06-19T00:00:00Z'),
      highTemp: 26,
      lowTemp: 19,
      description: 'few clouds',
      icon: '02d',
    },
  ];

  const mockError: WeatherError = {
    type: 'network',
    message: 'Failed to fetch forecast data',
    retryable: true,
    code: 500,
  };

  const mockRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date for consistent testing
    vi.setSystemTime(new Date('2023-06-15T12:00:00Z'));
  });

  describe('Loading State', () => {
    it('renders loading spinner when isLoading is true', () => {
      render(<ForecastList isLoading={true} />);
      
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading forecast...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'medium');
    });

    it('does not render forecast data when loading', () => {
      render(<ForecastList isLoading={true} forecastData={mockForecastData} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when error is provided', () => {
      render(<ForecastList error={mockError} onRetry={mockRetry} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to load forecast')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch forecast data')).toBeInTheDocument();
    });

    it('renders retry button when error is retryable and onRetry is provided', () => {
      render(<ForecastList error={mockError} onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry loading forecast data/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Try Again');
    });

    it('calls onRetry when retry button is clicked', () => {
      render(<ForecastList error={mockError} onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry loading forecast data/i });
      fireEvent.click(retryButton);
      
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when error is not retryable', () => {
      const nonRetryableError: WeatherError = {
        ...mockError,
        retryable: false,
      };
      
      render(<ForecastList error={nonRetryableError} onRetry={mockRetry} />);
      
      expect(screen.queryByRole('button', { name: /retry loading forecast data/i })).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no forecast data is provided', () => {
      render(<ForecastList />);
      
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText('No forecast data available')).toBeInTheDocument();
    });

    it('renders empty state when forecastData is null', () => {
      render(<ForecastList forecastData={null} />);
      
      expect(screen.getByText('No forecast data available')).toBeInTheDocument();
    });

    it('renders empty state when forecastData is empty array', () => {
      render(<ForecastList forecastData={[]} />);
      
      expect(screen.getByText('No forecast data available')).toBeInTheDocument();
    });
  });

  describe('Forecast Data Display', () => {
    it('renders forecast data correctly', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('sunny')).toBeInTheDocument();
      expect(screen.getByText('partly cloudy')).toBeInTheDocument();
    });

    it('displays temperatures correctly in celsius by default', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByText('25°')).toBeInTheDocument(); // High temp
      expect(screen.getByText('18°')).toBeInTheDocument(); // Low temp
      expect(screen.getByText('°C')).toBeInTheDocument(); // Unit indicator
    });

    it('displays temperatures correctly in fahrenheit', () => {
      render(<ForecastList forecastData={mockForecastData} temperatureUnit="fahrenheit" />);
      
      expect(screen.getByText('77°')).toBeInTheDocument(); // 25°C = 77°F
      expect(screen.getByText('64°')).toBeInTheDocument(); // 18°C = 64°F
      expect(screen.getByText('°F')).toBeInTheDocument(); // Unit indicator
    });

    it('renders weather icons with correct src and alt text', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const icons = screen.getAllByRole('img');
      expect(icons).toHaveLength(5);
      
      const sunnyIcon = screen.getByRole('img', { name: /sunny/i });
      expect(sunnyIcon).toHaveAttribute('src', 'https://openweathermap.org/img/wn/01d@2x.png');
      expect(sunnyIcon).toHaveAttribute('alt', 'sunny');
      expect(sunnyIcon).toHaveAttribute('loading', 'lazy');
    });

    it('formats dates correctly for today and tomorrow', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('formats future dates correctly', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      // Should show Today and Tomorrow, plus 3 other formatted dates
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      
      // Check that we have 5 forecast items total
      const forecastItems = screen.getAllByRole('listitem');
      expect(forecastItems).toHaveLength(5);
    });
  });

  describe('Temperature Conversion', () => {
    it('converts celsius to fahrenheit correctly', () => {
      render(<ForecastList forecastData={mockForecastData} temperatureUnit="fahrenheit" />);
      
      // 25°C should be 77°F, 18°C should be 64°F
      expect(screen.getByText('77°')).toBeInTheDocument();
      expect(screen.getByText('64°')).toBeInTheDocument();
    });

    it('rounds temperatures to nearest integer', () => {
      const forecastWithDecimalTemps: ForecastDay[] = [
        {
          date: new Date('2023-06-15T00:00:00Z'),
          highTemp: 25.7,
          lowTemp: 18.3,
          description: 'sunny',
          icon: '01d',
        },
      ];
      
      render(<ForecastList forecastData={forecastWithDecimalTemps} />);
      
      expect(screen.getByText('26°')).toBeInTheDocument(); // 25.7 rounded to 26
      expect(screen.getByText('18°')).toBeInTheDocument(); // 18.3 rounded to 18
    });

    it('handles zero and negative temperatures correctly', () => {
      const forecastWithColdTemps: ForecastDay[] = [
        {
          date: new Date('2023-06-15T00:00:00Z'),
          highTemp: 0,
          lowTemp: -5,
          description: 'snow',
          icon: '13d',
        },
      ];
      
      render(<ForecastList forecastData={forecastWithColdTemps} />);
      
      expect(screen.getByText('0°')).toBeInTheDocument();
      expect(screen.getByText('-5°')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByRole('list', { name: /5-day weather forecast/i })).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
      
      // Check first item has proper aria-label
      expect(listItems[0]).toHaveAttribute('aria-label');
    });

    it('has proper button accessibility for retry', () => {
      render(<ForecastList error={mockError} onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry loading forecast data/i });
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading forecast data');
    });

    it('has proper image accessibility', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const icons = screen.getAllByRole('img');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('alt');
      });
    });

    it('supports keyboard navigation', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const container = screen.getByRole('list');
      expect(container).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Touch and Swipe Functionality', () => {
    it('renders swipe indicator on mobile', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByText('Swipe to see more')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('handles mouse events for drag functionality', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const container = screen.getByRole('list');
      
      // Test mouse down event
      fireEvent.mouseDown(container, { clientX: 100 });
      
      // Test mouse move event
      fireEvent.mouseMove(container, { clientX: 150 });
      
      // Test mouse up event
      fireEvent.mouseUp(container);
      
      // Should not throw errors
      expect(container).toBeInTheDocument();
    });

    it('handles touch events for swipe functionality', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const container = screen.getByRole('list');
      
      // Test touch start event
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100 }]
      });
      
      // Test touch move event
      fireEvent.touchMove(container, {
        touches: [{ clientX: 150 }]
      });
      
      // Test touch end event
      fireEvent.touchEnd(container);
      
      // Should not throw errors
      expect(container).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      const container = screen.getByRole('list');
      
      // Test arrow key navigation
      fireEvent.keyDown(container, { key: 'ArrowRight' });
      fireEvent.keyDown(container, { key: 'ArrowLeft' });
      
      // Should not throw errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Props and Customization', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ForecastList forecastData={mockForecastData} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles missing optional props gracefully', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      // Should render without errors when optional props are not provided
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
    });

    it('uses celsius as default temperature unit', () => {
      render(<ForecastList forecastData={mockForecastData} />);
      
      expect(screen.getByText('°C')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single day forecast', () => {
      const singleDayForecast = [mockForecastData[0]];
      
      render(<ForecastList forecastData={singleDayForecast} />);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('sunny')).toBeInTheDocument();
    });

    it('handles very long weather descriptions', () => {
      const forecastWithLongDescription: ForecastDay[] = [
        {
          date: new Date('2023-06-15T00:00:00Z'),
          highTemp: 25,
          lowTemp: 18,
          description: 'very long weather description that should still display properly',
          icon: '01d',
        },
      ];
      
      render(<ForecastList forecastData={forecastWithLongDescription} />);
      
      expect(screen.getByText('very long weather description that should still display properly')).toBeInTheDocument();
    });

    it('handles missing weather icons gracefully', () => {
      const forecastWithEmptyIcon: ForecastDay[] = [
        {
          date: new Date('2023-06-15T00:00:00Z'),
          highTemp: 25,
          lowTemp: 18,
          description: 'sunny',
          icon: '',
        },
      ];
      
      render(<ForecastList forecastData={forecastWithEmptyIcon} />);
      
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', 'https://openweathermap.org/img/wn/@2x.png');
    });

    it('handles extreme temperatures', () => {
      const forecastWithExtremeTemps: ForecastDay[] = [
        {
          date: new Date('2023-06-15T00:00:00Z'),
          highTemp: 50,
          lowTemp: -40,
          description: 'extreme weather',
          icon: '01d',
        },
      ];
      
      render(<ForecastList forecastData={forecastWithExtremeTemps} />);
      
      expect(screen.getByText('50°')).toBeInTheDocument();
      expect(screen.getByText('-40°')).toBeInTheDocument();
    });
  });
});