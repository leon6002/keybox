"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    google: any;
    handleCredentialResponse: (response: any) => void;
  }
}

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleSignInProps {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
}

export default function GoogleSignIn({
  onSuccess,
  onError,
  buttonText,
  theme = "outline",
  size = "large",
  shape = "rectangular",
  width = 300,
}: GoogleSignInProps) {
  const { t, ready } = useTranslation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Google script is already loaded
    if (window.google && window.google.accounts) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 100);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.accounts) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Identity Services script");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Additional effect to handle cases where Google script loads before DOM is ready
  useEffect(() => {
    if (
      window.google &&
      window.google.accounts &&
      !isLoaded &&
      googleButtonRef.current
    ) {
      console.log("DOM ready, initializing Google Sign-In...");
      initializeGoogleSignIn();
    }
  }, [isLoaded]);

  // Effect to retry initialization when component mounts and ref becomes available
  useEffect(() => {
    if (
      googleButtonRef.current &&
      window.google &&
      window.google.accounts &&
      !isLoaded
    ) {
      console.log("Ref available, attempting initialization...");
      initializeGoogleSignIn();
    }
  }, [googleButtonRef.current, isLoaded]);

  const initializeGoogleSignIn = (retryCount = 0) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    console.log("Initializing Google Sign-In...", "Retry:", retryCount);
    console.log("Client ID:", clientId);
    console.log("Google object:", window.google);
    console.log("Button ref:", googleButtonRef.current);

    if (!clientId) {
      console.error("Google Client ID not found in environment variables");
      return;
    }

    // Check if button ref is available, if not, retry up to 5 times
    if (!googleButtonRef.current) {
      if (retryCount < 5) {
        console.log("Button ref not ready, retrying in 200ms...");
        setTimeout(() => {
          initializeGoogleSignIn(retryCount + 1);
        }, 200);
        return;
      } else {
        console.error("Google button ref not found after 5 retries");
        return;
      }
    }

    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      console.log("Google Identity Services initialized");

      // Render the sign-in button
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme,
        size,
        shape,
        width,
        text:
          buttonText ||
          (ready ? t("auth.signInWithGoogle") : "使用 Google 登录"),
        logo_alignment: "left",
      });
      console.log("Google Sign-In button rendered successfully");

      setIsLoaded(true);
    } catch (error) {
      console.error("Error initializing Google Sign-In:", error);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);

    try {
      // Decode the JWT token to get user information
      const credential = response.credential;
      const payload = JSON.parse(atob(credential.split(".")[1]));

      const user: GoogleUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };

      onSuccess(user);
    } catch (error) {
      console.error("Google Sign-In error:", error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback button for when Google script is not loaded
  const FallbackButton = () => (
    <button
      disabled
      className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {ready ? t("auth.loadingGoogle") : "正在加载 Google 登录..."}
    </button>
  );

  if (!isLoaded) {
    return <FallbackButton />;
  }

  return (
    <div className="relative">
      <div
        ref={googleButtonRef}
        className={isLoading ? "opacity-50 pointer-events-none" : "flex items-center"}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {ready ? t("auth.signingIn") : "登录中..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for Google Sign Out
export const useGoogleSignOut = () => {
  const signOut = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
      // Clear any stored credentials
      localStorage.removeItem("google_user");
      sessionStorage.removeItem("google_user");
    }
  };

  return { signOut };
};
