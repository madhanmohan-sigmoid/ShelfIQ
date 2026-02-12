import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store, { persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import {
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig, validateConfig } from "./config/authConfig.js";
import { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

// Validate MSAL configuration
validateConfig();

const isDevModeUrl = window.location.host.includes('localhost','dev') 

if (!isDevModeUrl) {
  console.log = () => {}
  console.error = () => {}
  console.debug = () => {}
}

const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect promise
msalInstance
  .handleRedirectPromise()
  .then((response) => {
    if (response) {
      console.log("Redirect response received:", response);
    }
  })
  .catch((error) => {
    console.error("Error handling redirect:", error);
  });

msalInstance
  .initialize()
  .then(() => {
    console.log("MSAL initialized successfully");
    const root = createRoot(document.getElementById("root"));
    root.render(
      <StrictMode>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <MsalProvider instance={msalInstance}>
              <ThemeProvider theme={theme}>
                <Toaster />
                <App />
              </ThemeProvider>
            </MsalProvider>
          </PersistGate>
        </Provider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("MSAL initialization failed:", error);

    // Render app without MSAL if initialization fails
    const root = createRoot(document.getElementById("root"));
    root.render(
      <StrictMode>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider theme={theme}>
              <Toaster />
              <App />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </StrictMode>
    );
  });