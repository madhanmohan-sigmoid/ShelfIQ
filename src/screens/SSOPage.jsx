import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import bgImage from "../assets/Bg.png";
import LeftLogo from "../assets/KenvueLeftSide.png";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { checkUserAuthorization } from "../api/api";
//import UserUnauthorised from "./UserUnauthorised";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/reducers/authSlice";

export default function SSOPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts, inProgress } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false); // NEW

  // Debug logs
  useEffect(() => {
    console.log("Current URL:", window.location.href);
    console.log("Hash:", window.location.hash);
    console.log("Search params:", window.location.search);
    console.log("Location pathname:", location.pathname);
  }, [location]);

  // Handle redirect response
  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        if (response) {
          setLoading(true);
          await handleSuccessfulLogin(response.account);
        }
        setRedirectChecked(true);
      } catch (error) {
        console.error("Error handling redirect:", error);
        setError("Failed to complete authentication. Please try again.");
        setRedirectChecked(true);
      }
    };

    handleRedirectResponse();
  }, [instance, navigate]);

  // Extra redirect check
  useEffect(() => {
    if (redirectChecked && !loading && accounts.length === 0) {
      const timer = setTimeout(async () => {
        try {
          const response = await instance.handleRedirectPromise();
          if (response) {
            setLoading(true);
            await handleSuccessfulLogin(response.account);
          }
        } catch (error) {
          console.error("Error on second redirect check:", error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [redirectChecked, loading, accounts.length, instance, navigate]);

  // Silent token acquisition if already logged in
  useEffect(() => {
    if (accounts.length > 0 && inProgress === "none") {
      handleSilentTokenAcquisition();
    }
  }, [accounts, inProgress, instance, navigate]);

  const handleSilentTokenAcquisition = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      await handleSuccessfulLogin(accounts[0]);
    } catch (error) {
      console.error("Silent auth error:", error);

      if (error.name === "InteractionRequiredAuthError") {
        await handlePopupLogin();
      } else {
        setError("Authentication failed. Please try logging in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (account) => {
    try {
      const graphResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      });
      console.log(graphResponse);

      if (!graphResponse.accessToken) {
        throw new Error("No access token received");
      }

      const name = account.name || "";
      const email = account.username || "";

      const authResponse = await checkUserAuthorization(name, email);

      if (authResponse.authorized === 200) {
        // Authorized
        localStorage.setItem("accessToken", graphResponse.accessToken);
        localStorage.setItem("userAccount", JSON.stringify(account));

        dispatch(
          loginSuccess({
            user: { name, email },
            token: graphResponse.accessToken,
            access_groups: authResponse.data?.data || null,
          })
        );

        navigate("/region", { replace: true });
      } else {
        // Unauthorized

        setUnauthorized(true);
        localStorage.clear();
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
      setError("Failed to get user information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopupLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await instance.loginPopup(loginRequest);
      await handleSuccessfulLogin(response.account);
    } catch (error) {
      console.error("Popup login error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    try {
      setLoading(true);
      setError(null);

      // New logic: Redirect to backend auth endpoint
      // azureLogin();

      // Original logic (commented out)
      instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login redirect error:", error);
      setError("Failed to initiate login. Please try again.");
      setLoading(false);
    }
  };

  console.log("error",error)
  console.log("unauthorized", unauthorized)

  return (
    <div
      className="fullscreen-bg"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        width: "100vw",
        display: "flex",
      }}
    >
      {/* Left Side */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "50%",
          height: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: 4,
            borderRadius: 4,
            width: 400,
            height: 300,
            textAlign: "center",
            backgroundColor: "transparent",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "none",
          }}
        >
          <Box
            component="img"
            src={LeftLogo}
            alt="Kenvue Left Side"
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </Paper>
      </Box>

      {/* Vertical Divider */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "2px",
          height: "60%",
          backgroundColor: "rgba(128, 128, 128, 0.6)",
          zIndex: 3,
        }}
      />

      {/* Right Side */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "50%",
          height: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <Paper
            elevation={8}
            sx={{
              padding: 5,
              borderRadius: 4,
              width: 400,
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h5" fontWeight={600} mb={1}>
              Login to ACE
            </Typography>
            <Typography variant="body1" mb={2}>
              Welcome to ACE!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              The easy way to organize shelves <br />
              so everything looks good and sells even better.
            </Typography>
            <Button
              onClick={handleLogin}
              fullWidth
              sx={{
                textTransform: "none",
                backgroundColor: "#00B097",
                color: "white",
                borderRadius: "500px",
                py: 1.5,
                fontWeight: "600",
                "&:hover": { backgroundColor: "#00947F" },
              }}
            >
              LOGIN WITH PingID
            </Button>
          </Paper>
        )}
      </Box>
    </div>
  );
}
