"use client";

import React from "react";
import { Shield, Lock, Users, Settings, Plus } from "lucide-react";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigationItems = [
    { name: "Vault", url: "/vault", icon: Shield },
    { name: "Generator", url: "/generator", icon: Plus },
    { name: "Family", url: "/family", icon: Users },
    { name: "Settings", url: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <style>{`
        :root {
          --primary-blue: #1e40af;
          --secondary-blue: #3b82f6;
          --accent-blue: #60a5fa;
          --dark-navy: #1e293b;
          --light-gray: #f8fafc;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .security-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }
      `}</style>

      {/* Top Navigation */}
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/vault" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                SecureVault
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    false
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium hidden sm:block">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
