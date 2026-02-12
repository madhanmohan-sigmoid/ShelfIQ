import { loginRequest } from "../config/authConfig";

// Save token after login
export const handleLogin = async (msalInstance) => {
  try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);

    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: loginResponse.account,
    });

    const accessToken = tokenResponse.accessToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userAccount", JSON.stringify(loginResponse.account));

    return accessToken;
  } catch (loginError) {
    console.error("Login or token acquisition failed:", loginError);
    throw loginError;
  }
};

// Get token for API calls
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

// Get user account information
export const getUserAccount = () => {
  const accountStr = localStorage.getItem("userAccount");
  return accountStr ? JSON.parse(accountStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAccessToken();
  return !!token;
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userAccount");
};

// Refresh token silently
export const refreshToken = async (msalInstance) => {
  try {
    const account = getUserAccount();
    if (!account) {
      throw new Error("No user account found");
    }

    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });

    localStorage.setItem("accessToken", response.accessToken);
    return response.accessToken;
  } catch (refreshError) {
    console.error("Token refresh failed:", refreshError);
    clearAuthData();
    throw refreshError;
  }
};

// Handle token expiration
export const handleTokenExpiration = async (msalInstance) => {
  try {
    const newToken = await refreshToken(msalInstance);
    return newToken;
  } catch {
    // Redirect to login if refresh fails
    window.location.href = "/";
    return null;
  }
};

// Logout user
export const logout = async (msalInstance) => {
  try {
    // Clear local storage
    clearAuthData();

    // Logout from MSAL
    if (msalInstance) {
      await msalInstance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin + "/",
      });
    } else {
      // Fallback if no MSAL instance
      window.location.href = "/";
    }
  } catch (logoutError) {
    console.error("Logout failed:", logoutError);
    // Force redirect even if MSAL logout fails
    clearAuthData();
    window.location.href = "/";
  }
};