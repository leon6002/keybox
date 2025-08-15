"use client";

// Encryption Setup Modal
// Helps users set up their master password after Google sign-in

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import PasswordGeneratorModal from "@/components/PasswordGeneratorModal";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);

  const googleUser = getGoogleUser();

  // Handle password generation
  const handlePasswordGenerated = (password: string) => {
    setMasterPassword(password);
    setConfirmPassword(password);
    setShowPasswordGenerator(false);
  };

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    // Cap the score to maximum array index (5)
    return Math.min(score, 5);
  };

  const passwordStrength = getPasswordStrength(masterPassword);
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];
  const strengthColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-yellow-500",
    "bg-yellow-400",
    "bg-green-500",
    "bg-green-400",
  ];

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
      await setupEncryption(masterPassword);
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-center min-h-screen py-12">
          <div className="w-full max-w-md">
            {/* Main Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Key className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Set Up Master Password
                </h1>
                <p className="text-slate-400">
                  Create a master password to encrypt your passwords securely
                </p>
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl mb-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={googleUser.picture}
                    alt={googleUser.name}
                    size="md"
                  />
                  <div>
                    <div className="text-white font-medium">
                      {googleUser.name}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {googleUser.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-amber-200 text-sm">
                    <p className="font-medium mb-1">
                      Important Security Notice
                    </p>
                    <p>
                      Your master password encrypts all your data. We cannot
                      recover it if you forget it, so choose something memorable
                      but secure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Master Password */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Create a strong master password"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {masterPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">
                          Password Strength
                        </span>
                        <span
                          className={`text-xs font-medium ${passwordStrength >= 4 ? "text-green-400" : passwordStrength >= 2 ? "text-yellow-400" : "text-red-400"}`}
                        >
                          {strengthLabels[passwordStrength]}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < passwordStrength
                                ? strengthColors[passwordStrength]
                                : "bg-white/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Password Generator Button */}
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPasswordGenerator(true)}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Strong Password
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Confirm Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your master password"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400/50 transition-all backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <div className="mt-3">
                      <div
                        className={`text-xs flex items-center space-x-2 ${
                          masterPassword === confirmPassword
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {masterPassword === confirmPassword ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleSetupEncryption}
                    disabled={isLoading || !masterPassword || !confirmPassword}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Setting up encryption...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5 mr-2" />
                        Set Up Master Password
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-slate-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>Zero-knowledge encryption • Your data stays private</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={showPasswordGenerator}
        onClose={() => setShowPasswordGenerator(false)}
        onPasswordGenerated={handlePasswordGenerated}
      />
    </div>
  );
}
