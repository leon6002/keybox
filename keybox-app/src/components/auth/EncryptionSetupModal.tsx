"use client";

// Encryption Setup Modal
// Helps users set up their master password after Google sign-in

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Key, AlertTriangle } from "lucide-react";
import SecurePasswordInput from "../security/SecurePasswordInput";

interface EncryptionSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function EncryptionSetupModal({
  isOpen,
  onClose,
}: EncryptionSetupModalProps) {
  const { setupEncryption, getGoogleUser } = useAuth();
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const googleUser = getGoogleUser();

  console.log("🔐 EncryptionSetupModal render:", {
    isOpen,
    googleUser: googleUser?.email,
  });

  if (!isOpen || !googleUser) {
    return null;
  }

  const handleSetupEncryption = async () => {
    setError("");

    // Validation
    if (!masterPassword) {
      setError("Master password is required");
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (masterPassword.length < 8) {
      setError("Master password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await setupEncryption(masterPassword, passwordHint || undefined);
      onClose?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to set up encryption"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl">Set Up Encryption</CardTitle>
          <CardDescription>
            Create a master password to encrypt your passwords securely
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
              <p className="text-sm text-muted-foreground">
                {googleUser.email}
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your master password encrypts all your data. We cannot recover it
              if you forget it.
            </AlertDescription>
          </Alert>

          {/* Master Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Master Password</label>
            <SecurePasswordInput
              value={masterPassword}
              onChange={setMasterPassword}
              placeholder="Create a strong master password"
              showStrengthIndicator={true}
              validateStrength={true}
              minStrength={70}
              variant="secure"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confirm Master Password
            </label>
            <SecurePasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your master password"
              showToggle={false}
              preventCopy={false}
            />
          </div>

          {/* Password Hint (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Password Hint (Optional)
            </label>
            <input
              type="text"
              value={passwordHint}
              onChange={(e) => setPasswordHint(e.target.value)}
              placeholder="A hint to help you remember (not secure)"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This hint is stored unencrypted and visible to anyone with access
              to your account
            </p>
          </div>

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
              onClick={handleSetupEncryption}
              disabled={isLoading || !masterPassword || !confirmPassword}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Setting Up...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Set Up Encryption
                </>
              )}
            </Button>
          </div>

          {/* Security Info */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">🔐 How This Works:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your master password encrypts all your data locally</li>
              <li>• We never see or store your master password</li>
              <li>• Even we cannot access your encrypted passwords</li>
              <li>• This provides zero-knowledge security</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
