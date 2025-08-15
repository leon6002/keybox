"use client";

// Vault Unlock Page - NordPass Style
// Full-screen vault unlock interface with clean, centered design

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Unlock, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function VaultUnlockModal({
  isOpen,
  onClose,
}: VaultUnlockModalProps) {
  const { unlockVault, getGoogleUser, getDatabaseUser } = useAuth();
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [keepUnlocked, setKeepUnlocked] = useState(false);

  const googleUser = getGoogleUser();
  const databaseUser = getDatabaseUser();

  if (!isOpen || !googleUser) {
    return null;
  }

  const handleUnlockVault = async () => {
    setError("");

    if (!masterPassword) {
      setError("Please enter your Master Password");
      return;
    }

    setIsLoading(true);

    try {
      await unlockVault(masterPassword);
      setMasterPassword(""); // Clear password from memory
      onClose?.();
    } catch (error) {
      setError("Incorrect master password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && masterPassword && !isLoading) {
      handleUnlockVault();
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Unlock your vault
                </h1>
                <p className="text-slate-400">
                  Enter your master password to access your encrypted passwords
                </p>
              </div>

              {/* User Info */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl mb-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={googleUser.picture}
                    alt={googleUser.name}
                    size="md"
                    className=""
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
                <button className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-white/10 transition-colors">
                  Switch
                </button>
              </div>

              {/* Master Password Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Enter your master password"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/50 transition-all backdrop-blur-sm"
                      disabled={isLoading}
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
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Password Hint */}
                {databaseUser?.masterPasswordHint && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm">
                    <span className="font-medium">💡 Hint:</span>{" "}
                    {databaseUser.masterPasswordHint}
                  </div>
                )}

                {/* Forgot Password Link */}
                <div className="text-center">
                  <button className="text-slate-400 hover:text-white text-sm transition-colors underline decoration-dotted underline-offset-4">
                    Forgot your Master Password?
                  </button>
                </div>

                {/* Keep Extension Unlocked */}
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="keepUnlocked"
                    checked={keepUnlocked}
                    onChange={(e) => setKeepUnlocked(e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-400 focus:ring-2 cursor-pointer"
                  />
                  <label
                    htmlFor="keepUnlocked"
                    className="text-white text-sm cursor-pointer flex-1"
                  >
                    Keep vault unlocked for this session
                  </label>
                </div>

                {/* Unlock Button */}
                <Button
                  onClick={handleUnlockVault}
                  disabled={isLoading || !masterPassword}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Unlocking vault...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock Vault
                    </>
                  )}
                </Button>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-slate-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>
                    End-to-end encrypted • Zero-knowledge architecture
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
