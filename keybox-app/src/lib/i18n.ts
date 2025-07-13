import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 翻译资源
const resources = {
  en: {
    translation: {
      // 通用
      common: {
        home: "Home",
        passwords: "Passwords",
        manage: "Manage",
        search: "Search",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        close: "Close",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Info",
        yes: "Yes",
        no: "No",
        ok: "OK",
        back: "Back",
        next: "Next",
        previous: "Previous",
        clear: "Clear",
        reset: "Reset",
        copy: "Copy",
        copied: "Copied!",
        show: "Show",
        hide: "Hide",
        generate: "Generate",
        import: "Import",
        export: "Export",
        settings: "Settings",
        help: "Help",
        about: "About",
        language: "Language",
      },

      // 导航
      nav: {
        home: "Home",
        passwordList: "Password List",
        passwordManage: "Password Management",
        categoryManage: "Category Management",
        importExport: "Import/Export",
        clearData: "Clear Data",
        createSampleData: "Create Sample Data",
      },

      // 首页
      home: {
        title: "Secure Management",
        subtitle: "All Your Passwords",
        description:
          "PandaKeyBox is your personal password manager with enterprise-grade encryption technology, making your digital life more secure and convenient.",

        cta: {
          getStarted: "Get Started",
          viewPasswords: "View Passwords",
          addFirstPassword: "Add First Password",
        },
        stats: {
          totalPasswords: "Total Passwords",
          categories: "Categories",
          lastUpdated: "Last Updated",
          savedPasswords: "Saved Passwords",
          categoryCount: "Categories",
          securityLevel: "Enterprise Grade",
          userSatisfaction: "99%",
        },
        features: {
          title: "Why Choose PandaKeyBox?",
          subtitle:
            "We are committed to providing you with the most secure and convenient password management experience, making your digital life more secure.",
          encryption: {
            title: "Enterprise Encryption",
            description:
              "Uses AES-256 encryption algorithm to ensure your password data is absolutely secure",
          },
          generator: {
            title: "Smart Password Generation",
            description:
              "Built-in strong password generator with custom rules and memorable password options",
          },
          sync: {
            title: "Cross-Platform Sync",
            description:
              "Support data import/export, easily sync your password vault across multiple devices",
          },
          organization: {
            title: "Smart Category Management",
            description:
              "Custom category system keeps your passwords organized and easy to find",
          },
          copy: {
            title: "One-Click Copy",
            description:
              "Quickly copy usernames and passwords to improve daily efficiency",
          },
          responsive: {
            title: "Responsive Design",
            description:
              "Perfect for desktop and mobile devices, manage passwords anytime, anywhere",
          },
        },
      },

      // 密码相关
      password: {
        title: "Title",
        username: "Username",
        password: "Password",
        website: "Website",
        description: "Description",
        notes: "Notes",
        category: "Category",
        tags: "Tags",
        favorite: "Favorite",
        createdAt: "Created",
        updatedAt: "Updated",
        addNew: "Add New Password",
        editPassword: "Edit Password",
        deletePassword: "Delete Password",
        copyPassword: "Copy Password",
        showPassword: "Show Password",
        hidePassword: "Hide Password",
        generatePassword: "Generate Password",
        searchPlaceholder: "Search passwords...",
        noPasswords: "No passwords found",
        noPasswordsDesc:
          "You haven't added any passwords yet. Click the button below to add your first password.",
        selectPassword: "Select a password entry",
        selectPasswordDesc:
          "Choose a password from the list to view or edit its details.",
        passwordStrength: "Password Strength",
        weak: "Weak",
        medium: "Medium",
        strong: "Strong",
        veryStrong: "Very Strong",
      },

      // 统计信息
      stats: {
        totalEntries: "Total {{count}} entries",
        totalEntries_one: "Total {{count}} entry",
        totalEntries_other: "Total {{count}} entries",
        showingResults: "Showing {{count}} results",
        showingResults_one: "Showing {{count}} result",
        showingResults_other: "Showing {{count}} results",
        filteredResults: "Filtered: {{count}} passwords",
        filteredResults_one: "Filtered: {{count}} password",
        filteredResults_other: "Filtered: {{count}} passwords",
        searchResults: 'Search: "{{query}}"',
      },

      // 类目
      category: {
        all: "All Categories",
        website: "Website",
        social: "Social Media",
        work: "Work",
        personal: "Personal",
        finance: "Finance",
        shopping: "Shopping",
        entertainment: "Entertainment",
        other: "Other",
        noCategories: "No categories available",
        addCategory: "Add Category",
        editCategory: "Edit Category",
        deleteCategory: "Delete Category",
        categoryName: "Category Name",
        categoryColor: "Category Color",
        categoryIcon: "Category Icon",
      },

      // 操作确认
      confirm: {
        deletePassword: {
          title: "Delete Password",
          description:
            "Are you sure you want to delete this password? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
        },
        clearData: {
          title: "Clear All Data",
          description:
            "Are you sure you want to clear all data? This action cannot be undone. We recommend exporting your data to your computer before clearing, so you can import it back later.",
          confirmText: "Clear",
          cancelText: "Cancel",
        },
      },

      // 错误信息
      error: {
        required: "This field is required",
        invalidEmail: "Invalid email address",
        invalidUrl: "Invalid URL",
        passwordTooShort: "Password must be at least 8 characters",
        passwordTooWeak: "Password is too weak",
        fileNotSupported: "File type not supported",
        importFailed: "Import failed",
        exportFailed: "Export failed",
        saveFailed: "Save failed",
        loadFailed: "Load failed",
        networkError: "Network error",
        unknownError: "Unknown error occurred",
      },

      // 成功信息
      success: {
        passwordSaved: "Password saved successfully",
        passwordDeleted: "Password deleted successfully",
        passwordCopied: "Password copied to clipboard",
        dataImported: "Data imported successfully",
        dataExported: "Data exported successfully",
        dataCleared: "All data cleared successfully",
      },
    },
  },
  zh: {
    translation: {
      // 通用
      common: {
        home: "首页",
        passwords: "密码",
        manage: "管理",
        search: "搜索",
        add: "添加",
        edit: "编辑",
        delete: "删除",
        save: "保存",
        cancel: "取消",
        confirm: "确认",
        close: "关闭",
        loading: "加载中...",
        error: "错误",
        success: "成功",
        warning: "警告",
        info: "信息",
        yes: "是",
        no: "否",
        ok: "确定",
        back: "返回",
        next: "下一步",
        previous: "上一步",
        clear: "清除",
        reset: "重置",
        copy: "复制",
        copied: "已复制！",
        show: "显示",
        hide: "隐藏",
        generate: "生成",
        import: "导入",
        export: "导出",
        settings: "设置",
        help: "帮助",
        about: "关于",
        language: "语言",
      },

      // 导航
      nav: {
        home: "首页",
        passwordList: "密码列表",
        passwordManage: "密码管理",
        categoryManage: "分类管理",
        importExport: "导入/导出",
        clearData: "清除数据",
        createSampleData: "创建示例数据",
      },

      // 首页
      home: {
        title: "安全管理",
        subtitle: "您的所有密码",
        description:
          "PandaKeyBox 是您的专属密码管家，采用企业级加密技术，让您的数字生活更安全、更便捷。",

        cta: {
          getStarted: "开始使用",
          viewPasswords: "查看密码",
          addFirstPassword: "添加第一个密码",
        },
        stats: {
          totalPasswords: "总密码数",
          categories: "分类数",
          lastUpdated: "最后更新",
          savedPasswords: "已保存密码",
          categoryCount: "分类数量",
          securityLevel: "企业级",
          userSatisfaction: "99%",
        },
        features: {
          title: "为什么选择 PandaKeyBox？",
          subtitle:
            "我们致力于为您提供最安全、最便捷的密码管理体验，让您的数字生活更加安心。",
          encryption: {
            title: "企业级加密",
            description: "采用 AES-256 加密算法，确保您的密码数据绝对安全",
          },
          generator: {
            title: "智能密码生成",
            description: "内置强密码生成器，支持自定义规则和记忆友好型密码",
          },
          sync: {
            title: "跨平台同步",
            description: "支持数据导入导出，轻松在多设备间同步您的密码库",
          },
          organization: {
            title: "智能分类管理",
            description: "自定义分类系统，让您的密码井井有条，快速查找",
          },
          copy: {
            title: "一键复制",
            description: "快速复制用户名和密码，提升日常使用效率",
          },
          responsive: {
            title: "响应式设计",
            description: "完美适配桌面和移动设备，随时随地管理密码",
          },
        },
      },

      // 密码相关
      password: {
        title: "标题",
        username: "用户名",
        password: "密码",
        website: "网站",
        description: "描述",
        notes: "备注",
        category: "分类",
        tags: "标签",
        favorite: "收藏",
        createdAt: "创建时间",
        updatedAt: "更新时间",
        addNew: "添加新密码",
        editPassword: "编辑密码",
        deletePassword: "删除密码",
        copyPassword: "复制密码",
        showPassword: "显示密码",
        hidePassword: "隐藏密码",
        generatePassword: "生成密码",
        searchPlaceholder: "搜索密码...",
        noPasswords: "没有找到密码",
        noPasswordsDesc:
          "您还没有添加任何密码。点击下面的按钮添加您的第一个密码。",
        selectPassword: "选择一个密码条目",
        selectPasswordDesc: "从列表中选择一个密码来查看或编辑其详细信息。",
        passwordStrength: "密码强度",
        weak: "弱",
        medium: "中等",
        strong: "强",
        veryStrong: "很强",
      },

      // 统计信息
      stats: {
        totalEntries: "共 {{count}} 个条目",
        showingResults: "显示 {{count}} 个结果",
        filteredResults: "筛选结果：{{count}} 个密码",
        searchResults: '搜索："{{query}}"',
      },

      // 类目
      category: {
        all: "所有类目",
        website: "网站账号",
        social: "社交媒体",
        work: "工作",
        personal: "个人",
        finance: "金融",
        shopping: "购物",
        entertainment: "娱乐",
        other: "其他",
        noCategories: "暂无可筛选的类目",
        addCategory: "添加类目",
        editCategory: "编辑类目",
        deleteCategory: "删除类目",
        categoryName: "类目名称",
        categoryColor: "类目颜色",
        categoryIcon: "类目图标",
      },

      // 操作确认
      confirm: {
        deletePassword: {
          title: "删除密码",
          description: "确定要删除这个密码吗？此操作无法撤销。",
          confirmText: "删除",
          cancelText: "取消",
        },
        clearData: {
          title: "清除所有数据",
          description:
            "确定要清除所有数据吗？此操作无法撤销。建议在清除之前先导出数据文件到您的电脑，后续可随时通过该文件直接导入。",
          confirmText: "清除",
          cancelText: "取消",
        },
      },

      // 错误信息
      error: {
        required: "此字段为必填项",
        invalidEmail: "无效的邮箱地址",
        invalidUrl: "无效的网址",
        passwordTooShort: "密码至少需要8个字符",
        passwordTooWeak: "密码强度太弱",
        fileNotSupported: "不支持的文件类型",
        importFailed: "导入失败",
        exportFailed: "导出失败",
        saveFailed: "保存失败",
        loadFailed: "加载失败",
        networkError: "网络错误",
        unknownError: "发生未知错误",
      },

      // 成功信息
      success: {
        passwordSaved: "密码保存成功",
        passwordDeleted: "密码删除成功",
        passwordCopied: "密码已复制到剪贴板",
        dataImported: "数据导入成功",
        dataExported: "数据导出成功",
        dataCleared: "所有数据清除成功",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
