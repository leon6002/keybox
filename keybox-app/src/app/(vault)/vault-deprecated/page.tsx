"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Password, PasswordData } from "@/entities/Password";
import { User, UserData } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Star,
  Globe,
  CreditCard,
  Briefcase,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PasswordCard from "@/components/vault/PasswordCard";
import AddPasswordModal from "@/components/vault/AddPasswordModal";
import EditPasswordModal from "@/components/vault/EditPasswordModal";
import VaultStats from "@/components/vault/VaultStats";

const categoryIcons: Record<string, any> = {
  social: Globe,
  banking: CreditCard,
  work: Briefcase,
  entertainment: Star,
  shopping: CreditCard,
  email: Globe,
  other: Shield,
};

const categoryColors = {
  social: "bg-blue-100 text-blue-700 border-blue-200",
  banking: "bg-green-100 text-green-700 border-green-200",
  work: "bg-purple-100 text-purple-700 border-purple-200",
  entertainment: "bg-orange-100 text-orange-700 border-orange-200",
  shopping: "bg-pink-100 text-pink-700 border-pink-200",
  email: "bg-cyan-100 text-cyan-700 border-cyan-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Vault() {
  const [passwords, setPasswords] = useState<PasswordData[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const initializeVault = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load passwords inline to avoid circular dependency
      setIsLoading(true);
      try {
        const data = await Password.list("-last_used");
        setPasswords(data);
      } catch (error) {
        console.error("Error loading passwords:", error);
      }
      setIsLoading(false);
    } catch {
      // User not authenticated, redirect to login
      await User.loginWithRedirect(window.location.href);
    }
  }, []);

  useEffect(() => {
    initializeVault();
  }, [initializeVault]);

  const loadPasswords = async () => {
    setIsLoading(true);
    try {
      const data = await Password.list("-last_used");
      setPasswords(data);
    } catch (error) {
      console.error("Error loading passwords:", error);
    }
    setIsLoading(false);
  };

  const handleEditPassword = (password: PasswordData) => {
    setEditingPassword(password);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPassword(null);
  };

  const filteredPasswords = passwords.filter((password) => {
    const matchesSearch =
      password.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || password.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "social",
    "banking",
    "work",
    "entertainment",
    "shopping",
    "email",
    "other",
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Securing your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user.full_name?.split(" ")[0] || "Leo"}
            </h1>
            <p className="text-slate-600">Your secure password vault</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Password
          </Button>
        </div>

        {/* Stats */}
        <VaultStats passwords={passwords} isLoading={isLoading} />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-lg border border-gray-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category] || Shield;
              return (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  {category !== "all" && <Icon className="w-4 h-4 mr-2" />}
                  {category === "all"
                    ? "All"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Password Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-6 shadow-sm animate-pulse border border-gray-200"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredPasswords.length > 0 ? (
              <motion.div
                key="passwords"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPasswords.map((password, index) => (
                  <PasswordCard
                    key={password.id}
                    password={password}
                    index={index}
                    onEdit={handleEditPassword}
                    categoryColors={categoryColors}
                    categoryIcons={categoryIcons}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {searchTerm || selectedCategory !== "all"
                    ? "No passwords found"
                    : "Your vault is empty"}
                </h3>
                <p className="text-slate-600 mb-8">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first password to get started"}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Password
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Add Password Modal */}
        <AddPasswordModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadPasswords}
        />

        {/* Edit Password Modal */}
        <EditPasswordModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          onSuccess={loadPasswords}
          password={editingPassword}
        />
      </div>
    </div>
  );
}
