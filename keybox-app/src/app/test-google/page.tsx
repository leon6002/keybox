"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function TestGooglePage() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading...");
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setClientId(id || "Not found");
    
    console.log("Client ID:", id);
    console.log("Window.google:", window.google);

    // Load Google script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google script loaded");
      setStatus("Script loaded");
      
      if (window.google && window.google.accounts) {
        console.log("Google accounts available");
        setStatus("Google accounts available");
        
        try {
          window.google.accounts.id.initialize({
            client_id: id,
            callback: (response: any) => {
              console.log("Login response:", response);
              setStatus("Login successful!");
            },
          });
          
          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: "outline",
              size: "large",
              width: 300,
            });
            setStatus("Button rendered");
          }
        } catch (error) {
          console.error("Error:", error);
          setStatus("Error: " + error);
        }
      } else {
        setStatus("Google accounts not available");
      }
    };
    
    script.onerror = () => {
      console.error("Failed to load Google script");
      setStatus("Failed to load Google script");
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Google Login Test</h1>
        
        <div className="mb-4">
          <strong>Client ID:</strong>
          <div className="text-sm text-gray-600 break-all">{clientId}</div>
        </div>
        
        <div className="mb-4">
          <strong>Status:</strong>
          <div className="text-sm text-gray-600">{status}</div>
        </div>
        
        <div className="mb-4">
          <strong>Google Button:</strong>
          <div ref={buttonRef} className="mt-2"></div>
        </div>
        
        <div className="text-xs text-gray-500">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  );
}
