"use client";

import React, { useState } from "react";
import { X, Download, Printer, Check, Sparkles, ShieldCheck, QrCode } from "lucide-react";

interface OutfitRecommendation {
  id: string;
  name: string;
  isAiRecommended?: boolean;
  image: string;
  details: {
    suitColor: string;
    fabric: string;
    fit: string;
    lapelStyle: string;
    pieces: string;
    shirt: string;
    tie: string;
    color?: string;
    shoes?: string;
    accessories: string;
    estimatedPrice: string;
    deliveryTime: string;
  };
  whyThisWorks: string;
  whyAiSelectedThis?: string;
}

interface DownloadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: OutfitRecommendation | null;
  customerData: {
    height: string;
    occasion: string;
    customerRole: string;
    eventTime: string;
    venue: string;
    stylePreference: string;
    favoriteColor: string;
    budget: string;
  };
}

export function DownloadPdfModal({
  isOpen,
  onClose,
  recommendation,
  customerData,
}: DownloadPdfModalProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !recommendation) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDownloaded(true);

      // Trigger standard browser print window or download simulation
      window.print();

      setTimeout(() => setDownloaded(false), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#091413] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_40px_120px_-30px_rgba(40,90,72,0.4)] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#285A48] to-[#142e25] border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                PDF Lookbook Summary
                {recommendation.isAiRecommended && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    AI Top Pick
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                NammaFit AI Style Consultation • Official Specification Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="bg-slate-950/60 border border-white/8 rounded-2xl p-6 space-y-6">
          {/* Header Banner inside document */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#B0E4CC] font-bold">
                NammaFit Tailored Lookbook
              </div>
              <h4 className="text-xl font-bold text-white mt-1">{recommendation.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Curated for {customerData.customerRole || "Client"} • {customerData.occasion || "Special Occasion"}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>Verified Fit Blueprint</span>
            </div>
          </div>

          {/* Grid Layout: Image + Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={recommendation.image}
                alt={recommendation.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-center text-[10px] text-slate-300">
                {recommendation.details.estimatedPrice}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-1">
                Outfit Specifications
              </h5>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Suit Color</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.suitColor}</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Fabric</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.fabric}</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Fit Contour</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.fit}</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Lapel</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.lapelStyle}</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Shirt</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.shirt}</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase">Shoes & Acc.</span>
                  <span className="text-slate-200 font-medium">{recommendation.details.shoes}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Stylist Rationale
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  "{recommendation.whyThisWorks}"
                </p>
              </div>
            </div>
          </div>

          {/* Customer Metadata Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span>Height: <strong className="text-white">{customerData.height || "178 cm"}</strong></span>
              <span>Style: <strong className="text-white">{customerData.stylePreference || "Modern"}</strong></span>
              <span>Venue: <strong className="text-white">{customerData.venue || "Ballroom"}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <QrCode size={14} className="text-[#B0E4CC]" />
              <span>Scan to Order • Ref #NF-88219</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center"
          >
            Close Preview
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              downloaded
                ? "bg-emerald-500 text-white"
                : "bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/30 hover:border-[#B0E4CC]/60 text-white hover:shadow-lg hover:shadow-[#B0E4CC]/10"
            }`}
          >
            {isGenerating ? (
              <span>Preparing PDF...</span>
            ) : downloaded ? (
              <>
                <Check size={16} />
                <span>PDF Downloaded</span>
              </>
            ) : (
              <>
                <Download size={16} className="text-[#B0E4CC]" />
                <span>Download / Print PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
