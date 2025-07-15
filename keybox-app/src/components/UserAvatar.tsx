"use client";

import { useState } from "react";
import { User, Crown } from "lucide-react";

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  showPremium?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12",
};

const premiumSizeClasses = {
  sm: "w-3 h-3 -top-0.5 -right-0.5",
  md: "w-4 h-4 -top-1 -right-1",
  lg: "w-5 h-5 -top-1 -right-1",
};

const premiumIconSizes = {
  sm: "w-1.5 h-1.5",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export default function UserAvatar({ 
  src, 
  alt, 
  size = "md", 
  showPremium = false,
  className = "" 
}: UserAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center`}>
          <User className={`${premiumIconSizes[size]} text-gray-400 dark:text-gray-500`} />
        </div>
      )}

      {/* Avatar image or fallback */}
      {imageError ? (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
          <User className={`${premiumIconSizes[size]} text-white`} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Premium badge */}
      {showPremium && (
        <div className={`absolute ${premiumSizeClasses[size]} bg-yellow-500 rounded-full flex items-center justify-center`}>
          <Crown className={`${premiumIconSizes[size]} text-white`} />
        </div>
      )}
    </div>
  );
}
