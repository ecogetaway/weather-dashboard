// ============================================================================
// API-SPECIFIC TYPE DEFINITIONS
// ============================================================================

import type { CurrentWeather, ForecastData, WeatherError } from './index';

// ============================================================================
// HTTP CLIENT TYPES
// ============================================================================

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// API PROVIDER INTERFACES
// ============================================================================

export interface WeatherApiProvider {
  name: string;
  getCurrentWeather(city: string, apiKey: string): Promise<CurrentWeather>;
  getForecast(city: string, apiKey: string, days?: number): Promise<ForecastData[]>;
  validateApiKey(apiKey: string): Promise<boolean>;
  getRateLimit(): Promise<RateLimitInfo>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

// ============================================================================
// OPENWEATHERMAP SPECIFIC TYPES
// ============================================================================

export interface OpenWeatherMapConfig {
  apiKey: string;
  baseUrl: string;
  units: 'metric' | 'imperial' | 'kelvin';
  language: string;
}

export interface OpenWeatherMapError {
  cod: number;
  message: string;
}

// Extended response types with additional fields
export interface OpenWeatherCurrentResponseExtended {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface OpenWeatherForecastResponseExtended {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// ============================================================================
// API RESPONSE TRANSFORMATION TYPES
// ============================================================================

export interface ApiResponseTransformer<TInput, TOutput> {
  transform(input: TInput): TOutput;
  validate(input: unknown): input is TInput;
}

export interface WeatherDataTransformer {
  transformCurrentWeather(response: OpenWeatherCurrentResponseExtended): CurrentWeather;
  transformForecast(response: OpenWeatherForecastResponseExtended): ForecastData[];
  transformError(error: unknown): WeatherError;
}

// ============================================================================
// CACHING TYPES
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  cleanup(): Promise<number>; // Returns number of entries removed
}

// ============================================================================
// REQUEST QUEUE TYPES
// ============================================================================

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestOptions;
  priority: number;
  timestamp: Date;
  retryCount: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface RequestQueue {
  add<T>(request: QueuedRequest): Promise<T>;
  process(): Promise<void>;
  clear(): void;
  size(): number;
  isPaused(): boolean;
  pause(): void;
  resume(): void;
}

// ============================================================================
// API HEALTH MONITORING TYPES
// ============================================================================

export interface ApiHealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  consecutiveFailures: number;
}

export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: WeatherError;
  timestamp: Date;
}

export interface ApiMonitor {
  checkHealth(provider: string): Promise<HealthCheckResult>;
  getStatus(provider: string): ApiHealthStatus;
  getAllStatuses(): ApiHealthStatus[];
  startMonitoring(): void;
  stopMonitoring(): void;
}

// ============================================================================
// FALLBACK AND RETRY TYPES
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: WeatherError['type'][];
}

export interface FallbackProvider {
  primary: WeatherApiProvider;
  fallbacks: WeatherApiProvider[];
  switchThreshold: number; // Number of failures before switching
  cooldownPeriod: number; // Time to wait before retrying primary
}

// ============================================================================
// MCP INTEGRATION TYPES
// ============================================================================

export interface McpSecretConfig {
  apiKeyName: string;
  fallbackApiKeyName?: string;
  refreshInterval?: number;
}

export interface McpWeatherService {
  getApiKey(): Promise<string>;
  refreshApiKey(): Promise<void>;
  validateConnection(): Promise<boolean>;
}