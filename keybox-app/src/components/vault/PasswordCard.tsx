import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

interface PasswordCardProps {
  password: any;
  index: number;
  onEdit: (password: any) => void;
  categoryColors: Record<string, string>;
  categoryIcons: Record<string, any>;
}

export default function PasswordCard({
  password,
  index,
  onEdit,
  categoryColors,
  categoryIcons,
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleFavorite = async () => {
    // This would need to be implemented based on your Password entity
    console.log("Toggle favorite for:", password.id);
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStrengthText = (score: number) => {
    if (score >= 80) return "Strong";
    if (score >= 60) return "Medium";
    return "Weak";
  };

  const getFavicon = (url: string) => {
    if (!url) return "";
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return "";
    }
  };

  const CategoryIcon = categoryIcons[password.category] || Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
        onClick={() => onEdit(password)}
      >
        <CardContent className="p-6">
          {/* Header with site info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Site favicon */}
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                {getFavicon(password.site_url) ? (
                  <img
                    src={getFavicon(password.site_url)}
                    alt=""
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <Shield className="w-6 h-6 text-blue-600" />
              </div>

              {/* Site name and link */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate mb-1">
                  {password.site_name}
                </h3>
                {password.site_url && (
                  <a
                    href={
                      password.site_url.startsWith("http")
                        ? password.site_url
                        : `https://${password.site_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
              >
                <Star
                  className={`w-4 h-4 ${
                    password.is_favorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add more actions menu
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Username field */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 mb-1">Username</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(password.username || "", "username");
                }}
              >
                <Copy
                  className={`w-3 h-3 ${
                    copiedField === "username" ? "text-green-600" : ""
                  }`}
                />
              </Button>
            </div>
            <div className="text-sm font-medium text-slate-900 truncate">
              {password.username || "No username"}
            </div>
          </div>

          {/* Password field */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 mb-1">Password</span>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(password.password || "", "password");
                  }}
                >
                  <Copy
                    className={`w-3 h-3 ${
                      copiedField === "password" ? "text-green-600" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-900 font-mono">
              {showPassword ? password.password : "••••••••"}
            </div>
          </div>

          {/* Category badges and strength */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Category badge */}
              <Badge
                variant="secondary"
                className={`${
                  categoryColors[password.category] || categoryColors.other
                } text-xs`}
              >
                <CategoryIcon className="w-3 h-3 mr-1" />
                {password.category}
              </Badge>

              {/* Shared badge */}
              {password.shared_with_family && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs"
                >
                  Shared
                </Badge>
              )}
            </div>

            {/* Password strength */}
            <div className="text-xs">
              <span
                className={`font-medium ${getStrengthColor(
                  password.strength_score || 0
                )}`}
              >
                {getStrengthText(password.strength_score || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
