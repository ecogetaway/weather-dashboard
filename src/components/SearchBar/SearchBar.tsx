import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Location } from '@/types';
import { LoadingSpinner } from '@/components';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  onLocationSelect: (location: Location) => void;
  onSearch?: (query: string) => Promise<Location[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
  minSearchLength?: number;
}

/**
 * SearchBar component with autocomplete functionality
 * Features debounced search, keyboard navigation, and mobile-first design
 */
const SearchBar: React.FC<SearchBarProps> = ({
  onLocationSelect,
  onSearch,
  placeholder = 'Search for a city...',
  disabled = false,
  className = '',
  debounceMs = 300,
  minSearchLength = 2
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!onSearch || searchQuery.length < minSearchLength) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await onSearch(searchQuery);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        setError('Failed to search locations');
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch, minSearchLength]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, debounceMs);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setQuery(location.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onLocationSelect(location);
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow for suggestion clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
    disabled ? styles.inputDisabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          aria-label="Search for a city"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="small" aria-label="Searching..." />
          </div>
        )}
        
        {/* Clear button */}
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className={styles.suggestions}
          role="listbox"
          aria-label="Location suggestions"
        >
          {suggestions.map((location, index) => (
            <li
              key={location.id}
              className={`${styles.suggestion} ${
                index === selectedIndex ? styles.suggestionSelected : ''
              }`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleLocationSelect(location)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={styles.suggestionContent}>
                <span className={styles.locationName}>{location.name}</span>
                <span className={styles.locationCountry}>{location.country}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;