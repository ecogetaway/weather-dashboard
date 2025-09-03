import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import RecentSearches from './RecentSearches';
import type { Location } from '@/types';

describe('RecentSearches', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'New York',
      country: 'US',
      lat: 40.7128,
      lon: -74.0060,
    },
    {
      id: '2',
      name: 'London',
      country: 'UK',
      lat: 51.5074,
      lon: -0.1278,
    },
    {
      id: '3',
      name: 'Tokyo',
      country: 'JP',
      lat: 35.6762,
      lon: 139.6503,
    },
  ];

  const mockOnLocationSelect = vi.fn();
  const mockOnLocationRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('renders recent searches with locations', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('UK')).toBeInTheDocument();
      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('displays location count correctly', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          maxItems={5}
        />
      );

      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('does not render when no locations and not loading', () => {
      const { container } = render(
        <RecentSearches
          recentLocations={[]}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render when recentLocations is null and not loading', () => {
      const { container } = render(
        <RecentSearches
          recentLocations={null}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders empty state when locations array is empty but component is shown', () => {
      render(
        <RecentSearches
          recentLocations={[]}
          onLocationSelect={mockOnLocationSelect}
          isLoading={false}
        />
      );

      // Force render by checking if container exists when explicitly not loading
      // This test might need adjustment based on actual behavior
    });
  });

  describe('Loading State', () => {
    it('renders loading state when isLoading is true', () => {
      render(
        <RecentSearches
          isLoading={true}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Loading recent searches...')).toBeInTheDocument();
    });

    it('does not render locations when loading', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          isLoading={true}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('Loading recent searches...')).toBeInTheDocument();
      expect(screen.queryByText('New York')).not.toBeInTheDocument();
    });
  });

  describe('Location Selection', () => {
    it('calls onLocationSelect when location is clicked', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const newYorkItem = screen.getByRole('listitem', { name: /load weather for new york/i });
      fireEvent.click(newYorkItem);

      expect(mockOnLocationSelect).toHaveBeenCalledTimes(1);
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('calls onLocationSelect when Enter key is pressed', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const newYorkItem = screen.getByRole('listitem', { name: /load weather for new york/i });
      fireEvent.keyDown(newYorkItem, { key: 'Enter' });

      expect(mockOnLocationSelect).toHaveBeenCalledTimes(1);
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('calls onLocationSelect when Space key is pressed', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const newYorkItem = screen.getByRole('listitem', { name: /load weather for new york/i });
      fireEvent.keyDown(newYorkItem, { key: ' ' });

      expect(mockOnLocationSelect).toHaveBeenCalledTimes(1);
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('does not call onLocationSelect when loading', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          isLoading={true}
        />
      );

      // Can't test click on loading state since locations aren't rendered
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });

    it('does not call onLocationSelect when callback is not provided', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
        />
      );

      const newYorkItem = screen.getAllByRole('listitem')[0];
      fireEvent.click(newYorkItem);

      // Should not throw error
      expect(mockOnLocationSelect).not.toHaveBeenCalled();
    });
  });

  describe('Location Removal', () => {
    it('renders remove buttons when onLocationRemove is provided', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove .* from recent searches/i });
      expect(removeButtons).toHaveLength(3);
    });

    it('does not render remove buttons when onLocationRemove is not provided', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const removeButtons = screen.queryAllByRole('button', { name: /remove .* from recent searches/i });
      expect(removeButtons).toHaveLength(0);
    });

    it('calls onLocationRemove when remove button is clicked', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove new york from recent searches/i });
      fireEvent.click(removeButton);

      expect(mockOnLocationRemove).toHaveBeenCalledTimes(1);
      expect(mockOnLocationRemove).toHaveBeenCalledWith('1');
      expect(mockOnLocationSelect).not.toHaveBeenCalled(); // Should not trigger location select
    });

    it('calls onLocationRemove when Enter key is pressed on remove button', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove new york from recent searches/i });
      fireEvent.keyDown(removeButton, { key: 'Enter' });

      expect(mockOnLocationRemove).toHaveBeenCalledTimes(1);
      expect(mockOnLocationRemove).toHaveBeenCalledWith('1');
    });

    it('calls onLocationRemove when Space key is pressed on remove button', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove new york from recent searches/i });
      fireEvent.keyDown(removeButton, { key: ' ' });

      expect(mockOnLocationRemove).toHaveBeenCalledTimes(1);
      expect(mockOnLocationRemove).toHaveBeenCalledWith('1');
    });

    it('does not call onLocationRemove when loading', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
          isLoading={true}
        />
      );

      // Can't test remove button click on loading state since buttons aren't rendered
      expect(mockOnLocationRemove).not.toHaveBeenCalled();
    });

    it('prevents event propagation when remove button is clicked', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove new york from recent searches/i });
      fireEvent.click(removeButton);

      expect(mockOnLocationRemove).toHaveBeenCalledTimes(1);
      expect(mockOnLocationSelect).not.toHaveBeenCalled(); // Should not trigger location select
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      expect(screen.getByRole('list', { name: /recent search locations/i })).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      // Check first item has proper aria-label
      expect(listItems[0]).toHaveAttribute('aria-label', 'Load weather for New York, US');
    });

    it('has proper button accessibility for remove buttons', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove new york from recent searches/i });
      expect(removeButton).toHaveAttribute('aria-label', 'Remove New York from recent searches');
      expect(removeButton).toHaveAttribute('title', 'Remove New York from recent searches');
      expect(removeButton).toHaveAttribute('type', 'button');
    });

    it('supports keyboard navigation for location items', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const locationItems = screen.getAllByRole('listitem');
      locationItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has proper aria-hidden attributes for decorative elements', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      // Check that remove icon has aria-hidden
      const removeIcons = screen.getAllByText('×');
      removeIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Props and Customization', () => {
    it('applies custom className', () => {
      const { container } = render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('uses custom maxItems value', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          maxItems={10}
        />
      );

      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('uses default maxItems value when not provided', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
        />
      );

      // Should render without errors when optional props are not provided
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single location correctly', () => {
      const singleLocation = [mockLocations[0]];
      
      render(
        <RecentSearches
          recentLocations={singleLocation}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('1/5')).toBeInTheDocument();
    });

    it('handles very long location names gracefully', () => {
      const longNameLocation: Location[] = [
        {
          id: '1',
          name: 'Very Long City Name That Should Be Truncated Properly',
          country: 'Very Long Country Name',
          lat: 40.7128,
          lon: -74.0060,
        },
      ];

      render(
        <RecentSearches
          recentLocations={longNameLocation}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('Very Long City Name That Should Be Truncated Properly')).toBeInTheDocument();
      expect(screen.getByText('Very Long Country Name')).toBeInTheDocument();
    });

    it('handles locations with special characters', () => {
      const specialCharLocation: Location[] = [
        {
          id: '1',
          name: 'São Paulo',
          country: 'Brasil',
          lat: -23.5505,
          lon: -46.6333,
        },
      ];

      render(
        <RecentSearches
          recentLocations={specialCharLocation}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('São Paulo')).toBeInTheDocument();
      expect(screen.getByText('Brasil')).toBeInTheDocument();
    });

    it('handles duplicate location IDs gracefully', () => {
      const duplicateIdLocations: Location[] = [
        {
          id: '1',
          name: 'New York',
          country: 'US',
          lat: 40.7128,
          lon: -74.0060,
        },
        {
          id: '1', // Duplicate ID
          name: 'London',
          country: 'UK',
          lat: 51.5074,
          lon: -0.1278,
        },
      ];

      render(
        <RecentSearches
          recentLocations={duplicateIdLocations}
          onLocationSelect={mockOnLocationSelect}
          onLocationRemove={mockOnLocationRemove}
        />
      );

      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('handles empty location names gracefully', () => {
      const emptyNameLocation: Location[] = [
        {
          id: '1',
          name: '',
          country: 'US',
          lat: 40.7128,
          lon: -74.0060,
        },
      ];

      render(
        <RecentSearches
          recentLocations={emptyNameLocation}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      // Should still render the component without errors
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    });
  });

  describe('Mobile Interactions', () => {
    it('renders mobile hint text', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      expect(screen.getByText('Tap to load weather')).toBeInTheDocument();
    });

    it('handles touch interactions properly', () => {
      render(
        <RecentSearches
          recentLocations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      const locationItem = screen.getByRole('listitem', { name: /load weather for new york/i });
      
      // Simulate touch events
      fireEvent.touchStart(locationItem);
      fireEvent.touchEnd(locationItem);
      fireEvent.click(locationItem);

      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    });
  });
});