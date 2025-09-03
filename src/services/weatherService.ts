import type { 
  Location, 
  CurrentWeather, 
  ForecastDay, 
  WeatherError,
  WeatherErrorType 
} from '@/types';
import { retryConditions } from '@/hooks/useRetry';

/**
 * Configuration for the weather service
 */
interface WeatherServiceConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Retry configuration for exponential backoff
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Weather service class with API integration, error handling, and retry logic
 */
export class WeatherService {
  private config: WeatherServiceConfig;
  private retryConfig: RetryConfig;

  constructor(config?: Partial<WeatherServiceConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.VITE_WEATHER_API_KEY || '',
      baseUrl: config?.baseUrl || 'https://api.openweathermap.org/data/2.5',
      timeout: config?.timeout || 10000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      ...config
    };

    this.retryConfig = {
      maxRetries: this.config.maxRetries,
      baseDelay: this.config.retryDelay,
      maxDelay: 30000,
      backoffFactor: 2
    };
  }

  /**
   * Search for locations by city name
   */
  async searchLocations(query: string): Promise<Location[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const url = `${this.config.baseUrl}/find?q=${encodeURIComponent(query)}&appid=${this.config.apiKey}&units=metric&cnt=5`;
      const response = await this.makeRequest(url);
      
      if (!response.list || response.list.length === 0) {
        return [];
      }

      return response.list.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        country: item.sys.country,
        lat: item.coord.lat,
        lon: item.coord.lon
      }));
    } catch (error) {
      console.warn('Location search failed:', error);
      return [];
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: Location): Promise<CurrentWeather> {
    const url = `${this.config.baseUrl}/weather?lat=${location.lat}&lon=${location.lon}&appid=${this.config.apiKey}&units=metric`;
    
    try {
      const response = await this.makeRequestWithRetry(url);
      return this.transformCurrentWeatherResponse(response, location);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch current weather');
    }
  }

  /**
   * Get weather forecast for a location
   */
  async getForecast(location: Location, days: number = 5): Promise<ForecastDay[]> {
    const url = `${this.config.baseUrl}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${this.config.apiKey}&units=metric&cnt=${days * 8}`; // 8 forecasts per day (3-hour intervals)
    
    try {
      const response = await this.makeRequestWithRetry(url);
      return this.transformForecastResponse(response);
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch weather forecast');
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await this.createErrorFromResponse(response);
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createWeatherError('timeout', 'Request timed out', true);
      }
      
      throw error;
    }
  }

  /**
   * Make request with exponential backoff retry logic
   */
  private async makeRequestWithRetry(url: string): Promise<any> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.makeRequest(url);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on non-retryable errors
        if (error instanceof Error && 'retryable' in error && !error.retryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
          this.retryConfig.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Transform OpenWeatherMap current weather response to our format
   */
  private transformCurrentWeatherResponse(response: any, location: Location): CurrentWeather {
    const tempCelsius = response.main.temp;
    const tempFahrenheit = (tempCelsius * 9/5) + 32;

    return {
      location,
      temperature: {
        celsius: Math.round(tempCelsius),
        fahrenheit: Math.round(tempFahrenheit)
      },
      humidity: response.main.humidity,
      windSpeed: Math.round(response.wind.speed * 3.6), // Convert m/s to km/h
      description: response.weather[0].description,
      icon: response.weather[0].icon,
      timestamp: new Date()
    };
  }

  /**
   * Transform OpenWeatherMap forecast response to our format
   */
  private transformForecastResponse(response: any): ForecastDay[] {
    const dailyForecasts = new Map<string, any>();

    // Group forecasts by date and find min/max temperatures
    response.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();

      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, {
          date,
          highTemp: item.main.temp_max,
          lowTemp: item.main.temp_min,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          items: []
        });
      }

      const existing = dailyForecasts.get(dateKey);
      existing.highTemp = Math.max(existing.highTemp, item.main.temp_max);
      existing.lowTemp = Math.min(existing.lowTemp, item.main.temp_min);
      existing.items.push(item);
    });

    // Convert to array and take first 5 days
    return Array.from(dailyForecasts.values())
      .slice(0, 5)
      .map(forecast => ({
        date: forecast.date,
        highTemp: Math.round(forecast.highTemp),
        lowTemp: Math.round(forecast.lowTemp),
        description: forecast.description,
        icon: forecast.icon
      }));
  }

  /**
   * Create error from HTTP response
   */
  private async createErrorFromResponse(response: Response): Promise<WeatherError> {
    let errorType: WeatherErrorType = 'api';
    let message = 'API request failed';
    let retryable = response.status >= 500;

    switch (response.status) {
      case 401:
        errorType = 'api';
        message = 'Invalid API key';
        retryable = false;
        break;
      case 404:
        errorType = 'not_found';
        message = 'Location not found';
        retryable = false;
        break;
      case 429:
        errorType = 'rate_limit';
        message = 'Too many requests. Please try again later.';
        retryable = true;
        break;
      case 500:
      case 502:
      case 503:
        errorType = 'service_unavailable';
        message = 'Weather service is temporarily unavailable';
        retryable = true;
        break;
      default:
        errorType = 'api';
        message = `API error: ${response.status}`;
        retryable = response.status >= 500;
    }

    try {
      const errorData = await response.json();
      if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    return this.createWeatherError(errorType, message, retryable, response.status);
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, defaultMessage: string): WeatherError {
    if (error && typeof error === 'object' && 'type' in error) {
      return error as WeatherError;
    }

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return this.createWeatherError('network', 'Network connection failed', true);
      }
      
      return this.createWeatherError('api', error.message || defaultMessage, true);
    }

    return this.createWeatherError('api', defaultMessage, true);
  }

  /**
   * Create a standardized weather error
   */
  private createWeatherError(
    type: WeatherErrorType, 
    message: string, 
    retryable: boolean,
    code?: number
  ): WeatherError {
    return {
      type,
      message,
      retryable,
      code
    };
  }

  /**
   * Check if an error is retryable based on network conditions and error type
   */
  public isRetryableError(error: WeatherError): boolean {
    // Don't retry if offline
    if (!navigator.onLine) {
      return false;
    }

    // Use the retry condition from the hooks
    return retryConditions.networkErrorsWhenOnline(error);
  }

  /**
   * Get retry delay with exponential backoff
   */
  public getRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
      this.retryConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API configuration
   */
  public validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl);
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Make a simple request to check service health
      const url = `${this.config.baseUrl}/weather?q=London&appid=${this.config.apiKey}&units=metric`;
      await this.makeRequest(url);
      
      return {
        healthy: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime
      };
    }
  }
}

// Export a default instance
export const weatherService = new WeatherService();