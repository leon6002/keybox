"use client";

// Security system test page
// This page helps verify that the new encrypted database system is working

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInGuard } from "@/components/auth/AuthGuard";
import AuthGuard from "@/components/auth/AuthGuard";
import EncryptionSetupModal from "@/components/auth/EncryptionSetupModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Shield,
  Key,
  Users,
} from "lucide-react";
import {
  initializeDatabaseService,
  testDatabaseConnection,
  getDatabaseHealth,
} from "@/lib/database";
import { SecurityHealthCheck, SecurityServiceFactory } from "@/lib/security";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function SecurityTestPage() {
  return (
    <SignInGuard>
      <SecurityTestContent />
    </SignInGuard>
  );
}

// Temporary test component to force show modal
function TestEncryptionModal() {
  const [showModal, setShowModal] = useState(true);
  return (
    <div>
      <button onClick={() => setShowModal(true)}>Show Modal</button>
      <EncryptionSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

function SecurityTestContent() {
  const { isAuthenticated, user, needsEncryptionSetup, isVaultLocked } =
    useAuth();

  // Debug the auth state in the component
  useEffect(() => {
    console.log("🧪 SecurityTestContent auth state:", {
      isAuthenticated,
      needsEncryptionSetup,
      isVaultLocked,
      user: user?.googleUser?.email,
    });
  }, [isAuthenticated, needsEncryptionSetup, isVaultLocked, user]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<
    "pending" | "success" | "error" | "warning"
  >("pending");

  const initialTests: TestResult[] = [
    {
      name: "Database Connection",
      status: "pending",
      message: "Testing connection to Supabase...",
    },
    {
      name: "Database Schema",
      status: "pending",
      message: "Checking required tables...",
    },
    {
      name: "Security Services",
      status: "pending",
      message: "Initializing encryption services...",
    },
    {
      name: "Web Crypto API",
      status: "pending",
      message: "Checking browser crypto support...",
    },
    {
      name: "Database Service",
      status: "pending",
      message: "Initializing database service...",
    },
  ];

  useEffect(() => {
    setTests(initialTests);
  }, []);

  const updateTest = (
    name: string,
    status: TestResult["status"],
    message: string,
    details?: any
  ) => {
    setTests((prev) =>
      prev.map((test) =>
        test.name === name ? { ...test, status, message, details } : test
      )
    );
  };

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus("pending");
    setTests(initialTests);

    try {
      // Test 1: Database Connection
      updateTest("Database Connection", "pending", "Connecting to Supabase...");
      const connectionResult = await testDatabaseConnection();
      if (connectionResult) {
        updateTest(
          "Database Connection",
          "success",
          "Successfully connected to Supabase"
        );
      } else {
        updateTest(
          "Database Connection",
          "error",
          "Failed to connect to Supabase"
        );
        setOverallStatus("error");
        return;
      }

      // Test 2: Database Schema
      updateTest("Database Schema", "pending", "Checking database schema...");
      const healthResult = await getDatabaseHealth();
      if (healthResult.isHealthy) {
        updateTest(
          "Database Schema",
          "success",
          `Found ${healthResult.tables.length} tables`,
          {
            tables: healthResult.tables,
          }
        );
      } else {
        updateTest(
          "Database Schema",
          "warning",
          `Schema issues found: ${healthResult.issues.join(", ")}`,
          {
            tables: healthResult.tables,
            issues: healthResult.issues,
          }
        );
      }

      // Test 3: Web Crypto API
      updateTest(
        "Web Crypto API",
        "pending",
        "Checking browser crypto support..."
      );
      const browserSecurity = SecurityHealthCheck.checkBrowserSecurity();
      if (browserSecurity.webCrypto && browserSecurity.secureContext) {
        updateTest(
          "Web Crypto API",
          "success",
          "Browser crypto support available"
        );
      } else {
        updateTest(
          "Web Crypto API",
          "error",
          "Browser crypto support missing",
          browserSecurity
        );
        setOverallStatus("error");
        return;
      }

      // Test 4: Security Services
      updateTest(
        "Security Services",
        "pending",
        "Initializing security services..."
      );
      try {
        await SecurityServiceFactory.initializeServices();
        const securityHealth = await SecurityHealthCheck.checkSecurityHealth();
        updateTest(
          "Security Services",
          "success",
          `Security status: ${securityHealth.status}`,
          securityHealth
        );
      } catch (error) {
        updateTest(
          "Security Services",
          "error",
          `Security initialization failed: ${error.message}`
        );
        setOverallStatus("error");
        return;
      }

      // Test 5: Database Service
      updateTest(
        "Database Service",
        "pending",
        "Initializing database service..."
      );
      try {
        await initializeDatabaseService();
        updateTest(
          "Database Service",
          "success",
          "Database service initialized successfully"
        );
      } catch (error) {
        updateTest(
          "Database Service",
          "error",
          `Database service failed: ${error.message}`
        );
        setOverallStatus("error");
        return;
      }

      // All tests passed
      setOverallStatus("success");
    } catch (error) {
      console.error("Test suite error:", error);
      setOverallStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "pending":
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        );
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case "success":
        return "All systems operational! Your KeyBox security architecture is ready.";
      case "error":
        return "Critical issues detected. Please resolve errors before proceeding.";
      case "warning":
        return "Some issues detected, but system should work. Check warnings.";
      case "pending":
      default:
        return 'Click "Run Security Tests" to verify your setup.';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            KeyBox Security Test
          </h1>
          <p className="text-muted-foreground">
            Verify that your encrypted database and security services are
            working correctly
          </p>
        </div>

        {/* Temporary Test Component */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">
              🧪 Manual Modal Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TestEncryptionModal />
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Google Sign-in:</span>
                <Badge
                  variant={isAuthenticated ? "default" : "outline"}
                  className={
                    isAuthenticated ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {isAuthenticated ? "✅ Signed In" : "❌ Not Signed In"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Encryption Setup:</span>
                <Badge
                  variant={!needsEncryptionSetup ? "default" : "outline"}
                  className={
                    !needsEncryptionSetup ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {!needsEncryptionSetup ? "✅ Complete" : "⚠️ Required"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Vault Status:</span>
                <Badge
                  variant={!isVaultLocked ? "default" : "outline"}
                  className={
                    !isVaultLocked ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {!isVaultLocked ? "🔓 Unlocked" : "🔒 Locked"}
                </Badge>
              </div>
              {user?.googleUser && (
                <div className="pt-2 border-t">
                  <p className="font-medium">Signed in as:</p>
                  <p className="text-muted-foreground">
                    {user.googleUser.name} ({user.googleUser.email})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overall Status */}
        <Alert
          className={
            overallStatus === "success"
              ? "border-green-200 bg-green-50"
              : overallStatus === "error"
              ? "border-red-200 bg-red-50"
              : overallStatus === "warning"
              ? "border-yellow-200 bg-yellow-50"
              : "border-blue-200 bg-blue-50"
          }
        >
          <AlertDescription className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            {getOverallStatusMessage()}
          </AlertDescription>
        </Alert>

        {/* Test Controls */}
        <div className="flex justify-center">
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="lg"
            className="min-w-48"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Run Security Tests
              </>
            )}
          </Button>
        </div>

        {/* Test Results */}
        <div className="grid gap-4">
          {tests.map((test, index) => (
            <Card key={test.name} className="transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {test.name === "Database Connection" && (
                      <Database className="h-5 w-5" />
                    )}
                    {test.name === "Database Schema" && (
                      <Database className="h-5 w-5" />
                    )}
                    {test.name === "Security Services" && (
                      <Shield className="h-5 w-5" />
                    )}
                    {test.name === "Web Crypto API" && (
                      <Key className="h-5 w-5" />
                    )}
                    {test.name === "Database Service" && (
                      <Users className="h-5 w-5" />
                    )}
                    {test.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {getStatusIcon(test.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {test.message}
                </CardDescription>
                {test.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        {overallStatus === "success" && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Ready to Go!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-green-700">
                <p>✅ Your KeyBox security system is properly configured</p>
                <p>✅ Database tables are created and accessible</p>
                <p>✅ Encryption services are initialized</p>
                <p>✅ Browser security features are available</p>

                <div className="mt-4 p-3 bg-white rounded border border-green-200">
                  <p className="font-medium text-green-800 mb-2">Next Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                    <li>
                      Your existing password data is still in localStorage
                    </li>
                    <li>
                      Create a user account to start using encrypted storage
                    </li>
                    <li>
                      Migrate your existing passwords to the encrypted database
                    </li>
                    <li>
                      Test creating, editing, and deleting encrypted passwords
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
