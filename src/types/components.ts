// ============================================================================
// COMPONENT-SPECIFIC TYPE DEFINITIONS
// ============================================================================

import type { 
  CurrentWeather, 
  ForecastData, 
  WeatherError, 
  TemperatureUnit,
  WeatherCondition 
} from './index';

// ============================================================================
// LAYOUT AND CONTAINER COMPONENTS
// ============================================================================

export interface AppProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export interface HeaderProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface MainContentProps {
  className?: string;
  children: React.ReactNode;
}

export interface FooterProps {
  className?: string;
  showVersion?: boolean;
}

// ============================================================================
// WEATHER DISPLAY COMPONENTS
// ============================================================================

export interface WeatherIconProps {
  condition: WeatherCondition;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  alt?: string;
}

export interface TemperatureDisplayProps {
  temperature: number;
  unit: TemperatureUnit;
  size?: 'small' | 'medium' | 'large';
  showUnit?: boolean;
  className?: string;
}

export interface WeatherConditionProps {
  condition: WeatherCondition;
  showDescription?: boolean;
  className?: string;
}

export interface WeatherDetailsProps {
  humidity: number;
  windSpeed: number;
  timestamp: Date;
  className?: string;
}

export interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  temperatureUnit: TemperatureUnit;
  className?: string;
  showDetails?: boolean;
}

// ============================================================================
// FORECAST COMPONENTS
// ============================================================================

export interface ForecastSectionProps {
  forecast: ForecastData[];
  temperatureUnit: TemperatureUnit;
  className?: string;
  maxCards?: number;
}

export interface ForecastCardProps {
  forecast: ForecastData;
  temperatureUnit: TemperatureUnit;
  className?: string;
  compact?: boolean;
}

export interface ForecastListProps {
  forecast: ForecastData[];
  temperatureUnit: TemperatureUnit;
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}

// ============================================================================
// INPUT AND FORM COMPONENTS
// ============================================================================

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export interface SearchButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface ClearButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

// ============================================================================
// TOGGLE AND CONTROL COMPONENTS
// ============================================================================

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface TemperatureToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onChange: (theme: 'light' | 'dark') => void;
  className?: string;
}

// ============================================================================
// FEEDBACK AND STATUS COMPONENTS
// ============================================================================

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  'aria-label'?: string;
}

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  className?: string;
}

export interface ErrorMessageProps {
  error: WeatherError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showRetryButton?: boolean;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

// ============================================================================
// MODAL AND OVERLAY COMPONENTS
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// ============================================================================
// ACCESSIBILITY COMPONENTS
// ============================================================================

export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
  initialFocus?: string; // CSS selector
}

// ============================================================================
// RESPONSIVE AND LAYOUT COMPONENTS
// ============================================================================

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export interface GridProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// ANIMATION AND TRANSITION COMPONENTS
// ============================================================================

export interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export interface SlideTransitionProps {
  show: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

// ============================================================================
// COMPONENT STATE AND EVENT TYPES
// ============================================================================

export interface ComponentState {
  loading: boolean;
  error: WeatherError | null;
  data: any;
}

export interface SearchState {
  query: string;
  loading: boolean;
  error: string | null;
  results: any[];
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event?: React.FormEvent) => void;
export type ClickHandler = (event: React.MouseEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;

// ============================================================================
// COMPONENT COMPOSITION TYPES
// ============================================================================

export interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: React.ComponentType<LoadingSpinnerProps>;
}

export interface WithErrorProps {
  error?: WeatherError | null;
  errorComponent?: React.ComponentType<ErrorMessageProps>;
}

export interface WithRetryProps {
  onRetry?: () => void;
  retryable?: boolean;
}

// Higher-order component props
export interface HOCProps {
  className?: string;
  children?: React.ReactNode;
}

// Render prop types
export interface RenderPropChildren<T> {
  children: (props: T) => React.ReactNode;
}

// ============================================================================
// TESTING HELPER TYPES
// ============================================================================

export interface ComponentTestProps {
  'data-testid'?: string;
  'data-test-loading'?: boolean;
  'data-test-error'?: boolean;
}

export interface MockComponentProps {
  mockData?: any;
  mockError?: WeatherError;
  mockLoading?: boolean;
}