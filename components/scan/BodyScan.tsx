"use client";

import React, { useState } from "react";
import { Camera, ShieldAlert, Sparkles, Loader2, ArrowRight, X } from "lucide-react";
import { CameraView } from "./CameraView";
import { PreviewScreen } from "./PreviewScreen";
import { bodyScanApi } from "@/services/bodyScanApi";
import { getSessionCustomerId } from "@/components/products/DemoPanel";

// Sizing progression steps
type ScanStep = "intro" | "front_scan" | "side_scan" | "preview" | "uploading";

interface BodyScanProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function BodyScan({ onComplete, onCancel }: BodyScanProps) {
  const [step, setStep] = useState<ScanStep>("intro");
  const [frontImage, setFrontImage] = useState<string>("");
  const [sideImage, setSideImage] = useState<string>("");
  
  const [landmarks, setLandmarks] = useState<{ front?: any; side?: any }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Welcome page click handler
  const handleStartScan = () => {
    setStep("front_scan");
  };

  // Front camera capture handler
  const handleFrontCapture = (imageSrc: string, poseLandmarks: any) => {
    setFrontImage(imageSrc);
    setLandmarks(prev => ({ ...prev, front: poseLandmarks }));
    setStep("side_scan");
  };

  // Side camera capture handler
  const handleSideCapture = (imageSrc: string, poseLandmarks: any) => {
    setSideImage(imageSrc);
    setLandmarks(prev => ({ ...prev, side: poseLandmarks }));
    setStep("preview");
  };

  // Retake handlers
  const handleRetakeFront = () => {
    setStep("front_scan");
  };

  const handleRetakeSide = () => {
    setStep("side_scan");
  };

  // Continue to upload
  const handleContinue = async () => {
    setStep("uploading");
    setIsUploading(true);
    setUploadError(null);

    const payload = {
      frontImage,
      sideImage,
      poseLandmarks: landmarks,
      customer_id: getSessionCustomerId(),
    };

    try {
      await bodyScanApi.uploadBodyScan(payload);
      // Success! Proceed to the manual details form (without pre-populating measurements)
      onComplete();
    } catch (err: any) {
      console.error("Error uploading body scan images:", err);
      setUploadError(err?.message || "Failed to upload body scan files. Please try again.");
      setStep("preview");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#091413] border border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_40px_120px_-60px_rgba(176,228,204,0.15)] relative overflow-hidden select-none">
      
      {/* Dynamic progression indicator header */}
      {step !== "intro" && step !== "uploading" && (
        <div className="flex items-center justify-between gap-1 pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${step === "front_scan" ? "bg-[#B0E4CC] animate-pulse" : "bg-[#285A48]"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step === "front_scan" ? "text-white" : "text-slate-500"}`}>Front</span>
          </div>
          <div className="h-px bg-white/5 flex-1 mx-2" />
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${step === "side_scan" ? "bg-[#B0E4CC] animate-pulse" : step === "preview" ? "bg-[#285A48]" : "bg-slate-800"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step === "side_scan" ? "text-white" : "text-slate-500"}`}>Side</span>
          </div>
          <div className="h-px bg-white/5 flex-1 mx-2" />
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${step === "preview" ? "bg-[#B0E4CC] animate-pulse" : "bg-slate-800"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${step === "preview" ? "text-white" : "text-slate-500"}`}>Review</span>
          </div>
        </div>
      )}

      {/* STEP 1: WELCOME INTRO SCREEN */}
      {step === "intro" && (
        <div className="flex flex-col gap-6 text-left py-4 animate-fade-in relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#B0E4CC]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC]" />
              Body Scan
            </div>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          
          <h3 className="font-display text-2xl md:text-3xl text-white tracking-tight font-light leading-snug">
            Analyze your fit posture.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Perform a quick camera scan to capture body proportions. This data will be uploaded and mapped to your cohort to help compute your dimensions.
          </p>

          <div className="space-y-4 my-2">
            <div className="flex gap-3 items-start bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <Camera className="w-5 h-5 text-[#B0E4CC] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Outline Alignment Guides</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Follow visual overlays to align your body. The scanner validates your pose in real-time.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Face Privacy Masking</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Faces are covered by a solid black overlay in real-time. The original raw face image is never stored or uploaded.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleStartScan}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#408a71] hover:to-[#285A48] text-xs font-bold text-white transition-all hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-[#B0E4CC] animate-pulse" />
              <span>Start Body Scan</span>
              <ArrowRight size={14} />
            </button>
            
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center cursor-pointer"
            >
              Skip Scan & Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FRONT SCAN VIEW */}
      {step === "front_scan" && (
        <CameraView
          type="front"
          onCapture={handleFrontCapture}
          onCancel={onCancel}
        />
      )}

      {/* STEP 3: SIDE SCAN VIEW */}
      {step === "side_scan" && (
        <CameraView
          type="side"
          onCapture={handleSideCapture}
          onCancel={onCancel}
        />
      )}

      {/* STEP 4: REVIEW SNAPSHOTS PREVIEW */}
      {step === "preview" && (
        <PreviewScreen
          frontImage={frontImage}
          sideImage={sideImage}
          onRetakeFront={handleRetakeFront}
          onRetakeSide={handleRetakeSide}
          onContinue={handleContinue}
        />
      )}

      {/* STEP 5: UPLOADING LOADING SPINNER */}
      {step === "uploading" && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in">
          <Loader2 className="w-10 h-10 animate-spin text-[#B0E4CC]" />
          <h4 className="font-bold text-slate-200 text-sm">Uploading Body Data</h4>
          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
            Uploading body coordinates and privacy-masked snapshots to our secure fitting server...
          </p>
        </div>
      )}
    </div>
  );
}
