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
      console.error("密码生成失败:", error);
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
      console.error("复制失败:", error);
    }
  };

  // 更新选项
  const updateOptions = (key: keyof PasswordGenerator, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // 更新易记忆选项
  const updateMemorableOptions = (key: string, value: any) => {
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
        return "text-gray-600 bg-gray-100";
    }
  };

  // 获取强度文本
  const getStrengthText = (level: string) => {
    switch (level) {
      case "very-strong":
        return "非常强";
      case "strong":
        return "强";
      case "good":
        return "良好";
      case "fair":
        return "一般";
      case "weak":
        return "弱";
      default:
        return "未知";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              密码生成器
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {options.isMemorableFriendly ? "易记忆" : "标准"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          {/* 生成的密码显示 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>生成的密码</span>
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
                  重新生成
                </Button>
              </div>

              {/* 密码强度显示 */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      密码强度
                    </span>
                    <Badge
                      className={getStrengthColor(passwordStrength.level)}
                      variant="secondary"
                    >
                      {getStrengthText(passwordStrength.level)} (
                      {passwordStrength.score}/100)
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400">
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
                标准密码
              </TabsTrigger>
              <TabsTrigger value="memorable" className="cursor-pointer">
                <Shield className="w-4 h-4 mr-2" />
                易记忆密码
              </TabsTrigger>
            </TabsList>

            {/* 标准密码选项 */}
            <TabsContent value="standard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>密码设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 密码长度 */}
                  <div className="space-y-2">
                    <Label>密码长度: {options.length}</Label>
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
                    <div className="flex justify-between text-xs text-gray-500">
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
                      <Label>大写字母 (A-Z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeLowercase}
                        onCheckedChange={(checked) =>
                          updateOptions("includeLowercase", checked)
                        }
                      />
                      <Label>小写字母 (a-z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeNumbers}
                        onCheckedChange={(checked) =>
                          updateOptions("includeNumbers", checked)
                        }
                      />
                      <Label>数字 (0-9)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={options.includeSymbols}
                        onCheckedChange={(checked) =>
                          updateOptions("includeSymbols", checked)
                        }
                      />
                      <Label>特殊符号 (!@#$...)</Label>
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
                    <Label>排除相似字符 (il1Lo0O)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 易记忆密码选项 */}
            <TabsContent value="memorable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>易记忆密码设置</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    生成由单词组成的密码，更容易记忆和手动输入
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 单词数量 */}
                  <div className="space-y-2">
                    <Label>
                      单词数量: {options.memorableOptions?.wordCount}
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
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>2</span>
                      <span>8</span>
                    </div>
                  </div>

                  {/* 分隔符选择 */}
                  <div className="space-y-2">
                    <Label>分隔符</Label>
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
                        <SelectItem value="-">连字符 (-)</SelectItem>
                        <SelectItem value="_">下划线 (_)</SelectItem>
                        <SelectItem value=".">点号 (.)</SelectItem>
                        <SelectItem value=" ">空格 ( )</SelectItem>
                        <SelectItem value="none">无分隔符</SelectItem>
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
                      <Label>包含数字</Label>
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
                      <Label>首字母大写</Label>
                    </div>
                  </div>

                  {/* 示例说明 */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>示例:</strong>
                      {options.memorableOptions?.capitalizeWords
                        ? "Apple-Brave-Cloud-42"
                        : "apple-brave-cloud-42"}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      易记忆密码更适合需要手动输入的场景，但强度可能较低
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={() => {
                onPasswordGenerated(generatedPassword);
                onClose();
              }}
              disabled={!generatedPassword}
            >
              使用此密码
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
