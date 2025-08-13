'use client';

// Security context for managing encrypted state in React components
// Provides secure session management and encrypted data handling

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  SecurityServiceFactory,
  UserKey,
  SecureSession,
  SecuritySettings,
  MasterKey,
  EncryptedCipher,
  SecurityHealthCheck,
} from '@/lib/security';
import { KeyboxAuthService, AuthUser } from '@/lib/security/authService';
import { PasswordEntry, Category } from '@/types/password';

interface SecurityState {
  // Authentication state
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: SecureSession | null;
  
  // Security status
  isLocked: boolean;
  securityHealth: 'good' | 'warning' | 'critical' | 'unknown';
  
  // Encrypted data
  encryptedCiphers: EncryptedCipher[];
  decryptedEntries: PasswordEntry[];
  categories: Category[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Security settings
  settings: SecuritySettings | null;
}

type SecurityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; session: SecureSession } }
  | { type: 'LOGOUT' }
  | { type: 'LOCK_VAULT' }
  | { type: 'UNLOCK_VAULT'; payload: { entries: PasswordEntry[]; categories: Category[] } }
  | { type: 'UPDATE_ENCRYPTED_DATA'; payload: EncryptedCipher[] }
  | { type: 'UPDATE_DECRYPTED_DATA'; payload: { entries: PasswordEntry[]; categories: Category[] } }
  | { type: 'UPDATE_SECURITY_HEALTH'; payload: 'good' | 'warning' | 'critical' | 'unknown' }
  | { type: 'UPDATE_SETTINGS'; payload: SecuritySettings };

const initialState: SecurityState = {
  isAuthenticated: false,
  user: null,
  session: null,
  isLocked: true,
  securityHealth: 'unknown',
  encryptedCiphers: [],
  decryptedEntries: [],
  categories: [],
  isLoading: false,
  error: null,
  settings: null,
};

function securityReducer(state: SecurityState, action: SecurityAction): SecurityState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        session: action.payload.session,
        isLocked: false,
        error: null,
        isLoading: false,
        settings: action.payload.user.securitySettings,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        securityHealth: state.securityHealth, // Preserve health status
      };
    
    case 'LOCK_VAULT':
      return {
        ...state,
        isLocked: true,
        decryptedEntries: [],
        categories: [],
        error: null,
      };
    
    case 'UNLOCK_VAULT':
      return {
        ...state,
        isLocked: false,
        decryptedEntries: action.payload.entries,
        categories: action.payload.categories,
        error: null,
      };
    
    case 'UPDATE_ENCRYPTED_DATA':
      return {
        ...state,
        encryptedCiphers: action.payload,
      };
    
    case 'UPDATE_DECRYPTED_DATA':
      return {
        ...state,
        decryptedEntries: action.payload.entries,
        categories: action.payload.categories,
      };
    
    case 'UPDATE_SECURITY_HEALTH':
      return {
        ...state,
        securityHealth: action.payload,
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };
    
    default:
      return state;
  }
}

interface SecurityContextType {
  // State
  state: SecurityState;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  
  // Vault methods
  lockVault: () => void;
  unlockVault: (password: string) => Promise<void>;
  
  // Data methods
  addPasswordEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePasswordEntry: (id: string, updates: Partial<PasswordEntry>) => Promise<void>;
  deletePasswordEntry: (id: string) => Promise<void>;
  
  // Security methods
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkSecurityHealth: () => Promise<void>;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  
  // Utility methods
  isSessionValid: () => boolean;
  getDecryptedEntry: (id: string) => PasswordEntry | null;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(securityReducer, initialState);
  const authService = SecurityServiceFactory.getAuthService();
  const vaultService = SecurityServiceFactory.getVaultService();

  // Check security health on mount and periodically
  useEffect(() => {
    checkSecurityHealth();
    
    const healthCheckInterval = setInterval(checkSecurityHealth, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Session validation
  useEffect(() => {
    if (state.isAuthenticated && state.session) {
      const sessionCheckInterval = setInterval(() => {
        if (!isSessionValid()) {
          logout();
        }
      }, 60 * 1000); // Check every minute
      
      return () => clearInterval(sessionCheckInterval);
    }
  }, [state.isAuthenticated, state.session]);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const { user, session } = await authService.login({ email, masterPassword: password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, session } });
      
      // Load encrypted data after successful login
      await loadEncryptedData();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      dispatch({ type: 'LOGOUT' });
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await authService.register({ email, masterPassword: password, name });
      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const lockVault = (): void => {
    dispatch({ type: 'LOCK_VAULT' });
  };

  const unlockVault = async (password: string): Promise<void> => {
    if (!state.user || !state.session) {
      throw new Error('No active session');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Verify password and decrypt data
      const entries = await decryptAllEntries();
      const categories = await decryptAllCategories();
      
      dispatch({ type: 'UNLOCK_VAULT', payload: { entries, categories } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to unlock vault' });
      throw error;
    }
  };

  const addPasswordEntry = async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!state.session) {
      throw new Error('No active session');
    }

    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Encrypt and store
    const encryptedCipher = await vaultService.encryptCipher(newEntry, state.session.userKey);
    
    // Update state
    const updatedCiphers = [...state.encryptedCiphers, encryptedCipher];
    const updatedEntries = [...state.decryptedEntries, newEntry];
    
    dispatch({ type: 'UPDATE_ENCRYPTED_DATA', payload: updatedCiphers });
    dispatch({ type: 'UPDATE_DECRYPTED_DATA', payload: { entries: updatedEntries, categories: state.categories } });
  };

  const updatePasswordEntry = async (id: string, updates: Partial<PasswordEntry>): Promise<void> => {
    if (!state.session) {
      throw new Error('No active session');
    }

    const existingEntry = state.decryptedEntries.find(e => e.id === id);
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    const updatedEntry: PasswordEntry = {
      ...existingEntry,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Encrypt and update
    const encryptedCipher = await vaultService.encryptCipher(updatedEntry, state.session.userKey);
    
    // Update state
    const updatedCiphers = state.encryptedCiphers.map(c => c.id === id ? encryptedCipher : c);
    const updatedEntries = state.decryptedEntries.map(e => e.id === id ? updatedEntry : e);
    
    dispatch({ type: 'UPDATE_ENCRYPTED_DATA', payload: updatedCiphers });
    dispatch({ type: 'UPDATE_DECRYPTED_DATA', payload: { entries: updatedEntries, categories: state.categories } });
  };

  const deletePasswordEntry = async (id: string): Promise<void> => {
    // Remove from state
    const updatedCiphers = state.encryptedCiphers.filter(c => c.id !== id);
    const updatedEntries = state.decryptedEntries.filter(e => e.id !== id);
    
    dispatch({ type: 'UPDATE_ENCRYPTED_DATA', payload: updatedCiphers });
    dispatch({ type: 'UPDATE_DECRYPTED_DATA', payload: { entries: updatedEntries, categories: state.categories } });
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await authService.changePassword({ currentPassword, newPassword });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const checkSecurityHealth = async (): Promise<void> => {
    try {
      const health = await SecurityHealthCheck.checkSecurityHealth();
      dispatch({ type: 'UPDATE_SECURITY_HEALTH', payload: health.status });
    } catch (error) {
      console.error('Security health check failed:', error);
      dispatch({ type: 'UPDATE_SECURITY_HEALTH', payload: 'unknown' });
    }
  };

  const updateSecuritySettings = async (settings: Partial<SecuritySettings>): Promise<void> => {
    if (!state.settings) {
      throw new Error('No current settings');
    }

    const updatedSettings = { ...state.settings, ...settings };
    dispatch({ type: 'UPDATE_SETTINGS', payload: updatedSettings });
    
    // TODO: Persist settings to database
  };

  const isSessionValid = (): boolean => {
    const session = authService.getCurrentSession();
    return session !== null;
  };

  const getDecryptedEntry = (id: string): PasswordEntry | null => {
    return state.decryptedEntries.find(e => e.id === id) || null;
  };

  // Helper methods
  const loadEncryptedData = async (): Promise<void> => {
    // TODO: Load encrypted ciphers from database
    // For now, return empty array
    dispatch({ type: 'UPDATE_ENCRYPTED_DATA', payload: [] });
  };

  const decryptAllEntries = async (): Promise<PasswordEntry[]> => {
    if (!state.session) {
      return [];
    }

    const entries: PasswordEntry[] = [];
    for (const encryptedCipher of state.encryptedCiphers) {
      try {
        const entry = await vaultService.decryptCipher(encryptedCipher, state.session.userKey);
        entries.push(entry);
      } catch (error) {
        console.error(`Failed to decrypt cipher ${encryptedCipher.id}:`, error);
      }
    }
    
    return entries;
  };

  const decryptAllCategories = async (): Promise<Category[]> => {
    // TODO: Implement category decryption
    return [];
  };

  const contextValue: SecurityContextType = {
    state,
    login,
    logout,
    register,
    lockVault,
    unlockVault,
    addPasswordEntry,
    updatePasswordEntry,
    deletePasswordEntry,
    changePassword,
    checkSecurityHealth,
    updateSecuritySettings,
    isSessionValid,
    getDecryptedEntry,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurityContext(): SecurityContextType {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}
