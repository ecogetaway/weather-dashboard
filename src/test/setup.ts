import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Global test setup
beforeEach(() => {
  // Reset any mocks or test state
});

// Mock environment variables for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});