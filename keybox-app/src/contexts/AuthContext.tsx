"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (user: GoogleUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('google_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('google_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = (userData: GoogleUser) => {
    setUser(userData);
    localStorage.setItem('google_user', JSON.stringify(userData));
    
    // Optional: Send user data to your backend for user management
    // This is where you'd typically create or update user records
    console.log('User signed in:', userData);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('google_user');
    sessionStorage.removeItem('google_user');
    
    // Sign out from Google
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    console.log('User signed out');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login or show login modal
      console.log('User not authenticated, redirect to login');
    }
  }, [isAuthenticated, isLoading]);
  
  return { isAuthenticated, isLoading };
}
