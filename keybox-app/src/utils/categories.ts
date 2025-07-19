import { Category, CategoryField } from "@/types/password";
import i18n from "@/lib/i18n";

// 获取国际化的类目模板
export const getLocalizedCategories = (): Omit<
  Category,
  "id" | "createdAt" | "updatedAt"
>[] => {
  const t = i18n.t;

  return [
    {
      name: t("category.templates.general.name"),
      icon: "🔧",
      color: "#6B7280",
      description: t("category.templates.general.description"),
      fields: [
        {
          id: "title",
          name: t("category.templates.general.fields.title"),
          type: "text",
          isRequired: true,
          placeholder: t("category.templates.general.fields.titlePlaceholder"),
        },
        {
          id: "content",
          name: t("category.templates.general.fields.content"),
          type: "textarea",
          isRequired: false,
          placeholder: t(
            "category.templates.general.fields.contentPlaceholder"
          ),
        },
        {
          id: "notes",
          name: t("category.templates.general.fields.notes"),
          type: "textarea",
          isRequired: false,
          placeholder: t("category.templates.general.fields.notesPlaceholder"),
        },
      ],
    },
    {
      name: t("category.templates.website.name"),
      icon: "🌐",
      color: "#3B82F6",
      description: t("category.templates.website.description"),
      fields: [
        {
          id: "username",
          name: t("category.templates.website.fields.username"),
          type: "text",
          isRequired: true,
          placeholder: t(
            "category.templates.website.fields.usernamePlaceholder"
          ),
        },
        {
          id: "password",
          name: t("category.templates.website.fields.password"),
          type: "password",
          isRequired: true,
          placeholder: t(
            "category.templates.website.fields.passwordPlaceholder"
          ),
        },
        {
          id: "website",
          name: t("category.templates.website.fields.website"),
          type: "url",
          isRequired: false,
          placeholder: t(
            "category.templates.website.fields.websitePlaceholder"
          ),
        },
        {
          id: "email",
          name: t("category.templates.website.fields.email"),
          type: "email",
          isRequired: false,
          placeholder: t("category.templates.website.fields.emailPlaceholder"),
        },
      ],
    },
  ];
};

// 为了向后兼容，保留原始的 DEFAULT_CATEGORIES
export const DEFAULT_CATEGORIES: Omit<
  Category,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "通用",
    icon: "🔧",
    color: "#6B7280",
    description: "通用类型，适用于各种信息",
    fields: [
      {
        id: "title",
        name: "标题",
        type: "text",
        isRequired: true,
        placeholder: "输入标题",
      },
      {
        id: "content",
        name: "内容",
        type: "textarea",
        isRequired: false,
        placeholder: "输入内容",
      },
      {
        id: "notes",
        name: "备注",
        type: "textarea",
        isRequired: false,
        placeholder: "其他备注信息",
      },
    ],
  },
  {
    name: "网站账号",
    icon: "🌐",
    color: "#3B82F6",
    description: "网站、应用程序的登录账号",
    fields: [
      {
        id: "username",
        name: "用户名",
        type: "text",
        isRequired: true,
        placeholder: "输入用户名或邮箱",
      },
      {
        id: "password",
        name: "密码",
        type: "password",
        isRequired: true,
        placeholder: "输入密码",
      },
      {
        id: "website",
        name: "网站地址",
        type: "url",
        isRequired: false,
        placeholder: "https://example.com",
      },
      {
        id: "email",
        name: "邮箱",
        type: "email",
        isRequired: false,
        placeholder: "user@example.com",
      },
    ],
  },
  {
    name: "数据库",
    icon: "🗄️",
    color: "#10B981",
    description: "数据库连接信息",
    fields: [
      {
        id: "host",
        name: "主机地址",
        type: "text",
        isRequired: true,
        placeholder: "localhost 或 IP 地址",
      },
      {
        id: "port",
        name: "端口",
        type: "number",
        isRequired: false,
        placeholder: "3306",
        defaultValue: "3306",
      },
      {
        id: "database",
        name: "数据库名",
        type: "text",
        isRequired: true,
        placeholder: "数据库名称",
      },
      {
        id: "username",
        name: "用户名",
        type: "text",
        isRequired: true,
        placeholder: "数据库用户名",
      },
      {
        id: "password",
        name: "密码",
        type: "password",
        isRequired: true,
        placeholder: "数据库密码",
      },
    ],
  },
  {
    name: "银行卡",
    icon: "💳",
    color: "#F59E0B",
    description: "银行卡和金融账户信息",
    fields: [
      {
        id: "cardNumber",
        name: "卡号",
        type: "text",
        isRequired: true,
        placeholder: "银行卡号",
      },
      {
        id: "cardHolder",
        name: "持卡人",
        type: "text",
        isRequired: true,
        placeholder: "持卡人姓名",
      },
      {
        id: "expiryDate",
        name: "有效期",
        type: "date",
        isRequired: false,
        placeholder: "MM/YY",
      },
      {
        id: "cvv",
        name: "CVV",
        type: "password",
        isRequired: false,
        placeholder: "安全码",
      },
      {
        id: "pin",
        name: "PIN码",
        type: "password",
        isRequired: false,
        placeholder: "取款密码",
      },
      {
        id: "bankName",
        name: "银行名称",
        type: "text",
        isRequired: false,
        placeholder: "开户银行",
      },
    ],
  },
  {
    name: "个人信息",
    icon: "👤",
    color: "#8B5CF6",
    description: "个人重要信息和纪念日",
    fields: [
      {
        id: "name",
        name: "姓名",
        type: "text",
        isRequired: true,
        placeholder: "姓名",
      },
      {
        id: "birthday",
        name: "生日",
        type: "date",
        isRequired: false,
        placeholder: "生日日期",
      },
      {
        id: "phone",
        name: "电话",
        type: "phone",
        isRequired: false,
        placeholder: "手机号码",
      },
      {
        id: "idNumber",
        name: "身份证号",
        type: "password",
        isRequired: false,
        placeholder: "身份证号码",
      },
      {
        id: "address",
        name: "地址",
        type: "textarea",
        isRequired: false,
        placeholder: "详细地址",
      },
    ],
  },
  {
    name: "服务器",
    icon: "🖥️",
    color: "#EF4444",
    description: "服务器和远程连接信息",
    fields: [
      {
        id: "host",
        name: "主机地址",
        type: "text",
        isRequired: true,
        placeholder: "IP 地址或域名",
      },
      {
        id: "port",
        name: "端口",
        type: "number",
        isRequired: false,
        placeholder: "22",
        defaultValue: "22",
      },
      {
        id: "username",
        name: "用户名",
        type: "text",
        isRequired: true,
        placeholder: "root",
      },
      {
        id: "password",
        name: "密码",
        type: "password",
        isRequired: false,
        placeholder: "登录密码",
      },
      {
        id: "privateKey",
        name: "私钥",
        type: "textarea",
        isRequired: false,
        placeholder: "SSH 私钥内容",
      },
    ],
  },
  {
    name: "WiFi",
    icon: "📶",
    color: "#06B6D4",
    description: "WiFi 网络连接信息",
    fields: [
      {
        id: "ssid",
        name: "网络名称",
        type: "text",
        isRequired: true,
        placeholder: "WiFi 名称 (SSID)",
      },
      {
        id: "password",
        name: "密码",
        type: "password",
        isRequired: true,
        placeholder: "WiFi 密码",
      },
      {
        id: "security",
        name: "加密方式",
        type: "text",
        isRequired: false,
        placeholder: "WPA2/WPA3",
        defaultValue: "WPA2",
      },
      {
        id: "location",
        name: "位置",
        type: "text",
        isRequired: false,
        placeholder: "网络位置",
      },
    ],
  },
];

// 类目管理工具类
export class CategoryManager {
  // 生成唯一 ID
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 创建新类目
  static createCategory(
    categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Category {
    const now = new Date().toISOString();
    return {
      ...categoryData,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
  }

  // 创建新字段
  static createField(fieldData: Omit<CategoryField, "id">): CategoryField {
    return {
      ...fieldData,
      id: this.generateId(),
    };
  }

  // 获取默认类目
  static getDefaultCategories(): Category[] {
    return DEFAULT_CATEGORIES.map((category) => this.createCategory(category));
  }

  // 验证类目数据
  static validateCategory(category: Category): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!category.name.trim()) {
      errors.push("类目名称不能为空");
    }

    if (!category.icon.trim()) {
      errors.push("类目图标不能为空");
    }

    if (!category.color.trim()) {
      errors.push("类目颜色不能为空");
    }

    if (category.fields.length === 0) {
      errors.push("至少需要一个字段");
    }

    // 验证字段
    category.fields.forEach((field, index) => {
      if (!field.name.trim()) {
        errors.push(`第 ${index + 1} 个字段名称不能为空`);
      }
    });

    // 检查字段名称重复
    const fieldNames = category.fields.map((f) => f.name.toLowerCase());
    const duplicates = fieldNames.filter(
      (name, index) => fieldNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      errors.push("字段名称不能重复");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 获取字段类型的显示名称
  static getFieldTypeLabel(type: CategoryField["type"]): string {
    const labels = {
      text: "文本",
      password: "密码",
      email: "邮箱",
      url: "网址",
      textarea: "多行文本",
      number: "数字",
      date: "日期",
      phone: "电话",
    };
    return labels[type] || type;
  }

  // 获取字段类型的图标
  static getFieldTypeIcon(type: CategoryField["type"]): string {
    const icons = {
      text: "📝",
      password: "🔒",
      email: "📧",
      url: "🔗",
      textarea: "📄",
      number: "🔢",
      date: "📅",
      phone: "📞",
    };
    return icons[type] || "📝";
  }
}
