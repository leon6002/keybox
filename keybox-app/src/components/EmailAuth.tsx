"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface EmailAuthProps {
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

export default function EmailAuth({ onSuccess, onError }: EmailAuthProps) {
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    verificationCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/email-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(
        "Account created! Please check your email for verification code."
      );
      setMode("verify");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      onSuccess(data.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!formData.verificationCode) {
      setError("Please enter verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/email-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: formData.verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess("Email verified successfully! You can now log in.");
      setMode("login");
      setFormData((prev) => ({ ...prev, verificationCode: "" }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";

      // If email is already verified, switch to login mode
      if (errorMessage.includes("already verified")) {
        setSuccess("Your email is already verified! You can now log in.");
        setMode("login");
        setFormData((prev) => ({ ...prev, verificationCode: "" }));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Enter your password"
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <Button onClick={handleLogin} disabled={isLoading} className="w-full">
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode("register")}
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter your full name"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Create a password (min 6 characters)"
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <Button onClick={handleRegister} disabled={isLoading} className="w-full">
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode("login")}
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );

  const renderVerifyForm = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-sm text-gray-600">
          We sent a verification code to {formData.email}
        </p>
      </div>

      <div>
        <Label htmlFor="verificationCode">Verification Code</Label>
        <Input
          id="verificationCode"
          type="text"
          value={formData.verificationCode}
          onChange={(e) =>
            handleInputChange("verificationCode", e.target.value)
          }
          placeholder="Enter 6-digit code"
          className="text-center text-lg tracking-widest"
          maxLength={6}
          disabled={isLoading}
        />
      </div>

      <Button onClick={handleVerify} disabled={isLoading} className="w-full">
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode("register")}
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Back to registration
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {mode === "login" && renderLoginForm()}
      {mode === "register" && renderRegisterForm()}
      {mode === "verify" && renderVerifyForm()}
    </div>
  );
}
