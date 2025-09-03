import { describe, it, expect } from 'vitest';
import { formatTemperature, formatWindSpeed, formatDate, getWeatherIcon, isValidCoordinates } from './index';

describe('Utility Functions', () => {
  describe('formatTemperature', () => {
    it('formats temperature in Celsius by default', () => {
      expect(formatTemperature(20.7)).toBe('21°C');
    });

    it('formats temperature in Fahrenheit when specified', () => {
      expect(formatTemperature(68.5, 'F')).toBe('69°F');
    });

    it('rounds temperature to nearest integer', () => {
      expect(formatTemperature(20.4)).toBe('20°C');
      expect(formatTemperature(20.6)).toBe('21°C');
    });

    it('handles negative temperatures', () => {
      expect(formatTemperature(-5.3)).toBe('-5°C');
    });

    it('handles zero temperature', () => {
      expect(formatTemperature(0)).toBe('0°C');
    });

    it('handles very large temperatures', () => {
      expect(formatTemperature(999.9)).toBe('1000°C');
    });

    it('handles very small temperatures', () => {
      expect(formatTemperature(-999.9)).toBe('-1000°C');
    });

    it('handles decimal edge cases', () => {
      expect(formatTemperature(20.5)).toBe('21°C'); // Rounds up at .5
      expect(formatTemperature(-20.5)).toBe('-20°C'); // Rounds towards zero for negative
    });
  });

  describe('formatWindSpeed', () => {
    it('formats wind speed in km/h by default', () => {
      expect(formatWindSpeed(15.7)).toBe('16 kmh');
    });

    it('formats wind speed in mph when specified', () => {
      expect(formatWindSpeed(10.3, 'mph')).toBe('10 mph');
    });

    it('rounds wind speed to nearest integer', () => {
      expect(formatWindSpeed(12.4)).toBe('12 kmh');
      expect(formatWindSpeed(12.6)).toBe('13 kmh');
    });

    it('handles zero wind speed', () => {
      expect(formatWindSpeed(0)).toBe('0 kmh');
    });

    it('handles very high wind speeds', () => {
      expect(formatWindSpeed(200.7)).toBe('201 kmh');
    });

    it('handles decimal edge cases', () => {
      expect(formatWindSpeed(12.5)).toBe('13 kmh'); // Rounds up at .5
    });

    it('handles negative wind speeds (edge case)', () => {
      expect(formatWindSpeed(-5)).toBe('-5 kmh');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2023-12-25');
      expect(result).toMatch(/Mon, Dec 25/);
    });

    it('handles ISO date strings', () => {
      const result = formatDate('2023-01-01T00:00:00Z');
      expect(result).toMatch(/Sun, Jan 1/);
    });

    it('handles different date formats', () => {
      const result1 = formatDate('2023-06-15');
      expect(result1).toMatch(/Thu, Jun 15/);
      
      const result2 = formatDate('2023-12-31T23:59:59Z');
      expect(result2).toMatch(/Sun, Dec 31/);
    });

    it('handles leap year dates', () => {
      const result = formatDate('2024-02-29');
      expect(result).toMatch(/Thu, Feb 29/);
    });

    it('handles edge case dates', () => {
      const result1 = formatDate('2023-01-01');
      expect(result1).toMatch(/Sun, Jan 1/);
      
      const result2 = formatDate('2023-12-31');
      expect(result2).toMatch(/Sun, Dec 31/);
    });

    it('handles invalid date strings gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toMatch(/Invalid Date/);
    });
  });

  describe('getWeatherIcon', () => {
    it('returns correct icon path', () => {
      expect(getWeatherIcon('01d')).toBe('/icons/01d.svg');
    });

    it('handles different icon codes', () => {
      expect(getWeatherIcon('10n')).toBe('/icons/10n.svg');
      expect(getWeatherIcon('04d')).toBe('/icons/04d.svg');
    });

    it('handles all standard weather icon codes', () => {
      const iconCodes = ['01d', '01n', '02d', '02n', '03d', '03n', '04d', '04n', 
                        '09d', '09n', '10d', '10n', '11d', '11n', '13d', '13n', '50d', '50n'];
      
      iconCodes.forEach(code => {
        expect(getWeatherIcon(code)).toBe(`/icons/${code}.svg`);
      });
    });

    it('handles empty string', () => {
      expect(getWeatherIcon('')).toBe('/icons/.svg');
    });

    it('handles special characters in icon code', () => {
      expect(getWeatherIcon('test-icon')).toBe('/icons/test-icon.svg');
    });
  });

  describe('isValidCoordinates', () => {
    it('returns true for valid coordinates', () => {
      expect(isValidCoordinates(40.7128, -74.0060)).toBe(true);
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates(90, 180)).toBe(true);
      expect(isValidCoordinates(-90, -180)).toBe(true);
    });

    it('returns false for invalid latitude', () => {
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(-91, 0)).toBe(false);
      expect(isValidCoordinates(90.1, 0)).toBe(false);
      expect(isValidCoordinates(-90.1, 0)).toBe(false);
    });

    it('returns false for invalid longitude', () => {
      expect(isValidCoordinates(0, 181)).toBe(false);
      expect(isValidCoordinates(0, -181)).toBe(false);
      expect(isValidCoordinates(0, 180.1)).toBe(false);
      expect(isValidCoordinates(0, -180.1)).toBe(false);
    });

    it('returns false for both invalid coordinates', () => {
      expect(isValidCoordinates(100, 200)).toBe(false);
      expect(isValidCoordinates(-100, -200)).toBe(false);
    });

    it('handles edge cases at boundaries', () => {
      expect(isValidCoordinates(89.9999, 179.9999)).toBe(true);
      expect(isValidCoordinates(-89.9999, -179.9999)).toBe(true);
      expect(isValidCoordinates(90.0001, 0)).toBe(false);
      expect(isValidCoordinates(0, 180.0001)).toBe(false);
    });

    it('handles NaN and Infinity values', () => {
      expect(isValidCoordinates(NaN, 0)).toBe(false);
      expect(isValidCoordinates(0, NaN)).toBe(false);
      expect(isValidCoordinates(Infinity, 0)).toBe(false);
      expect(isValidCoordinates(0, Infinity)).toBe(false);
      expect(isValidCoordinates(-Infinity, 0)).toBe(false);
      expect(isValidCoordinates(0, -Infinity)).toBe(false);
    });

    it('handles very precise decimal coordinates', () => {
      expect(isValidCoordinates(40.712776, -74.005974)).toBe(true);
      expect(isValidCoordinates(-33.868820, 151.209290)).toBe(true);
    });
  });
});