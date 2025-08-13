// Mock User entity for the vault system

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

// Mock user data
const mockUser: UserData = {
  id: "user-1",
  full_name: "Leo Chen",
  email: "leo@example.com",
  avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
};

export class User {
  static async me(): Promise<UserData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockUser;
  }

  static async loginWithRedirect(redirectUrl: string): Promise<void> {
    // In a real implementation, this would redirect to the login page
    console.log("Redirecting to login with redirect URL:", redirectUrl);
    // For demo purposes, we'll just resolve immediately
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  static async logout(): Promise<void> {
    // Simulate logout
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
