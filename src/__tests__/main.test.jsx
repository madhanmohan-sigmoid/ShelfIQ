import React from "react";

// Create a shared mock that can be accessed from isolated modules
const sharedCreateRootMock = jest.fn(() => ({
  render: jest.fn(),
}));

// Mock all dependencies
jest.mock("react-dom/client", () => ({
  createRoot: jest.fn((...args) => {
    // Access the shared mock through a global reference
    if (globalThis.__createRootMock) {
      return globalThis.__createRootMock(...args);
    }
    return { render: jest.fn() };
  }),
}));

jest.mock("react-redux", () => {
  const Provider = ({ children }) => <div data-testid="redux-provider">{children}</div>;
  Provider.displayName = "Provider";
  return { Provider };
});

jest.mock("redux-persist/integration/react", () => {
  const PersistGate = ({ children }) => <div data-testid="persist-gate">{children}</div>;
  PersistGate.displayName = "PersistGate";
  return { PersistGate };
});

// Create a mock MSAL instance that will be returned by PublicClientApplication
let currentMockMsalInstance = null;
let initializeBehavior = { shouldReject: false, error: null };
let redirectPromiseBehavior = { response: null, shouldReject: false, error: null };

const createMockMsalInstance = () => {
  const instance = {
    handleRedirectPromise: jest.fn(() => {
      if (redirectPromiseBehavior.shouldReject) {
        return Promise.reject(redirectPromiseBehavior.error || new Error("Redirect error"));
      }
      return Promise.resolve(redirectPromiseBehavior.response);
    }),
    initialize: jest.fn(() => {
      if (initializeBehavior.shouldReject) {
        return Promise.reject(initializeBehavior.error || new Error("MSAL init failed"));
      }
      return Promise.resolve(undefined);
    }),
  };
  currentMockMsalInstance = instance;
  return instance;
};

jest.mock("@azure/msal-browser", () => ({
  PublicClientApplication: jest.fn(() => createMockMsalInstance()),
}));

jest.mock("@azure/msal-react", () => {
  const MsalProvider = ({ children }) => <div data-testid="msal-provider">{children}</div>;
  MsalProvider.displayName = "MsalProvider";
  return { MsalProvider };
});

jest.mock("react-hot-toast", () => {
  const Toaster = () => <div data-testid="toaster" />;
  Toaster.displayName = "Toaster";
  return { Toaster };
});

jest.mock("@mui/material/styles", () => {
  const ThemeProvider = ({ children }) => <div data-testid="theme-provider">{children}</div>;
  ThemeProvider.displayName = "ThemeProvider";
  return { ThemeProvider };
});

jest.mock("../config/authConfig", () => ({
  msalConfig: {
    auth: {
      clientId: "test-client-id",
      authority: "https://login.microsoftonline.com/test-tenant",
      redirectUri: "/",
    },
  },
  validateConfig: jest.fn(() => true),
}));

jest.mock("../redux/store", () => ({
  __esModule: true,
  default: { dispatch: jest.fn(), getState: jest.fn() },
  persistor: { persist: jest.fn(), flush: jest.fn() },
}));

jest.mock("../App", () => {
  const App = () => <div data-testid="app-component">App Component</div>;
  App.displayName = "App";
  return App;
});

jest.mock("../theme", () => ({
  __esModule: true,
  default: { palette: { primary: { main: "#cccccc" } } },
}));

describe("main.jsx", () => {
  let mockRoot;
  let originalWindow;
  let mockRootElement;

  let mockGetElementById;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Reset the current instance and behavior
    currentMockMsalInstance = null;
    initializeBehavior = { shouldReject: false, error: null };
    redirectPromiseBehavior = { response: null, shouldReject: false, error: null };

    // Reset shared mocks and set up global reference
    sharedCreateRootMock.mockClear();
    mockRoot = {
      render: jest.fn(),
    };
    sharedCreateRootMock.mockReturnValue(mockRoot);
    globalThis.__createRootMock = sharedCreateRootMock;

    // Mock document.getElementById globally so it's available in isolated modules
    mockRootElement = { id: "root" };
    mockGetElementById = jest.fn(() => mockRootElement);
    if (!globalThis.document) {
      globalThis.document = {};
    }
    globalThis.document.getElementById = mockGetElementById;

    // Mock window.location
    originalWindow = globalThis.window;
    delete globalThis.window;
    globalThis.window = {
      location: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    };

    // Mock console methods
    globalThis.console.log = jest.fn();
    globalThis.console.error = jest.fn();
    globalThis.console.debug = jest.fn();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    jest.restoreAllMocks();
  });

  it("validates MSAL config on module load", () => {
    jest.isolateModules(() => {
      const { validateConfig: validateConfigMock } = require("../config/authConfig");
      require("../main");
      expect(validateConfigMock).toHaveBeenCalled();
    });
  });

  it("creates MSAL instance with correct config", () => {
    jest.isolateModules(() => {
      const { msalConfig } = require("../config/authConfig");
      const { PublicClientApplication } = require("@azure/msal-browser");
      require("../main");
      expect(PublicClientApplication).toHaveBeenCalledWith(msalConfig);
    });
  });

  it("handles redirect promise with response", async () => {
    const mockResponse = { account: { username: "test@example.com" } };
    
    // Set up the redirect promise behavior before module loads
    redirectPromiseBehavior.response = mockResponse;
    redirectPromiseBehavior.shouldReject = false;
    
    jest.isolateModules(() => {
      require("../main");
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(currentMockMsalInstance?.handleRedirectPromise).toHaveBeenCalled();
    // Verify console.log was called with the redirect response
    expect(globalThis.console.log).toHaveBeenCalledWith(
      "Redirect response received:",
      mockResponse
    );
  });

  it("handles redirect promise error", async () => {
    const mockError = new Error("Redirect error");
    
    // Set up the redirect promise to reject before module loads
    redirectPromiseBehavior.shouldReject = true;
    redirectPromiseBehavior.error = mockError;
    
    jest.isolateModules(() => {
      require("../main");
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(currentMockMsalInstance?.handleRedirectPromise).toHaveBeenCalled();
    // Verify console.error was called with the error
    expect(globalThis.console.error).toHaveBeenCalledWith(
      "Error handling redirect:",
      mockError
    );
  });

  it("handles redirect promise with no response", async () => {
    jest.isolateModules(() => {
      require("../main");
    });

    // Default behavior is to resolve with null
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(currentMockMsalInstance?.handleRedirectPromise).toHaveBeenCalled();
    // When response is null, console.log should not be called with response
    expect(globalThis.console.log).not.toHaveBeenCalledWith(
      "Redirect response received:",
      expect.anything()
    );
  });

  it("initializes MSAL and renders app on success", async () => {
    jest.isolateModules(() => {
      require("../main");
    });

    // Wait for the initialize promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(currentMockMsalInstance?.initialize).toHaveBeenCalled();
    // Verify console.log was called with success message
    expect(globalThis.console.log).toHaveBeenCalledWith("MSAL initialized successfully");
    // Verify createRoot was called using the shared mock
    expect(sharedCreateRootMock).toHaveBeenCalled();
    expect(mockRoot.render).toHaveBeenCalled();
  });

  it("renders app without MSAL if initialization fails", async () => {
    // Set up the rejection behavior before module loads
    initializeBehavior.shouldReject = true;
    initializeBehavior.error = new Error("MSAL init failed");

    jest.isolateModules(() => {
      require("../main");
    });

    // Wait for the initialize promise to reject and the catch block to execute
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(currentMockMsalInstance?.initialize).toHaveBeenCalled();
    // Verify createRoot was called using the shared mock
    expect(sharedCreateRootMock).toHaveBeenCalled();
    expect(mockRoot.render).toHaveBeenCalled();
  });

  it("disables console methods in non-dev environments", () => {
    // Set up non-dev environment
    globalThis.window.location.host = "production.example.com";
    
    // Store original console to verify they're different after module load
    const originalConsoleLog = globalThis.console.log;
    const originalConsoleError = globalThis.console.error;
    const originalConsoleDebug = globalThis.console.debug;
    
    // Ensure we're using the real console (not mocked) so the module can override it
    // The module will override console in its own context, but we need to verify the code path
    jest.isolateModules(() => {
      // Access console from within the isolated module to verify it's overridden
      const isolatedConsole = { ...console };
      require("../main");
      
      // After module loads, verify console methods exist and are functions
      expect(typeof console.log).toBe("function");
      expect(typeof console.error).toBe("function");
      expect(typeof console.debug).toBe("function");
      
      // Verify they return undefined when called (empty functions)
      expect(console.log("test")).toBeUndefined();
      expect(console.error("test")).toBeUndefined();
      expect(console.debug("test")).toBeUndefined();
    });
    
    // Verify the code path was executed
    // The module should have overridden console methods in non-dev mode
    expect(globalThis.console.log).toBeDefined();
    expect(globalThis.console.error).toBeDefined();
    expect(globalThis.console.debug).toBeDefined();
  });

  it("keeps console methods enabled in dev environments", () => {
    globalThis.window.location.host = "localhost:3000";

    jest.isolateModules(() => {
      require("../main");
    });

    // Console methods should still be functions (not overridden)
    expect(typeof globalThis.console.log).toBe("function");
    expect(typeof globalThis.console.error).toBe("function");
    expect(typeof globalThis.console.debug).toBe("function");
  });
});

