"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
  required = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string | number, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between input-field text-left cursor-pointer hover:border-[#B0E4CC]/30 transition-all select-none"
        disabled={disabled}
      >
        <span className={selectedOption ? "text-slate-100" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#B0E4CC]" : ""
          }`}
        />
      </button>

      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ""}
          required
          tabIndex={-1}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          onChange={() => {}}
        />
      )}

      {/* Dropdown Options List */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-full rounded-xl border border-white/10 shadow-2xl z-[1050] py-1 max-h-60 overflow-y-auto animate-fade-in text-left"
          style={{ backgroundColor: "#0c1a18", opacity: 1 }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-500 italic select-none">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-all flex items-center justify-between select-none ${
                    opt.disabled
                      ? "opacity-30 cursor-not-allowed text-slate-500"
                      : isSelected
                      ? "bg-[#285A48]/35 text-[#B0E4CC] font-medium"
                      : "text-slate-300 hover:text-slate-100 hover:bg-[#285A48]/15 cursor-pointer"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B0E4CC]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
