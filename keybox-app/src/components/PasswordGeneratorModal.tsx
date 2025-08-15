"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
  Zap,
} from "lucide-react";
import { PasswordGenerator } from "@/types/password";
import { PasswordGeneratorUtil } from "@/utils/passwordGenerator";

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordGenerated: (password: string) => void;
}

export default function PasswordGeneratorModal({
  isOpen,
  onClose,
  onPasswordGenerated,
}: PasswordGeneratorModalProps) {
  const [options, setOptions] = useState<PasswordGenerator>(
    PasswordGeneratorUtil.getDefaultOptions()
  );
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    level: string;
    feedback: string[];
  } | null>(null);

  // 生成密码
  const generatePassword = () => {
    try {
      const password = PasswordGeneratorUtil.generatePassword(options);
      setGeneratedPassword(password);

      // 评估密码强度
      const strength = PasswordGeneratorUtil.evaluatePasswordStrength(password);
      setPasswordStrength(strength);
    } catch (error) {
      console.error("Password generation failed:", error);
      setGeneratedPassword("");
      setPasswordStrength(null);
    }
  };

  // 初始生成密码
  useEffect(() => {
    if (isOpen) {
      generatePassword();
    }
  }, [isOpen, options]);

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // 更新选项
  const updateOptions = (
    key: keyof PasswordGenerator,
    value: string | number | boolean
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // 更新易记忆选项
  const updateMemorableOptions = (
    key: string,
    value: string | number | boolean
  ) => {
    // 处理分隔符的特殊情况
    const actualValue = key === "separator" && value === "none" ? "" : value;

    setOptions((prev) => ({
      ...prev,
      memorableOptions: {
        ...prev.memorableOptions!,
        [key]: actualValue,
      },
    }));
  };

  // 获取强度颜色
  const getStrengthColor = (level: string) => {
    switch (level) {
      case "very-strong":
        return "text-green-600 bg-green-100";
      case "strong":
        return "text-blue-600 bg-blue-100";
      case "good":
        return "text-yellow-600 bg-yellow-100";
      case "fair":
        return "text-orange-600 bg-orange-100";
      case "weak":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-300 bg-slate-700";
    }
  };

  // 获取强度文本
  const getStrengthText = (level: string) => {
    switch (level) {
      case "very-strong":
        return "Very Strong";
      case "strong":
        return "Strong";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "weak":
        return "Weak";
      default:
        return "Unknown";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Password Generator
            </h2>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs border-slate-500 text-slate-300"
              >
                {options.isMemorableFriendly ? "Memorable" : "Standard"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          {/* 生成的密码显示 */}
          <Card className="mb-6 bg-slate-700 border-slate-600 text-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Password Generated</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-lg pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className={copied ? "text-green-600" : ""}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button onClick={generatePassword} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              {/* 密码强度显示 */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Password Strength
                    </span>
                    <Badge
                      className={getStrengthColor(passwordStrength.level)}
                      variant="secondary"
                    >
                      {getStrengthText(passwordStrength.level)} (
                      {passwordStrength.score}/100)
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 80
                          ? "bg-green-500"
                          : passwordStrength.score >= 60
                            ? "bg-blue-500"
                            : passwordStrength.score >= 40
                              ? "bg-yellow-500"
                              : passwordStrength.score >= 20
                                ? "bg-orange-500"
                                : "bg-red-500"
                      }`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-slate-400">
                      <div className="flex items-start space-x-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div>
                          {passwordStrength.feedback.map((feedback, index) => (
                            <div key={index}>• {feedback}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 密码生成选项 */}
          <Tabs
            defaultValue="memorable"
            className="w-full"
            onValueChange={(value) => {
              updateOptions("isMemorableFriendly", value === "memorable");
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard" className="cursor-pointer">
                <Zap className="w-4 h-4 mr-2" />
                Standard
              </TabsTrigger>
              <TabsTrigger value="memorable" className="cursor-pointer">
                <Shield className="w-4 h-4 mr-2" />
                Memorable
              </TabsTrigger>
            </TabsList>

            {/* 标准密码选项 */}
            <TabsContent value="standard" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600 text-slate-100">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 密码长度 */}
                  <div className="space-y-2">
                    <Label>Length: {options.length}</Label>
                    <Slider
                      value={[options.length]}
                      onValueChange={(value) =>
                        updateOptions("length", value[0])
                      }
                      min={4}
                      max={128}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>4</span>
                      <span>128</span>
                    </div>
                  </div>

                  {/* 字符类型选择 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeUppercase}
                        onCheckedChange={(checked) =>
                          updateOptions("includeUppercase", checked)
                        }
                      />
                      <Label>Uppercase (A-Z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeLowercase}
                        onCheckedChange={(checked) =>
                          updateOptions("includeLowercase", checked)
                        }
                      />
                      <Label>Lowercase (a-z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeNumbers}
                        onCheckedChange={(checked) =>
                          updateOptions("includeNumbers", checked)
                        }
                      />
                      <Label>Numbers (0-9)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeSymbols}
                        onCheckedChange={(checked) =>
                          updateOptions("includeSymbols", checked)
                        }
                      />
                      <Label>Symbols (!@#$...)</Label>
                    </div>
                  </div>

                  {/* 其他选项 */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.excludeSimilar}
                      onCheckedChange={(checked) =>
                        updateOptions("excludeSimilar", checked)
                      }
                    />
                    <Label>Exclude Similar Characters (il1Lo0O)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 易记忆密码选项 */}
            <TabsContent value="memorable" className="space-y-4">
              <Card className="bg-slate-700 border-slate-600 text-slate-100">
                <CardHeader>
                  <CardTitle>Memorable Password Settings</CardTitle>
                  <p className="text-sm text-slate-300">
                    Generate a password made up of words, easier to remember and
                    manually input
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 单词数量 */}
                  <div className="space-y-2">
                    <Label>
                      Word Count: {options.memorableOptions?.wordCount}
                    </Label>
                    <Slider
                      value={[options.memorableOptions?.wordCount || 4]}
                      onValueChange={(value) =>
                        updateMemorableOptions("wordCount", value[0])
                      }
                      min={2}
                      max={8}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>2</span>
                      <span>8</span>
                    </div>
                  </div>

                  {/* 分隔符选择 */}
                  <div className="space-y-2">
                    <Label>Separator</Label>
                    <Select
                      value={
                        options.memorableOptions?.separator === ""
                          ? "none"
                          : options.memorableOptions?.separator || "-"
                      }
                      onValueChange={(value) =>
                        updateMemorableOptions("separator", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">Hyphen (-)</SelectItem>
                        <SelectItem value="_">Underscore (_)</SelectItem>
                        <SelectItem value=".">Period (.)</SelectItem>
                        <SelectItem value=" ">Space ( )</SelectItem>
                        <SelectItem value="none">No Separator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 其他选项 */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={
                          options.memorableOptions?.includeNumbers || false
                        }
                        onCheckedChange={(checked) =>
                          updateMemorableOptions("includeNumbers", checked)
                        }
                      />
                      <Label>Include Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={
                          options.memorableOptions?.capitalizeWords || false
                        }
                        onCheckedChange={(checked) =>
                          updateMemorableOptions("capitalizeWords", checked)
                        }
                      />
                      <Label>Capitalize Words</Label>
                    </div>
                  </div>

                  {/* 示例说明 */}
                  <div className="bg-blue-900/30 p-3 rounded-lg">
                    <p className="text-sm text-blue-200">
                      <strong>Example:</strong>
                      {options.memorableOptions?.capitalizeWords
                        ? "Apple-Brave-Cloud-42"
                        : "apple-brave-cloud-42"}
                    </p>
                    <p className="text-xs text-blue-300 mt-1">
                      Memorable passwords are better for scenarios that require
                      manual input, but the strength may be lower
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onPasswordGenerated(generatedPassword);
                onClose();
              }}
              disabled={!generatedPassword}
            >
              Use this password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
