import React from "react";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`w-full py-6 px-8 border-t border-white/5 text-[11px] text-slate-500 tracking-wider flex flex-col md:flex-row items-center justify-between gap-4 select-none ${className}`}>
      {/* Copyright */}
      <div className="font-semibold uppercase order-3 md:order-1">
        © 2026 NAMMAFIT
      </div>

      {/* Diversity Message */}
      <div className="flex items-center gap-1 text-slate-400 font-medium order-2 md:order-2">
        <span>Built with</span>
        <span className="text-rose-500 text-xs">❤️</span>
        <span>in India, for Indian Fit Diversity</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6 font-semibold uppercase order-1 md:order-3">
        <a
          href="https://www.nammafit.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-200 transition-colors"
        >
          Privacy
        </a>
        <a
          href="https://www.nammafit.com/terms-and-conditions"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-200 transition-colors"
        >
          Terms
        </a>
      </div>
    </footer>
  );
}
