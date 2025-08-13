import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Users, Star } from "lucide-react";

interface VaultStatsProps {
  passwords: any[];
  isLoading: boolean;
}

export default function VaultStats({ passwords, isLoading }: VaultStatsProps) {
  const totalPasswords = passwords.length;
  const weakPasswords = passwords.filter((p) => p.strength_score < 60).length;
  const sharedPasswords = passwords.filter((p) => p.shared_with_family).length;
  const favoritePasswords = passwords.filter((p) => p.is_favorite).length;

  const stats = [
    {
      title: "Total Passwords",
      value: totalPasswords,
      icon: Shield,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Weak Passwords",
      value: weakPasswords,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Shared with Family",
      value: sharedPasswords,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Favorites",
      value: favoritePasswords,
      icon: Star,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoading ? "..." : stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
