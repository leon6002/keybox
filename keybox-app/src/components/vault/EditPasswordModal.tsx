import React, { useState } from "react";
import { Password, PasswordData } from "@/entities/Password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Eye, EyeOff, Check } from "lucide-react";

interface EditPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  password: PasswordData | null;
}

export default function EditPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  password,
}: EditPasswordModalProps) {
  const [formData, setFormData] = useState(
    password || {
      site_name: "",
      site_url: "",
      username: "",
      password: "",
      notes: "",
      category: "other",
      is_favorite: false,
      shared_with_family: false,
    }
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (password) {
      setFormData(password);
    }
  }, [password]);

  const generatePassword = () => {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData((prev) => ({ ...prev, password: newPassword }));
  };

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!password || !password.id) {
        console.error("No password or password ID to update");
        return;
      }

      const passwordData = {
        ...formData,
        strength_score: calculateStrength(formData.password),
        last_used: new Date().toISOString(),
      };

      await Password.update(password.id, passwordData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating password:", error);
    }

    setIsSubmitting(false);
  };

  const strengthScore = calculateStrength(formData.password || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Edit Password
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name *</Label>
            <Input
              id="site_name"
              value={formData.site_name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_name: e.target.value }))
              }
              placeholder="e.g. Gmail, Facebook"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_url">Website URL</Label>
            <Input
              id="site_url"
              type="url"
              value={formData.site_url || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_url: e.target.value }))
              }
              placeholder="https://example.com"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username/Email *</Label>
            <Input
              id="username"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="your@email.com"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter password"
                required
                className="rounded-xl pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={generatePassword}
                  className="w-8 h-8"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Password Strength</span>
                  <span
                    className={`font-medium ${
                      strengthScore >= 80
                        ? "text-green-600"
                        : strengthScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {strengthScore >= 80
                      ? "Strong"
                      : strengthScore >= 60
                      ? "Medium"
                      : "Weak"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strengthScore >= 80
                        ? "bg-green-500"
                        : strengthScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${strengthScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="banking">Banking</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes..."
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="is_favorite" className="text-sm font-medium">
              Mark as favorite
            </Label>
            <Switch
              id="is_favorite"
              checked={formData.is_favorite || false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_favorite: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="shared_with_family" className="text-sm font-medium">
              Share with family
            </Label>
            <Switch
              id="shared_with_family"
              checked={formData.shared_with_family || false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  shared_with_family: checked,
                }))
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
