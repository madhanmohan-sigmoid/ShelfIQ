import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

const mockConfigureStore = jest.fn();
const mockPersistReducer = jest.fn();
const mockPersistStore = jest.fn();
const mockLoggerMiddleware = 'mockLoggerMiddleware';

jest.mock('@reduxjs/toolkit', () => ({
  configureStore: mockConfigureStore,
}));

jest.mock('redux-persist', () => ({
  persistReducer: mockPersistReducer,
  persistStore: mockPersistStore,
}));

jest.mock('redux-persist/lib/storage', () => 'mockStorage');

jest.mock('redux-logger', () => jest.fn(() => mockLoggerMiddleware));

jest.mock('../../reducers/authSlice', () => 'authReducer');
jest.mock('../../reducers/dataTemplateSlice', () => 'masterDataReducer');
jest.mock('../../reducers/productDataSlice', () => 'productDataReducer');
jest.mock('../../reducers/planogramVisualizerSlice', () => 'planogramVisualizerReducer');
jest.mock('../../reducers/regionRetailerSlice', () => 'regionRetailerReducer');
jest.mock('../../reducers/dashboardSlice', () => 'dashboardReducer');
jest.mock('../../reducers/scorecardSlice', () => 'scorecardReducer');
jest.mock('../../reducers/myPlanogramSlice', () => 'myPlanogramReducer');

const originalWindow = global.window;
const originalGlobal = global;

const setWindowHost = (host) => {
  // Create a new JSDOM instance with the desired URL
  const url = host.startsWith('http') ? host : `https://${host}`;
  const dom = new JSDOM('', { url });
  
  // Replace global window (which includes location)
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Also update globalThis
  globalThis.window = dom.window;
};

const loadStoreModule = () => {
  let module;
  jest.isolateModules(() => {
    module = require('../index.js');
  });
  return module;
};

describe('redux store configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    mockConfigureStore.mockReset();
    mockPersistReducer.mockReset();
    mockPersistStore.mockReset();
    mockConfigureStore.mockReturnValue({ dispatch: jest.fn(), getState: jest.fn() });
    mockPersistReducer.mockImplementation(
      (config, reducer) => `persisted-${config.key}-${String(reducer)}`
    );
    mockPersistStore.mockReturnValue('mockPersistor');
    setWindowHost('localhost:3000');
  });

  afterAll(() => {
    // Restore original window
    global.window = originalWindow;
    global.document = originalWindow.document;
    globalThis.window = originalWindow;
  });

  it('persists slices and attaches logger middleware when running on localhost', () => {
    const { default: store, persistor } = loadStoreModule();

    expect(store).toEqual(mockConfigureStore.mock.results[0].value);
    expect(persistor).toBe('mockPersistor');
    expect(mockPersistStore).toHaveBeenCalledWith(mockConfigureStore.mock.results[0].value);

    expect(mockPersistReducer).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'regionRetailer',
        whitelist: ['selectedRegion', 'selectedRetailer', 'selectedCategory', 'selectedCountry'],
        storage: 'mockStorage',
      }),
      'regionRetailerReducer'
    );

    expect(mockPersistReducer).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'auth',
        whitelist: ['user', 'isAuthenticated'],
        storage: 'mockStorage',
      }),
      'authReducer'
    );

    const configArg = mockConfigureStore.mock.calls[0][0];
    expect(configArg.reducer).toMatchObject({
      auth: 'persisted-auth-authReducer',
      masterData: 'masterDataReducer',
      productData: 'productDataReducer',
      planogramVisualizerData: 'planogramVisualizerReducer',
      regionRetailer: 'persisted-regionRetailer-regionRetailerReducer',
      dashboard: 'dashboardReducer',
      scorecardData: 'scorecardReducer',
      myPlanogram: 'myPlanogramReducer',
    });

    const fakeDefaultMiddleware = jest.fn().mockReturnValue(['base']);
    const middlewareResult = configArg.middleware(fakeDefaultMiddleware);

    expect(fakeDefaultMiddleware).toHaveBeenCalledWith({
      serializableCheck: { ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'] },
    });
    expect(middlewareResult).toEqual(['base', mockLoggerMiddleware]);
  });

  it('omits logger middleware when not running on localhost', () => {
    setWindowHost('app.production.com');
    const { default: store } = loadStoreModule();

    expect(store).toEqual(mockConfigureStore.mock.results[0].value);

    const configArg = mockConfigureStore.mock.calls[0][0];
    const fakeDefaultMiddleware = jest.fn().mockReturnValue(['base']);
    const middlewareResult = configArg.middleware(fakeDefaultMiddleware);

    expect(fakeDefaultMiddleware).toHaveBeenCalledWith({
      serializableCheck: { ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'] },
    });
    expect(middlewareResult).toEqual(['base']);
  });
});

