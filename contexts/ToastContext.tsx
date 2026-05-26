"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useToast, Toast, ToastType } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToast();

  const value = useMemo(() => ({ toasts, addToast }), [toasts, addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used inside <ToastProvider>");
  return ctx;
}
