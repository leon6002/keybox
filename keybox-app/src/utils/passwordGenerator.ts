import { PasswordGenerator } from "@/types/password";

// 密码生成器类
export class PasswordGeneratorUtil {
  private static readonly UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private static readonly LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
  private static readonly NUMBERS = "0123456789";
  private static readonly SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  private static readonly SIMILAR_CHARS = "il1Lo0O";

  // 生成密码
  static generatePassword(options: PasswordGenerator): string {
    // 如果选择了易记忆密码，使用不同的生成方式
    if (options.isMemorableFriendly && options.memorableOptions) {
      return this.generateMemorablePassword(
        options.memorableOptions.wordCount,
        options.memorableOptions.separator,
        options.memorableOptions.includeNumbers,
        options.memorableOptions.capitalizeWords
      );
    }

    let charset = "";

    if (options.includeUppercase) charset += this.UPPERCASE;
    if (options.includeLowercase) charset += this.LOWERCASE;
    if (options.includeNumbers) charset += this.NUMBERS;
    if (options.includeSymbols) charset += this.SYMBOLS;

    if (charset === "") {
      throw new Error("至少需要选择一种字符类型");
    }

    // 排除相似字符
    if (options.excludeSimilar) {
      charset = charset
        .split("")
        .filter((char) => !this.SIMILAR_CHARS.includes(char))
        .join("");
    }

    let password = "";

    // 确保至少包含每种选中的字符类型
    const requiredChars: string[] = [];
    if (options.includeUppercase) {
      const upperChars = options.excludeSimilar
        ? this.UPPERCASE.split("").filter(
            (char) => !this.SIMILAR_CHARS.includes(char)
          )
        : this.UPPERCASE.split("");
      requiredChars.push(
        upperChars[Math.floor(Math.random() * upperChars.length)]
      );
    }
    if (options.includeLowercase) {
      const lowerChars = options.excludeSimilar
        ? this.LOWERCASE.split("").filter(
            (char) => !this.SIMILAR_CHARS.includes(char)
          )
        : this.LOWERCASE.split("");
      requiredChars.push(
        lowerChars[Math.floor(Math.random() * lowerChars.length)]
      );
    }
    if (options.includeNumbers) {
      const numberChars = options.excludeSimilar
        ? this.NUMBERS.split("").filter(
            (char) => !this.SIMILAR_CHARS.includes(char)
          )
        : this.NUMBERS.split("");
      requiredChars.push(
        numberChars[Math.floor(Math.random() * numberChars.length)]
      );
    }
    if (options.includeSymbols) {
      requiredChars.push(
        this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)]
      );
    }

    // 生成剩余字符
    const remainingLength = options.length - requiredChars.length;
    for (let i = 0; i < remainingLength; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 将必需字符添加到密码中
    password += requiredChars.join("");

    // 打乱密码字符顺序
    return this.shuffleString(password);
  }

  // 打乱字符串
  private static shuffleString(str: string): string {
    const array = str.split("");
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join("");
  }

  // 评估密码强度
  static evaluatePasswordStrength(password: string): {
    score: number;
    level: "weak" | "fair" | "good" | "strong" | "very-strong";
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // 长度检查
    if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
    } else {
      feedback.push("密码长度至少应为8位");
    }

    // 字符类型检查
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    const charTypeCount = [
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSymbols,
    ].filter(Boolean).length;
    score += charTypeCount * 15;

    if (!hasUppercase) feedback.push("建议包含大写字母");
    if (!hasLowercase) feedback.push("建议包含小写字母");
    if (!hasNumbers) feedback.push("建议包含数字");
    if (!hasSymbols) feedback.push("建议包含特殊符号");

    // 重复字符检查
    const repeatedChars = password.match(/(.)\1{2,}/g);
    if (repeatedChars) {
      score -= repeatedChars.length * 10;
      feedback.push("避免连续重复字符");
    }

    // 常见模式检查
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
      /admin/i,
    ];

    commonPatterns.forEach((pattern) => {
      if (pattern.test(password)) {
        score -= 20;
        feedback.push("避免使用常见模式");
      }
    });

    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));

    // 确定强度等级
    let level: "weak" | "fair" | "good" | "strong" | "very-strong";
    if (score >= 80) level = "very-strong";
    else if (score >= 60) level = "strong";
    else if (score >= 40) level = "good";
    else if (score >= 20) level = "fair";
    else level = "weak";

    return { score, level, feedback };
  }

  // 生成记忆友好的密码
  static generateMemorablePassword(
    wordCount: number = 4,
    separator: string = "-",
    includeNumbers: boolean = true,
    capitalizeWords: boolean = false
  ): string {
    const words = [
      "apple",
      "brave",
      "cloud",
      "dance",
      "eagle",
      "flame",
      "grace",
      "happy",
      "island",
      "jungle",
      "knight",
      "light",
      "magic",
      "noble",
      "ocean",
      "peace",
      "quiet",
      "river",
      "storm",
      "tiger",
      "unity",
      "voice",
      "water",
      "youth",
      "zebra",
      "anchor",
      "bridge",
      "castle",
      "dragon",
      "forest",
      "garden",
      "harbor",
      "sunset",
      "mountain",
      "flower",
      "silver",
      "golden",
      "crystal",
      "rainbow",
      "thunder",
      "whisper",
      "shadow",
      "bright",
      "gentle",
      "strong",
      "swift",
      "clever",
      "wisdom",
      "freedom",
      "journey",
      "wonder",
      "spirit",
      "nature",
      "beauty",
      "harmony",
    ];

    const selectedWords: string[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < wordCount; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * words.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      let word = words[randomIndex];

      if (capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      selectedWords.push(word);
    }

    let password = selectedWords.join(separator);

    if (includeNumbers) {
      const randomNumber = Math.floor(Math.random() * 1000);
      password += separator + randomNumber.toString().padStart(2, "0");
    }

    return password;
  }

  // 检查密码是否在常见密码列表中
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      "123456",
      "password",
      "123456789",
      "12345678",
      "12345",
      "1234567",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
      "dragon",
      "master",
      "hello",
      "freedom",
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  // 生成安全问题答案
  static generateSecurityAnswer(
    question: string,
    personalInfo: string
  ): string {
    // 这里可以基于问题和个人信息生成一个安全的答案
    // 实际应用中可能需要更复杂的逻辑
    const hash = this.simpleHash(question + personalInfo);
    return hash.substring(0, 12);
  }

  // 简单哈希函数（仅用于演示）
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  // 获取默认密码生成选项
  static getDefaultOptions(): PasswordGenerator {
    return {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      isMemorableFriendly: true,
      memorableOptions: {
        wordCount: 3,
        separator: "-",
        includeNumbers: true,
        capitalizeWords: true,
      },
    };
  }
}
