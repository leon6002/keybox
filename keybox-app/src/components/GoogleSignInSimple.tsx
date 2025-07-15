"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    google: any;
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

interface GoogleSignInSimpleProps {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: any) => void;
}

export default function GoogleSignInSimple({
  onSuccess,
  onError,
}: GoogleSignInSimpleProps) {
  const { t, ready } = useTranslation();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleCredentialResponse = async (response: any) => {
    try {
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
    }
  };

  const initializeGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Client ID not found");
      return;
    }

    if (!buttonRef.current) {
      console.log("Button ref not ready");
      return;
    }

    if (!window.google || !window.google.accounts) {
      console.log("Google accounts not available");
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
        text: ready ? t("auth.signInWithGoogle") : "使用 Google 登录",
        logo_alignment: "center",
      });

      console.log("Google button rendered successfully");
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing Google:", error);
    }
  };

  useEffect(() => {
    // Load Google script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google script loaded");
      // Wait a bit for DOM to be ready
      setTimeout(initializeGoogle, 500);
    };

    script.onerror = () => {
      console.error("Failed to load Google script");
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Retry initialization if not successful
  useEffect(() => {
    if (!isInitialized && buttonRef.current && window.google) {
      const timer = setTimeout(initializeGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  return (
    <div className="w-full flex justify-center">
      <div ref={buttonRef} className="flex justify-center"></div>
      {/* <div className="text-xs text-gray-500 mt-2">
        Status: {status}
      </div> */}
    </div>
  );
}
