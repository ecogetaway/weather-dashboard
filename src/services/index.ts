// Service layer exports
export { WeatherService, weatherService } from './weatherService';
export { StorageService, storageService } from './storageService';

// Re-export types for convenience
export type {
  Location,
  CurrentWeather,
  ForecastDay,
  WeatherError
} from '@/types';