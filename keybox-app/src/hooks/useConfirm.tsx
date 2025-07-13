"use client";

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "destructive";
  resolve?: (value: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "确认",
    cancelText: "取消",
    variant: "default",
  });

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || "确认操作",
        description: options.description || "您确定要执行此操作吗？",
        confirmText: options.confirmText || "确认",
        cancelText: options.cancelText || "取消",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: undefined }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: undefined }));
  }, [state.resolve]);

  const ConfirmDialog = useCallback(() => (
    <AlertDialog open={state.isOpen} onOpenChange={(open) => {
      if (!open) {
        handleCancel();
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {state.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {state.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={state.variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {state.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [state, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
}

// 便捷的确认函数
export const confirmAction = (options: ConfirmOptions = {}): Promise<boolean> => {
  // 这个函数需要在组件外部使用时，需要一个全局的确认对话框提供者
  // 暂时保留原有的 confirm 作为后备
  return new Promise((resolve) => {
    const result = window.confirm(options.description || "您确定要执行此操作吗？");
    resolve(result);
  });
};
