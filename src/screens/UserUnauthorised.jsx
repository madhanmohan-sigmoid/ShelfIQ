import React from "react";
import { useMsal } from "@azure/msal-react";
import { azureLogin } from "../api/api";
import { persistor } from "../redux/store";
import AuthPageLayout from "../components/auth/AuthPageLayout";
import AuthCard from "../components/auth/AuthCard";

export default function UserUnauthorised() {
  const { instance } = useMsal();

  const handleRetry = async () => {
    try {
      // Clear persisted Redux state
      await persistor.purge();

      azureLogin();

      // Original MSAL logic (commented out)
      // instance.logoutRedirect({
      //   postLogoutRedirectUri: "http://localhost:3000",
      // });
    } catch (error) {
      console.error("Login redirect error:", error);
    }
  };

  return (
    <AuthPageLayout>
      <AuthCard
        title="Access Restricted"
        subtitle=""
        description={
          <>
            Your account does not have necessary permissions to access this tool.
            <br />
            Please reach out to Ace Support team, admin or your manager to obtain access.
          </>
        }
        buttonText="LOGIN WITH PingID"
        onButtonClick={handleRetry}
      />
    </AuthPageLayout>
  );
}
