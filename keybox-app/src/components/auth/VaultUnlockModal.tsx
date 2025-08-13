'use client';

// Vault Unlock Modal
// Prompts users to enter their master password to unlock their encrypted vault

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Unlock, AlertTriangle, Shield } from 'lucide-react';
import SecurePasswordInput from '../security/SecurePasswordInput';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function VaultUnlockModal({ isOpen, onClose }: VaultUnlockModalProps) {
  const { unlockVault, getGoogleUser, getDatabaseUser } = useAuth();
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const googleUser = getGoogleUser();
  const databaseUser = getDatabaseUser();

  if (!isOpen || !googleUser) {
    return null;
  }

  const handleUnlockVault = async () => {
    setError('');

    if (!masterPassword) {
      setError('Master password is required');
      return;
    }

    setIsLoading(true);

    try {
      await unlockVault(masterPassword);
      setMasterPassword(''); // Clear password from memory
      onClose?.();
    } catch (error) {
      setError('Incorrect master password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && masterPassword && !isLoading) {
      handleUnlockVault();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl">Unlock Your Vault</CardTitle>
          <CardDescription>
            Enter your master password to access your encrypted passwords
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <img 
              src={googleUser.picture} 
              alt={googleUser.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{googleUser.name}</p>
              <p className="text-sm text-muted-foreground">{googleUser.email}</p>
            </div>
          </div>

          {/* Security Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your vault is encrypted and locked</span>
          </div>

          {/* Master Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Master Password</label>
            <SecurePasswordInput
              value={masterPassword}
              onChange={setMasterPassword}
              placeholder="Enter your master password"
              showToggle={true}
              showStrengthIndicator={false}
              preventCopy={true}
              onKeyPress={handleKeyPress}
              autoFocus={true}
            />
          </div>

          {/* Password Hint */}
          {databaseUser?.masterPasswordHint && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Password Hint:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {databaseUser.masterPasswordHint}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnlockVault}
              disabled={isLoading || !masterPassword}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Vault
                </>
              )}
            </Button>
          </div>

          {/* Security Info */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">🔐 Security Notice:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your master password is never sent to our servers</li>
              <li>• All decryption happens locally in your browser</li>
              <li>• We cannot recover your password if you forget it</li>
              <li>• Your vault will auto-lock after inactivity</li>
            </ul>
          </div>

          {/* Forgot Password Help */}
          <div className="pt-2 border-t">
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Forgot your master password?
              </summary>
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  Unfortunately, we cannot recover your master password due to our zero-knowledge security model. 
                  You'll need to clear your encrypted data and set up encryption again. 
                  This will delete all your encrypted passwords.
                </p>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
