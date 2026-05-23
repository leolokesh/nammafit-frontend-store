"use client";

import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import type { Toast, ToastType } from "@/hooks/useToast";

const config: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; bg: string; text: string }
> = {
  success: {
    icon: <CheckCircle size={18} />,
    bar: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-400",
  },
  error: {
    icon: <XCircle size={18} />,
    bar: "bg-rose-500",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-400",
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bar: "bg-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
  },
  info: {
    icon: <Info size={18} />,
    bar: "bg-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-400",
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const c = config[toast.type];
  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg animate-slide-up overflow-hidden ${c.bg}`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${c.text}`}>{c.icon}</div>
      <p className="text-sm text-slate-200 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors"
      >
        <X size={14} />
      </button>
      {/* Animated progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 ${c.bar} animate-toast-progress`} />
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
