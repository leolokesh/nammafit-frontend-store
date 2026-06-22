"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, isLoading]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && !isLoading && onClose()}
    >
      {/* Backdrop with strong blur */}
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity duration-300"
        style={{ backgroundColor: "rgba(3, 7, 7, 0.82)" }}
      />

      {/* Confirmation Panel */}
      <div
        className="relative w-full max-w-[380px] border border-rose-500/10 rounded-3xl p-6 shadow-2xl shadow-rose-950/20 bg-gradient-to-b from-[#0e1c1a] to-[#081211] flex flex-col items-center text-center animate-slide-up"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(244, 63, 94, 0.03)",
        }}
      >
        {/* Warning Icon with double pulsating rings */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/5 animate-ping opacity-75" />
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 relative">
            <AlertTriangle size={24} className="stroke-[2]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-100 tracking-tight mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs text-slate-400 leading-relaxed px-2 mb-6">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold tracking-wide shadow-md shadow-rose-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
