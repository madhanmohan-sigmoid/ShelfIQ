import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder (required by react-router-dom)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock import.meta.env for Vite
if (typeof global.import === 'undefined') {
  global.import = {};
}
if (typeof global.import.meta === 'undefined') {
  global.import.meta = {};
}
if (typeof global.import.meta.env === 'undefined') {
  global.import.meta.env = {
    VITE_REACT_APP_BACKEND: 'http://localhost:3000'
  };
}

// Suppress various console warnings/errors in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

console.error = (...args) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  
  // Suppress act() warnings for Redux dispatches in component tests
  if (
    message.includes('Warning: An update to') &&
    message.includes('inside a test was not wrapped in act(...)')
  ) {
    return;
  }
  
  // Suppress expected API test errors (Network errors, etc.)
  if (
    message.includes('checkUserAuthorization failed') ||
    message.includes('Logout API call failed')
  ) {
    return;
  }
  
  // Suppress prop type warnings for MUI components
  if (
    message.includes('Warning: Failed prop type') ||
    message.includes('ForwardRef(SvgIcon)')
  ) {
    return;
  }
  
  // Suppress function component ref warnings
  if (
    message.includes('Function components cannot be given refs') ||
    message.includes('Did you mean to use React.forwardRef()')
  ) {
    return;
  }
  
  // Suppress ag-grid module warnings
  if (
    message.includes('AG Grid: since') ||
    message.includes('ag-grid-community')
  ) {
    return;
  }
  
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  
  // Suppress Redux selector memoization warnings (performance warnings, not errors)
  if (
    message.includes('Selector') &&
    message.includes('returned a different result') &&
    message.includes('should be memoized')
  ) {
    return;
  }
  
  // Suppress expected test warnings
  if (
    message.includes('No planogram found for id:')
  ) {
    return;
  }
  
  originalWarn.call(console, ...args);
};

// Suppress console.log in tests (optional - comment out if you want to see logs)
console.log = (...args) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  const argString = JSON.stringify(args);
  
  // Suppress debug logs
  if (
    message.includes('✅') ||
    message.includes('🗑️') ||
    message.includes('🚀') ||
    message.includes('🔐') ||
    message.includes('Transformed planogram') ||
    message.includes('add true') ||
    message.includes('view true') ||
    message.includes('edit false') ||
    message.includes('bay {') ||
    message.includes('newly added product') ||
    message.includes('Processing') ||
    message.includes('Found removed product') ||
    message.includes('Found repositioned product') ||
    message.includes('Planogram Payload:') ||
    argString.includes('tpnb')
  ) {
    return;
  }
  
  originalLog.call(console, ...args);
};

