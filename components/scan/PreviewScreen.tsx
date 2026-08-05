"use client";

import React from "react";
import { CheckCircle2, RotateCcw, ArrowRight, Palette } from "lucide-react";

interface PreviewScreenProps {
  frontImage: string;
  sideImage: string;
  skinToneImage?: string;
  onRetakeFront: () => void;
  onRetakeSide: () => void;
  onRetakeSkinTone?: () => void;
  onContinue: () => void;
}

export function PreviewScreen({
  frontImage,
  sideImage,
  skinToneImage,
  onRetakeFront,
  onRetakeSide,
  onRetakeSkinTone,
  onContinue,
}: PreviewScreenProps) {
  const hasSkinTone = !!skinToneImage;

  return (
    <div className="flex flex-col h-[75vh] min-h-[500px] max-h-[640px] text-slate-100 justify-between">
      {/* Title */}
      <div className="text-center pb-3 border-b border-white/5 flex flex-col gap-1">
        <h4 className="text-base font-bold text-slate-200">
          Review Scan Outlines {hasSkinTone && "& Skin Tone"}
        </h4>
        <p className="text-[10px] text-slate-500 leading-snug">
          {hasSkinTone
            ? "Verify body posture contours and skin tone sample for AI outfit matching."
            : "Faces are completely blacked out for privacy. Only body contours will be processed."}
        </p>
      </div>

      {/* Previews grid */}
      <div className={`flex-1 my-6 grid gap-3 min-h-0 ${hasSkinTone ? "grid-cols-3" : "grid-cols-2"}`}>
        {/* Front Profile Preview */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontImage}
              alt="Front Capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-slate-950">
              <CheckCircle2 size={14} className="fill-emerald-400 stroke-slate-950 stroke-2" />
            </div>
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
            <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-slate-950">
              <CheckCircle2 size={14} className="fill-emerald-400 stroke-slate-950 stroke-2" />
            </div>
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

        {/* Skin Tone Sample Preview (Third Card) */}
        {hasSkinTone && (
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={skinToneImage}
                alt="Skin Tone Capture"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 p-1 rounded-full bg-[#B0E4CC] text-slate-950">
                <Palette size={14} className="text-[#091413]" />
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur border border-[#B0E4CC]/30 text-[9px] font-bold text-[#B0E4CC] uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-200" />
                Skin Tone
              </div>
            </div>
            {onRetakeSkinTone && (
              <button
                onClick={onRetakeSkinTone}
                className="w-full py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Retake Tone</span>
              </button>
            )}
          </div>
        )}
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
