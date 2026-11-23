import '@testing-library/jest-dom';

// Polyfill crypto.randomUUID if not in jsdom
if (!globalThis.crypto) {
  globalThis.crypto = {};
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).substring(2, 9);
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
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

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
