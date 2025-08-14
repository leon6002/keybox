import { CustomField } from "@/types/password";

export class PasswordTypeManager {
  // Get fields for specific type
  static getFieldsForType = (typeId: string): CustomField[] => {
    switch (typeId) {
      case "website":
        return [
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: true,
            placeholder: "Enter username",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "Enter password",
            value: "",
          },
          {
            id: "website",
            name: "Website URL",
            type: "url" as const,
            isRequired: false,
            placeholder: "https://example.com",
            value: "",
          },
        ];
      case "banking":
        return [
          {
            id: "account-number",
            name: "Account Number",
            type: "text" as const,
            isRequired: true,
            placeholder: "Enter account number",
            value: "",
          },
          {
            id: "routing-number",
            name: "Routing Number",
            type: "text" as const,
            isRequired: false,
            placeholder: "Enter routing number",
            value: "",
          },
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: false,
            placeholder: "Online banking username",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: false,
            placeholder: "Online banking password",
            value: "",
          },
          {
            id: "website",
            name: "Bank Website",
            type: "url" as const,
            isRequired: false,
            placeholder: "https://bank.com",
            value: "",
          },
        ];
      case "credit-card":
        return [
          {
            id: "card-number",
            name: "Card Number",
            type: "text" as const,
            isRequired: true,
            placeholder: "1234 5678 9012 3456",
            value: "",
          },
          {
            id: "cardholder-name",
            name: "Cardholder Name",
            type: "text" as const,
            isRequired: true,
            placeholder: "John Doe",
            value: "",
          },
          {
            id: "expiry-date",
            name: "Expiry Date",
            type: "text" as const,
            isRequired: true,
            placeholder: "MM/YY",
            value: "",
          },
          {
            id: "cvv",
            name: "CVV",
            type: "password" as const,
            isRequired: true,
            placeholder: "123",
            value: "",
          },
          {
            id: "pin",
            name: "PIN",
            type: "password" as const,
            isRequired: false,
            placeholder: "1234",
            value: "",
          },
        ];
      case "social":
        return [
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: true,
            placeholder: "Enter username",
            value: "",
          },
          {
            id: "email",
            name: "Email",
            type: "email" as const,
            isRequired: false,
            placeholder: "user@example.com",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "Enter password",
            value: "",
          },
          {
            id: "website",
            name: "Platform URL",
            type: "url" as const,
            isRequired: false,
            placeholder: "https://platform.com",
            value: "",
          },
        ];
      case "email":
        return [
          {
            id: "email",
            name: "Email Address",
            type: "email" as const,
            isRequired: true,
            placeholder: "user@example.com",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "Enter password",
            value: "",
          },
          {
            id: "smtp-server",
            name: "SMTP Server",
            type: "text" as const,
            isRequired: false,
            placeholder: "smtp.example.com",
            value: "",
          },
          {
            id: "imap-server",
            name: "IMAP Server",
            type: "text" as const,
            isRequired: false,
            placeholder: "imap.example.com",
            value: "",
          },
        ];
      case "database":
        return [
          {
            id: "host",
            name: "Host",
            type: "text" as const,
            isRequired: true,
            placeholder: "localhost or IP address",
            value: "",
          },
          {
            id: "port",
            name: "Port",
            type: "number" as const,
            isRequired: false,
            placeholder: "3306",
            value: "",
          },
          {
            id: "database",
            name: "Database Name",
            type: "text" as const,
            isRequired: false,
            placeholder: "database_name",
            value: "",
          },
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: true,
            placeholder: "db_user",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "db_password",
            value: "",
          },
        ];
      case "server":
        return [
          {
            id: "server-name",
            name: "Server Name",
            type: "text" as const,
            isRequired: true,
            placeholder: "server.example.com",
            value: "",
          },
          {
            id: "ip-address",
            name: "IP Address",
            type: "text" as const,
            isRequired: false,
            placeholder: "192.168.1.100",
            value: "",
          },
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: true,
            placeholder: "admin",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "server_password",
            value: "",
          },
          {
            id: "ssh-port",
            name: "SSH Port",
            type: "number" as const,
            isRequired: false,
            placeholder: "22",
            value: "",
          },
        ];
      case "wifi":
        return [
          {
            id: "network-name",
            name: "Network Name (SSID)",
            type: "text" as const,
            isRequired: true,
            placeholder: "WiFi Network Name",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: true,
            placeholder: "WiFi Password",
            value: "",
          },
          {
            id: "security",
            name: "Security Type",
            type: "text" as const,
            isRequired: false,
            placeholder: "WPA2/WPA3",
            value: "",
          },
          {
            id: "location",
            name: "Location",
            type: "text" as const,
            isRequired: false,
            placeholder: "Home/Office",
            value: "",
          },
        ];
      case "software":
        return [
          {
            id: "software-name",
            name: "Software Name",
            type: "text" as const,
            isRequired: true,
            placeholder: "Software Name",
            value: "",
          },
          {
            id: "license-key",
            name: "License Key",
            type: "text" as const,
            isRequired: true,
            placeholder: "XXXXX-XXXXX-XXXXX",
            value: "",
          },
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: false,
            placeholder: "Username",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: false,
            placeholder: "Password",
            value: "",
          },
          {
            id: "version",
            name: "Version",
            type: "text" as const,
            isRequired: false,
            placeholder: "1.0.0",
            value: "",
          },
        ];
      default: // "other"
        return [
          {
            id: "title",
            name: "Title",
            type: "text" as const,
            isRequired: true,
            placeholder: "Enter title",
            value: "",
          },
          {
            id: "username",
            name: "Username",
            type: "text" as const,
            isRequired: false,
            placeholder: "Enter username",
            value: "",
          },
          {
            id: "password",
            name: "Password",
            type: "password" as const,
            isRequired: false,
            placeholder: "Enter password",
            value: "",
          },
        ];
    }
  };

  static getDefaultFields = (): CustomField[] => {
    return this.getFieldsForType("website");
  };
}
