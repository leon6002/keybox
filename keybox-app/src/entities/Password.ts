// Mock Password entity for the vault system
// This provides a simple interface that matches the expected API

export interface PasswordData {
  id?: string;
  site_name: string;
  site_url?: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
  is_favorite?: boolean;
  shared_with_family?: boolean;
  last_used?: string;
  strength_score?: number;
}

// Mock data for demonstration
const mockPasswords: PasswordData[] = [
  {
    id: "1",
    site_name: "bitwarden.com",
    site_url: "https://bitwarden.com",
    username: "abc@gmail.com",
    password: "SecurePass123!",
    category: "other",
    is_favorite: true,
    shared_with_family: false,
    last_used: new Date().toISOString(),
    strength_score: 85,
  },
  {
    id: "2",
    site_name: "gmail.com",
    site_url: "https://gmail.com",
    username: "glc@gmail.com",
    password: "AnotherPass456!",
    category: "email",
    is_favorite: false,
    shared_with_family: true,
    last_used: new Date().toISOString(),
    strength_score: 65,
  },
  {
    id: "3",
    site_name: "Personal Account",
    site_url: "",
    username: "john.doe@gmail.com",
    password: "WeakPass123",
    category: "personal",
    is_favorite: true,
    shared_with_family: false,
    last_used: new Date().toISOString(),
    strength_score: 45,
  },
];

export class Password {
  static async list(sortBy?: string): Promise<PasswordData[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const passwords = [...mockPasswords];

    // Simple sorting logic
    if (sortBy === "-last_used") {
      passwords.sort(
        (a, b) =>
          new Date(b.last_used || 0).getTime() -
          new Date(a.last_used || 0).getTime()
      );
    }

    return passwords;
  }

  static async create(data: PasswordData): Promise<PasswordData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newPassword: PasswordData = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      last_used: new Date().toISOString(),
    };

    mockPasswords.push(newPassword);
    return newPassword;
  }

  static async update(
    id: string,
    data: Partial<PasswordData>
  ): Promise<PasswordData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockPasswords.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Password not found");
    }

    mockPasswords[index] = { ...mockPasswords[index], ...data };
    return mockPasswords[index];
  }

  static async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockPasswords.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Password not found");
    }

    mockPasswords.splice(index, 1);
  }
}
