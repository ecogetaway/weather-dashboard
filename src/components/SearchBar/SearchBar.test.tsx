import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from './SearchBar';
import type { Location } from '@/types';

// Mock scrollIntoView for tests
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true
});

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'London',
    country: 'GB',
    lat: 51.5074,
    lon: -0.1278
  },
  {
    id: '2',
    name: 'Paris',
    country: 'FR',
    lat: 48.8566,
    lon: 2.3522
  },
  {
    id: '3',
    name: 'New York',
    country: 'US',
    lat: 40.7128,
    lon: -74.0060
  }
];

describe('SearchBar', () => {
  const mockOnLocationSelect = vi.fn();
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSearch.mockResolvedValue(mockLocations);
  });

  it('should render with default props', () => {
    render(<SearchBar onLocationSelect={mockOnLocationSelect} />);
    
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search for a city...');
    expect(input).toHaveAttribute('aria-label', 'Search for a city');
  });

  it('should render with custom placeholder', () => {
    const customPlaceholder = 'Enter city name...';
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        placeholder={customPlaceholder}
      />
    );
    
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('placeholder', customPlaceholder);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        disabled={true}
      />
    );
    
    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar onLocationSelect={mockOnLocationSelect} />);
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'London');
    
    expect(input).toHaveValue('London');
  });

  it('should call onSearch with debounced input', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={100}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'Lon');
    
    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Should call after debounce delay
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('Lon');
    }, { timeout: 200 });
  });

  it('should not search for queries shorter than minimum length', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        minSearchLength={3}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'Lo');
    
    await waitFor(() => {
      expect(mockOnSearch).not.toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it('should display suggestions when search returns results', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'Lon');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('GB')).toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation in suggestions', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    // Navigate down
    await user.keyboard('{ArrowDown}');
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
    
    // Navigate down again
    await user.keyboard('{ArrowDown}');
    const secondOption = screen.getAllByRole('option')[1];
    expect(secondOption).toHaveAttribute('aria-selected', 'true');
    
    // Navigate up
    await user.keyboard('{ArrowUp}');
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  it('should select location on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    // Navigate to first option and select
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    expect(input).toHaveValue('London');
  });

  it('should select location on click', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const londonOption = screen.getByText('London');
    await user.click(londonOption);
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
    expect(input).toHaveValue('London');
  });

  it('should close suggestions on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should show loading spinner during search', async () => {
    const user = userEvent.setup();
    const slowSearch = vi.fn(() => 
      new Promise(resolve => setTimeout(() => resolve(mockLocations), 200))
    );
    
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={slowSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByLabelText('Searching...')).toBeInTheDocument();
    });
  });

  it('should display error message on search failure', async () => {
    const user = userEvent.setup();
    const failingSearch = vi.fn().mockRejectedValue(new Error('Search failed'));
    
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={failingSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to search locations')).toBeInTheDocument();
    });
  });

  it('should show clear button when input has value', async () => {
    const user = userEvent.setup();
    render(<SearchBar onLocationSelect={mockOnLocationSelect} />);
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onLocationSelect={mockOnLocationSelect} />);
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    expect(input).toHaveValue('');
  });

  it('should not show clear button when disabled', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        disabled={true}
      />
    );
    
    const input = screen.getByRole('combobox');
    // Can't type when disabled, so set value directly for test
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchBar onLocationSelect={mockOnLocationSelect} />);
    
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  it('should update aria-expanded when suggestions are shown', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar 
        onLocationSelect={mockOnLocationSelect}
        onSearch={mockOnSearch}
        debounceMs={50}
      />
    );
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });
});