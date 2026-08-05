"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "-- Choose customer --",
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-[#B0E4CC]/40 hover:border-[#B0E4CC] rounded-xl px-4 py-2 text-xs font-medium text-white flex items-center justify-between gap-3 shadow-lg focus:outline-none transition cursor-pointer"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#B0E4CC] transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 max-h-60 overflow-y-auto bg-[#071713] border border-[#B0E4CC]/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1 space-y-0.5 backdrop-blur-md">
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-500 italic">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#285A48] text-white font-bold"
                      : "text-slate-200 hover:bg-[#285A48]/60 hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-[#B0E4CC] flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
