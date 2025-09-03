// ============================================================================
// CORE WEATHER DATA TYPES (Design Specification)
// ============================================================================

export interface Location {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  location: Location;
  temperature: {
    celsius: number;
    fahrenheit: number;
  };
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  timestamp: Date;
}

export interface ForecastDay {
  date: Date;
  highTemp: number;
  lowTemp: number;
  description: string;
  icon: string;
}

// Legacy support - keeping for backward compatibility
export interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

export interface ForecastData {
  date: Date;
  highTemp: number;
  lowTemp: number;
  condition: WeatherCondition;
  precipitationChance: number;
}

// ============================================================================
// API RESPONSE TYPES (OpenWeatherMap)
// ============================================================================

export interface OpenWeatherCurrentResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt: number;
}

export interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp_max: number;
      temp_min: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
  }>;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export type WeatherErrorType = 
  | 'network' 
  | 'api' 
  | 'validation' 
  | 'not_found' 
  | 'rate_limit' 
  | 'timeout' 
  | 'service_unavailable';

export interface WeatherError {
  type: WeatherErrorType;
  message: string;
  retryable: boolean;
  code?: number;
  details?: string;
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

export interface WeatherDashboardProps {
  className?: string;
}

export interface SearchSectionProps {
  onSearch: (city: string) => void;
  loading: boolean;
  error: string | null;
}

export interface TemperatureToggleProps {
  unit: 'celsius' | 'fahrenheit';
  onChange: (unit: 'celsius' | 'fahrenheit') => void;
  className?: string;
}

export interface ForecastCardProps {
  date: Date;
  highTemp: number;
  lowTemp: number;
  condition: WeatherCondition;
  temperatureUnit: 'celsius' | 'fahrenheit';
}

export interface CurrentWeatherProps {
  weather: CurrentWeather | null;
  temperatureUnit: 'celsius' | 'fahrenheit';
  loading: boolean;
  error: WeatherError | null;
}

export interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: string | null;
  disabled: boolean;
  placeholder?: string;
}

export interface SearchButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface ErrorMessageProps {
  error: WeatherError;
  onRetry?: () => void;
  className?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface WeatherState {
  currentWeather: CurrentWeather | null;
  forecast: ForecastData[];
  loading: boolean;
  error: WeatherError | null;
  temperatureUnit: TemperatureUnit;
  searchQuery: string;
  lastSearchTime: Date | null;
}

export type WeatherActionType = 
  | 'SEARCH_START'
  | 'SEARCH_SUCCESS'
  | 'SEARCH_ERROR'
  | 'TOGGLE_TEMPERATURE_UNIT'
  | 'SET_SEARCH_QUERY'
  | 'CLEAR_ERROR'
  | 'RETRY_SEARCH';

export interface WeatherAction {
  type: WeatherActionType;
  payload?: any;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationRules {
  cityName: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    required: boolean;
  };
  temperature: {
    min: number;
    max: number;
    type: 'number';
  };
  apiResponse: {
    requiredFields: string[];
    timeoutMs: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface WeatherService {
  getCurrentWeather(city: string): Promise<CurrentWeather>;
  getForecast(city: string, days?: number): Promise<ForecastData[]>;
}

export interface CacheConfig {
  currentWeatherTTL: number;
  forecastTTL: number;
  maxCacheSize: number;
  compressionEnabled: boolean;
}

export interface CachedWeatherData {
  data: CurrentWeather | ForecastData[];
  timestamp: Date;
  expiresAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TemperatureConversion {
  celsius: number;
  fahrenheit: number;
}

export interface ApiHealthCheck {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
}

export interface UserPreferences {
  temperatureUnit: TemperatureUnit;
  lastSearchedCity?: string;
  theme?: 'light' | 'dark';
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

export interface PerformanceMetrics {
  apiResponseTimes: number[];
  cacheHitRatio: number;
  errorRates: Record<WeatherErrorType, number>;
  searchFrequency: number;
}

export interface UserMetrics {
  sessionsCount: number;
  averageSessionDuration: number;
  searchesPerSession: number;
  temperatureUnitPreference: TemperatureUnit;
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const WEATHER_ERROR_MESSAGES = {
  NETWORK_ERROR: "Please check your internet connection and try again.",
  CITY_NOT_FOUND: "City not found. Please check the spelling and try again.",
  RATE_LIMIT: "Too many requests. Please wait a moment before searching again.",
  SERVICE_UNAVAILABLE: "Weather service is temporarily unavailable. Please try again later.",
  INVALID_INPUT: "Please enter a valid city name (letters and spaces only).",
  TIMEOUT: "Request timed out. Please try again.",
  GENERIC_ERROR: "Unable to retrieve weather data. Please try again."
} as const;

export const VALIDATION_RULES: ValidationRules = {
  cityName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    required: true,
  },
  temperature: {
    min: -100,
    max: 60,
    type: 'number',
  },
  apiResponse: {
    requiredFields: ['name', 'main.temp', 'weather'],
    timeoutMs: 10000,
  },
};

export const CACHE_CONFIG: CacheConfig = {
  currentWeatherTTL: 10 * 60 * 1000, // 10 minutes
  forecastTTL: 60 * 60 * 1000, // 1 hour
  maxCacheSize: 50, // cities
  compressionEnabled: true,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isWeatherError = (error: unknown): error is WeatherError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'retryable' in error
  );
};

export const isCurrentWeather = (data: unknown): data is CurrentWeather => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'city' in data &&
    'temperature' in data &&
    'condition' in data &&
    'timestamp' in data
  );
};

export const isForecastData = (data: unknown): data is ForecastData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'date' in data &&
    'highTemp' in data &&
    'lowTemp' in data &&
    'condition' in data
  );
};

// ============================================================================
// RE-EXPORTS FROM SPECIALIZED TYPE MODULES
// ============================================================================

// API-related types
export type * from './api';

// Component-related types  
export type * from './components';