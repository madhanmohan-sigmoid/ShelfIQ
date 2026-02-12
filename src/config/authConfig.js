// src/authConfig.js

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID ,
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_MSAL_AUTHORITY}`,
    redirectUri:
      import.meta.env.VITE_MSAL_REDIRECT_URI || "/",
    postLogoutRedirectUri: globalThis.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
      },
      logLevel: 3, // Info level
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  prompt: "select_account",
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// Check if required environment variables are set
export const validateConfig = () => {
  const requiredVars = [
    "VITE_MSAL_CLIENT_ID",
    "VITE_MSAL_AUTHORITY",
    "VITE_MSAL_REDIRECT_URI",
  ];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  return missingVars.length === 0;
};