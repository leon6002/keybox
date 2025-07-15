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
        start: "Start",
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
        pricing: "Pricing",
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

      // 导入导出
      importExport: {
        title: "Import/Export",
        import: "Import",
        export: "Export",
        quickImport: "Quick Import",
        quickExport: "Quick Export",
        advancedImportExport: "Advanced Import/Export",

        // 导入相关
        importData: "Import Data",
        selectFile: "Select File",
        dragDropFile: "Drag and drop file here, or click to select",
        supportedFormats: "Supported formats: JSON, KBX",
        importing: "Importing data...",
        importSuccess: "Successfully imported {{count}} password entries",
        importFailed: "Import failed",

        // 导出相关
        exportData: "Export Data",
        exportComplete: "Export Complete (JSON)",
        exportEncrypted: "Export Encrypted (KBX)",
        includePasswords: "Include passwords",
        excludePasswords: "Exclude passwords (structure only)",

        // 加密相关
        encryptionPassword: "Encryption Password",
        decryptionPassword: "Decryption Password",
        enterPassword: "Enter password",
        confirmPassword: "Confirm password",
        passwordRequired: "Password is required for encrypted files",
        encryptExport: "Encrypt Export",
        decryptImport: "Decrypt Import",
        generatePassword: "Generate Password",
        showPassword: "Show Password",
        hidePassword: "Hide Password",

        // 警告和提示
        encryptionWarning:
          "This password is specifically for encrypting export data and will be needed for import. Please remember this password as the app does not store it.",
        fileTypeError: "Please select JSON or KBX format files",
        clearAllData: "Clear All Data",
        clearAllDataConfirm:
          "Are you sure you want to clear all data? This action cannot be undone!",

        // 按钮
        startImport: "Start Import",
        startExport: "Start Export",
        cancel: "Cancel",
        close: "Close",
      },

      // 支付相关
      payment: {
        success: {
          title: "Payment Successful!",
          description:
            "Thank you for your purchase! Your premium features have been activated.",
          featuresUnlocked: "Features Unlocked",
          autoRedirect: "Redirecting to homepage in {{seconds}} seconds",
        },
        cancel: {
          title: "Payment Cancelled",
          description:
            "Your payment has been cancelled. No charges were made. You can try purchasing premium features again at any time.",
          whyUpgrade: "Why Upgrade to Premium?",
          tryAgain: "Try Again",
        },
      },

      // 定价页面
      pricing: {
        title: "Choose Your Plan",
        subtitle:
          "Start with free, upgrade to Pro anytime to unlock powerful features",
        popular: "Most Popular",

        free: {
          name: "Free",
          price: "Free",
          description: "Perfect for personal basic use",
          feature1: "Up to 50 passwords",
          feature2: "Basic encryption",
          feature3: "Local storage",
          feature4: "Basic import/export",
          button: "Current Plan",
        },

        pro: {
          name: "Professional",
          price: "$0.99/month",
          description: "Perfect for professionals and teams",
          feature1: "Unlimited password storage",
          feature2: "Advanced encryption algorithms",
          feature3: "Cloud synchronization",
          feature4: "Advanced import/export",
          feature5: "Password strength analysis",
          feature6: "Priority technical support",
          button: "Upgrade Now",
        },

        enterprise: {
          name: "Enterprise",
          price: "$1.99/month",
          description: "Perfect for large teams and enterprises",
          feature1: "All Professional features",
          feature2: "Team management",
          feature3: "SSO single sign-on",
          feature4: "Audit logs",
          feature5: "API access",
          feature6: "24/7 dedicated support",
          button: "Contact Sales",
        },

        features: {
          title: "Why Choose PandaKeyBox?",
          subtitle:
            "Professional password management to protect your digital life",
          security: {
            title: "Military-grade Encryption",
            description: "AES-256 encryption protects your data",
          },
          sync: {
            title: "Cloud Sync",
            description: "Seamless sync across devices",
          },
          speed: {
            title: "Lightning Fast",
            description: "Millisecond response time",
          },
          support: {
            title: "Professional Support",
            description: "24/7 technical support",
          },
        },
      },

      // 功能特性
      features: {
        unlimitedPasswords: "Unlimited password storage",
        advancedEncryption: "Advanced encryption features",
        cloudSync: "Cloud synchronization",
        prioritySupport: "Priority technical support",
      },

      // 认证相关
      auth: {
        signInWithGoogle: "Sign in with Google",
        loadingGoogle: "Loading Google Sign-In...",
        signingIn: "Signing in...",
        signOut: "Sign Out",

        signin: {
          title: "Sign in to PandaKeyBox",
          subtitle: "Securely manage all your passwords",
          orContinue: "or continue with",
          guestAccess: "Continue as Guest",
          privacyNotice:
            "By signing in, you agree to our Terms of Service and Privacy Policy. We do not store or view your password data.",
        },

        features: {
          title: "Why Choose PandaKeyBox?",
          subtitle:
            "Professional password management to protect your digital life",
          security: {
            title: "Security Protection",
            description:
              "Military-grade encryption protects your password data",
          },
          sync: {
            title: "Cloud Sync",
            description: "Seamlessly sync your passwords across devices",
          },
          privacy: {
            title: "Privacy First",
            description: "We never store or view your passwords",
          },
          speed: {
            title: "Lightning Fast",
            description: "Millisecond response time, smooth user experience",
          },
        },
      },

      // 用户相关
      user: {
        profile: "Profile",
        settings: "Settings",
        premium: "Premium User",
        free: "Free User",
        upgradeToPremium: "Upgrade to Premium",
      },

      // 账户页面
      account: {
        subscription: "Subscription",
        team: "Team",
        manageSubscription: "Manage your subscription and billing details.",
        passwordUsage: "Password Usage",
        viewUsage: "View usage",
        available: "available",
        usedThisMonth: "Used {{used}} of {{total}} this month",
        upgradeToAddMore: "Upgrade to add more passwords",
        billing: "Billing",
        paymentHistory: "Payment history",
        premiumActivated: "Premium activated",
        trialEndDate: "Trial end date",
        noPaymentMethod: "No payment method on file",
        upgradeNow: "Upgrade Now",
        currentPlan: "Current plan",
        trialEndsIn: "Trial ends in {{days}} days",
        showMore: "Show more",
        monthlyTotal: "Monthly total",
        changeSubscription: "Change your subscription",
        switchPlansOrContact:
          "Switch plans or contact sales about Enterprise options",
        changePlan: "Change plan",
        teamFeatures: "Team features are coming soon, stay tuned.",
        teamComingSoon: "Team features coming soon",
        teamDescription:
          "Securely share passwords and credentials with your team.",
        learnMore: "Learn more",
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
        start: "开始",
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
        pricing: "定价",
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

      // 导入导出
      importExport: {
        title: "导入/导出",
        import: "导入",
        export: "导出",
        quickImport: "快速导入",
        quickExport: "快速导出",
        advancedImportExport: "高级导入/导出",

        // 导入相关
        importData: "导入数据",
        selectFile: "选择文件",
        dragDropFile: "拖拽文件到此处，或点击选择文件",
        supportedFormats: "支持格式：JSON、KBX",
        importing: "正在导入数据...",
        importSuccess: "成功导入 {{count}} 个密码条目",
        importFailed: "导入失败",

        // 导出相关
        exportData: "导出数据",
        exportComplete: "导出完整数据 (JSON)",
        exportEncrypted: "导出加密数据 (KBX)",
        includePasswords: "包含密码",
        excludePasswords: "不包含密码（仅结构）",

        // 加密相关
        encryptionPassword: "加密密码",
        decryptionPassword: "解密密码",
        enterPassword: "输入密码",
        confirmPassword: "确认密码",
        passwordRequired: "加密文件需要密码",
        encryptExport: "加密导出",
        decryptImport: "解密导入",
        generatePassword: "生成密码",
        showPassword: "显示密码",
        hidePassword: "隐藏密码",

        // 警告和提示
        encryptionWarning:
          "此密码专门用于加密导出数据，导入时需要使用。请记住此密码，应用不会存储该密码。",
        fileTypeError: "请选择 JSON 或 KBX 格式的文件",
        clearAllData: "清空所有数据",
        clearAllDataConfirm: "确定要清空所有数据吗？此操作不可撤销！",

        // 按钮
        startImport: "开始导入",
        startExport: "开始导出",
        cancel: "取消",
        close: "关闭",
      },

      // 支付相关
      payment: {
        success: {
          title: "支付成功！",
          description: "感谢您的购买！您的高级功能已经激活。",
          featuresUnlocked: "已解锁功能",
          autoRedirect: "{{seconds}} 秒后自动返回首页",
        },
        cancel: {
          title: "支付已取消",
          description:
            "您的支付已被取消，没有产生任何费用。您可以随时重新尝试购买高级功能。",
          whyUpgrade: "升级高级版的好处",
          tryAgain: "重新购买",
        },
      },

      // 定价页面
      pricing: {
        title: "选择适合您的计划",
        subtitle: "从免费版开始，随时升级到专业版解锁更多强大功能",
        popular: "最受欢迎",

        free: {
          name: "免费版",
          price: "免费",
          description: "适合个人基础使用",
          feature1: "最多 50 个密码",
          feature2: "基础加密",
          feature3: "本地存储",
          feature4: "基础导入导出",
          button: "当前计划",
        },

        pro: {
          name: "专业版",
          price: "¥29/月",
          description: "适合专业用户和团队",
          feature1: "无限密码存储",
          feature2: "高级加密算法",
          feature3: "云端同步",
          feature4: "高级导入导出",
          feature5: "密码强度分析",
          feature6: "优先技术支持",
          button: "立即升级",
        },

        enterprise: {
          name: "企业版",
          price: "¥99/月",
          description: "适合大型团队和企业",
          feature1: "专业版所有功能",
          feature2: "团队管理",
          feature3: "SSO 单点登录",
          feature4: "审计日志",
          feature5: "API 访问",
          feature6: "24/7 专属支持",
          button: "联系销售",
        },

        features: {
          title: "为什么选择 PandaKeyBox？",
          subtitle: "专业级密码管理，保护您的数字生活",
          security: {
            title: "军用级加密",
            description: "AES-256 加密保护您的数据",
          },
          sync: {
            title: "云端同步",
            description: "多设备无缝同步",
          },
          speed: {
            title: "极速体验",
            description: "毫秒级响应速度",
          },
          support: {
            title: "专业支持",
            description: "7x24 技术支持",
          },
        },
      },

      // 功能特性
      features: {
        unlimitedPasswords: "无限密码存储",
        advancedEncryption: "高级加密功能",
        cloudSync: "云端同步",
        prioritySupport: "优先技术支持",
      },

      // 认证相关
      auth: {
        signInWithGoogle: "使用 Google 登录",
        loadingGoogle: "正在加载 Google 登录...",
        signingIn: "登录中...",
        signOut: "退出登录",

        signin: {
          title: "登录 PandaKeyBox",
          subtitle: "安全管理您的所有密码",
          orContinue: "或继续使用",
          guestAccess: "以访客身份继续",
          privacyNotice:
            "登录即表示您同意我们的服务条款和隐私政策。我们不会存储或查看您的密码数据。",
        },

        features: {
          title: "为什么选择 PandaKeyBox？",
          subtitle: "专业级密码管理，保护您的数字生活安全",
          security: {
            title: "安全保护",
            description: "军用级加密保护您的密码数据",
          },
          sync: {
            title: "云端同步",
            description: "多设备无缝同步您的密码",
          },
          privacy: {
            title: "隐私优先",
            description: "我们不会存储或查看您的密码",
          },
          speed: {
            title: "极速体验",
            description: "毫秒级响应，流畅使用体验",
          },
        },
      },

      // 用户相关
      user: {
        profile: "个人资料",
        settings: "设置",
        premium: "高级用户",
        free: "免费用户",
        upgradeToPremium: "升级到高级版",
      },

      // 账户页面
      account: {
        subscription: "订阅",
        team: "团队",
        manageSubscription: "管理您的订阅和账单详情。",
        passwordUsage: "密码使用量",
        viewUsage: "查看使用情况",
        available: "可用",
        usedThisMonth: "本月已使用 {{used}} / {{total}}",
        upgradeToAddMore: "升级以添加更多密码",
        billing: "账单",
        paymentHistory: "付款历史",
        premiumActivated: "高级版已激活",
        trialEndDate: "试用结束日期",
        noPaymentMethod: "未设置付款方式",
        upgradeNow: "立即升级",
        currentPlan: "当前计划",
        trialEndsIn: "试用还剩 {{days}} 天",
        showMore: "显示更多",
        monthlyTotal: "月度总计",
        changeSubscription: "更改订阅",
        switchPlansOrContact: "切换计划或联系销售了解企业选项",
        changePlan: "更改计划",
        teamFeatures: "团队功能即将推出，敬请期待。",
        teamComingSoon: "团队功能即将推出",
        teamDescription: "与您的团队安全地共享密码和凭据。",
        learnMore: "了解更多",
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
