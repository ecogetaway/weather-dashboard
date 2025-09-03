/**
 * Lazy-loaded components for performance optimization
 * Components are loaded only when needed to reduce initial bundle size
 */

import React, { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Import types
import type { WeatherCardProps } from './WeatherCard/WeatherCard';
import type { ForecastListProps } from './ForecastList/ForecastList';
import type { RecentSearchesProps } from './RecentSearches/RecentSearches';
import type { SearchBarProps } from './SearchBar/SearchBar';

// Lazy load components with retry mechanism
const LazyWeatherCard = lazy(() => 
  import('./WeatherCard/WeatherCard').catch(error => {
    console.error('Failed to load WeatherCard:', error);
    // Return a fallback component
    return {
      default: () => (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          Failed to load Weather Card component
        </div>
      )
    };
  })
);

const LazyForecastList = lazy(() => 
  import('./ForecastList/ForecastList').catch(error => {
    console.error('Failed to load ForecastList:', error);
    return {
      default: () => (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          Failed to load Forecast List component
        </div>
      )
    };
  })
);

const LazyRecentSearches = lazy(() => 
  import('./RecentSearches/RecentSearches').catch(error => {
    console.error('Failed to load RecentSearches:', error);
    return {
      default: () => (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626' }}>
          Failed to load Recent Searches component
        </div>
      )
    };
  })
);

const LazySearchBar = lazy(() => 
  import('./SearchBar/SearchBar').catch(error => {
    console.error('Failed to load SearchBar:', error);
    return {
      default: () => (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626' }}>
          Failed to load Search Bar component
        </div>
      )
    };
  })
);

// Wrapper components with Suspense and error boundaries
export const WeatherCard = (props: WeatherCardProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        padding: '2rem'
      }}>
        <LoadingSpinner size="medium" aria-label="Loading weather card..." />
      </div>
    }>
      <LazyWeatherCard {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const ForecastList = (props: ForecastListProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '150px',
        padding: '2rem'
      }}>
        <LoadingSpinner size="medium" aria-label="Loading forecast list..." />
      </div>
    }>
      <LazyForecastList {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const RecentSearches = (props: RecentSearchesProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100px',
        padding: '1rem'
      }}>
        <LoadingSpinner size="small" aria-label="Loading recent searches..." />
      </div>
    }>
      <LazyRecentSearches {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const SearchBar = (props: SearchBarProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60px',
        padding: '1rem'
      }}>
        <LoadingSpinner size="small" aria-label="Loading search bar..." />
      </div>
    }>
      <LazySearchBar {...props} />
    </Suspense>
  </ErrorBoundary>
);

// Set display names for better debugging
WeatherCard.displayName = 'LazyWeatherCard';
ForecastList.displayName = 'LazyForecastList';
RecentSearches.displayName = 'LazyRecentSearches';
SearchBar.displayName = 'LazySearchBar';

// Export ErrorBoundary for convenience
export { default as ErrorBoundary } from './ErrorBoundary';

// Export types for TypeScript support
export type { WeatherCardProps, ForecastListProps, RecentSearchesProps, SearchBarProps };