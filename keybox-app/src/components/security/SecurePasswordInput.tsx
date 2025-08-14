"use client";

// Secure password input component with enhanced security features
// Prevents password exposure in DOM and provides secure handling

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SecurityServiceFactory } from "@/lib/security";

interface SecurePasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;

  // Security features
  showStrengthIndicator?: boolean;
  preventCopy?: boolean;
  clearOnBlur?: boolean;
  maxLength?: number;

  // Validation
  validateStrength?: boolean;
  minStrength?: number; // 0-100

  // UI customization
  showToggle?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "secure" | "critical";
}

export interface SecurePasswordInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

const SecurePasswordInput = forwardRef<
  SecurePasswordInputRef,
  SecurePasswordInputProps
>(
  (
    {
      value = "",
      onChange,
      onBlur,
      onFocus,
      placeholder = "Enter password",
      disabled = false,
      required = false,
      autoComplete = "current-password",
      className,
      showStrengthIndicator = false,
      preventCopy = true,
      clearOnBlur = false,
      maxLength = 256,
      validateStrength = false,
      minStrength = 70,
      showToggle = true,
      size = "md",
      variant = "default",
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [strength, setStrength] = useState({
      score: 0,
      isStrong: false,
      feedback: [] as string[],
    });
    const [hasBeenFocused, setHasBeenFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const securityAuditService =
      SecurityServiceFactory.getSecurityAuditService();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        if (onChange) onChange("");
        setStrength({ score: 0, isStrong: false, feedback: [] as string[] });
      },
      getValue: () => value,
    }));

    // Analyze password strength
    useEffect(() => {
      if (showStrengthIndicator && value) {
        const analysis = securityAuditService.analyzePasswordStrength(value);
        setStrength(analysis);
      } else {
        setStrength({ score: 0, isStrong: false, feedback: [] as string[] });
      }
    }, [value, showStrengthIndicator]);

    const handleFocus = () => {
      setIsFocused(true);
      setHasBeenFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (clearOnBlur) {
        setIsVisible(false);
      }
      onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange?.(newValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Prevent certain key combinations for security
      if (preventCopy) {
        if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "a")) {
          e.preventDefault();
        }
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      if (preventCopy) {
        e.preventDefault();
      }
    };

    const toggleVisibility = () => {
      setIsVisible(!isVisible);
    };

    // Size classes
    const sizeClasses = {
      sm: "h-8 px-2 text-sm",
      md: "h-10 px-3 text-sm",
      lg: "h-12 px-4 text-base",
    };

    // Variant classes
    const variantClasses = {
      default: "border-input bg-background",
      secure:
        "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950",
      critical: "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950",
    };

    // Strength indicator colors
    const getStrengthColor = (score: number) => {
      if (score >= 80) return "bg-green-500";
      if (score >= 60) return "bg-yellow-500";
      if (score >= 40) return "bg-orange-500";
      return "bg-red-500";
    };

    const getStrengthText = (score: number) => {
      if (score >= 80) return "Strong";
      if (score >= 60) return "Good";
      if (score >= 40) return "Fair";
      if (score > 0) return "Weak";
      return "";
    };

    const isInvalid =
      validateStrength &&
      hasBeenFocused &&
      value &&
      strength.score < minStrength;

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type={isVisible ? "text" : "password"}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            maxLength={maxLength}
            className={cn(
              "flex w-full rounded-md border font-mono transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[size],
              variantClasses[variant],
              isInvalid && "border-red-500 focus-visible:ring-red-500",
              isFocused && "ring-2 ring-ring ring-offset-2",
              className
            )}
            style={{
              // Additional security: prevent text selection styling
              WebkitUserSelect: preventCopy ? "none" : "auto",
              userSelect: preventCopy ? "none" : "auto",
            }}
          />

          {/* Toggle visibility button */}
          {showToggle && (
            <button
              type="button"
              onClick={toggleVisibility}
              disabled={disabled}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "flex h-6 w-6 items-center justify-center rounded",
                "text-muted-foreground hover:text-foreground",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              tabIndex={-1}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Security indicator */}
          {variant === "secure" && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
          )}

          {/* Warning indicator */}
          {isInvalid && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {/* Password strength indicator */}
        {showStrengthIndicator && value && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength</span>
              <span
                className={cn(
                  "font-medium",
                  strength.score >= 80
                    ? "text-green-600"
                    : strength.score >= 60
                    ? "text-yellow-600"
                    : strength.score >= 40
                    ? "text-orange-600"
                    : "text-red-600"
                )}
              >
                {getStrengthText(strength.score)}
              </span>
            </div>

            {/* Strength bar */}
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  getStrengthColor(strength.score)
                )}
                style={{ width: `${strength.score}%` }}
              />
            </div>

            {/* Feedback */}
            {strength.feedback.length > 0 && hasBeenFocused && (
              <div className="space-y-1">
                {strength.feedback.slice(0, 2).map((feedback, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {feedback}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Validation error */}
        {isInvalid && (
          <p className="text-xs text-red-600">
            Password strength is too low (minimum: {minStrength}%)
          </p>
        )}

        {/* Character count */}
        {maxLength && value.length > maxLength * 0.8 && (
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/{maxLength}
          </p>
        )}

        {/* Security notice */}
        {preventCopy && isFocused && (
          <p className="text-xs text-muted-foreground">
            Copy and paste disabled for security
          </p>
        )}
      </div>
    );
  }
);

SecurePasswordInput.displayName = "SecurePasswordInput";

export default SecurePasswordInput;
