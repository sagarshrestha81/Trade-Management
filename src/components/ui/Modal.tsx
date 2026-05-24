import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#040814]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content Wrapper */}
      <div className={`relative w-full ${sizeClasses[size]} transform rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl transition-all duration-300 animate-fade-in flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-6 py-4">
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-[#1a2336] hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-slate-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--card-border)] bg-[#0d1324]/30 px-6 py-4 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
