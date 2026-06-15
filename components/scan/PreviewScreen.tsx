"use client";

import React from "react";
import { CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";

interface PreviewScreenProps {
  frontImage: string;
  sideImage: string;
  onRetakeFront: () => void;
  onRetakeSide: () => void;
  onContinue: () => void;
}

export function PreviewScreen({
  frontImage,
  sideImage,
  onRetakeFront,
  onRetakeSide,
  onContinue,
}: PreviewScreenProps) {
  return (
    <div className="flex flex-col h-[75vh] min-h-[500px] max-h-[640px] text-slate-100 justify-between">
      {/* Title */}
      <div className="text-center pb-3 border-b border-white/5 flex flex-col gap-1">
        <h4 className="text-base font-bold text-slate-200">Review Outlines</h4>
        <p className="text-[10px] text-slate-500 leading-snug">
          Faces are completely blacked out for privacy. Only body contours will be processed.
        </p>
      </div>

      {/* Previews grid */}
      <div className="flex-1 my-6 grid grid-cols-2 gap-4 min-h-0">
        {/* Front Profile Preview */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontImage}
              alt="Front Capture"
              className="w-full h-full object-cover"
            />
            {/* Success check badge */}
            <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-slate-950">
              <RotateCcw size={12} className="hidden" /> {/* just listing import */}
              <CheckCircle2 size={14} className="fill-emerald-400 stroke-slate-950 stroke-2" />
            </div>
            {/* Outline label */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur border border-white/10 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
              Front View
            </div>
          </div>
          <button
            onClick={onRetakeFront}
            className="w-full py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Retake Front</span>
          </button>
        </div>

        {/* Side Profile Preview */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sideImage}
              alt="Side Capture"
              className="w-full h-full object-cover"
            />
            {/* Success check badge */}
            <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-slate-950">
              <CheckCircle2 size={14} className="fill-emerald-400 stroke-slate-950 stroke-2" />
            </div>
            {/* Outline label */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur border border-white/10 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
              Side View
            </div>
          </div>
          <button
            onClick={onRetakeSide}
            className="w-full py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Retake Side</span>
          </button>
        </div>
      </div>

      {/* Upload button */}
      <div className="pt-3 border-t border-white/5">
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#408a71] hover:to-[#285A48] text-xs font-bold text-white transition-all hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Continue to Inputs</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
