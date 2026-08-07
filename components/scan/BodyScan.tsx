"use client";

import React, { useState } from "react";
import { Camera, ShieldAlert, Sparkles, Loader2, ArrowRight, X, Palette, Upload, CheckCircle2 } from "lucide-react";
import { CameraView } from "./CameraView";
import { PreviewScreen } from "./PreviewScreen";
import { bodyScanApi } from "@/services/bodyScanApi";
import { getSessionCustomerId } from "@/components/products/DemoPanel";
import { validateUploadedPhotoPose } from "@/lib/poseValidation";
import { useToastContext } from "@/contexts/ToastContext";

type ScanStep =
  | "intro"
  | "front_scan"
  | "side_scan"
  | "skin_tone_scan"
  | "preview"
  | "uploading"
  | "upload_image";

export interface ScanResultData {
  frontImage?: string;
  sideImage?: string;
  skinToneImage?: string;
  measurements?: any;
}

interface BodyScanProps {
  onComplete: (data?: ScanResultData) => void;
  onCancel: () => void;
  mode?: "recommend" | "direct";
  includeSkinTone?: boolean;
}

export function BodyScan({
  onComplete,
  onCancel,
  mode = "recommend",
  includeSkinTone = false,
}: BodyScanProps) {
  const { addToast } = useToastContext();
  const [step, setStep] = useState<ScanStep>("intro");
  const [frontImage, setFrontImage] = useState<string>("");
  const [sideImage, setSideImage] = useState<string>("");
  const [skinToneImage, setSkinToneImage] = useState<string>("");

  const [landmarks, setLandmarks] = useState<{ front?: any; side?: any }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File Change Handlers with MediaPipe Client-Side Validation
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        const check = await validateUploadedPhotoPose(dataUrl, "front posture photo");
        if (!check.isValid) {
          addToast(check.error || "No human posture detected in photo. Please select a clear photo of yourself.", "warning");
          e.target.value = "";
          return;
        }
        setFrontImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        const check = await validateUploadedPhotoPose(dataUrl, "side posture photo");
        if (!check.isValid) {
          addToast(check.error || "No human posture detected in photo. Please select a clear photo of yourself.", "warning");
          e.target.value = "";
          return;
        }
        setSideImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSkinToneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setSkinToneImage(event.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = () => {
    setStep("front_scan");
  };

  const handleFrontCapture = (imageSrc: string, poseLandmarks: any) => {
    setFrontImage(imageSrc);
    setLandmarks((prev) => ({ ...prev, front: poseLandmarks }));
    setStep("side_scan");
  };

  const handleSideCapture = (imageSrc: string, poseLandmarks: any) => {
    setSideImage(imageSrc);
    setLandmarks((prev) => ({ ...prev, side: poseLandmarks }));
    if (includeSkinTone) {
      setStep("skin_tone_scan");
    } else {
      setStep("preview");
    }
  };

  const handleSkinToneCapture = (imageSrc: string) => {
    setSkinToneImage(imageSrc);
    setStep("preview");
  };

  const handleRetakeFront = () => setStep("front_scan");
  const handleRetakeSide = () => setStep("side_scan");
  const handleRetakeSkinTone = () => setStep("skin_tone_scan");

  const handleContinue = async () => {
    setStep("uploading");
    setIsUploading(true);
    setUploadError(null);

    const payload = {
      frontImage,
      sideImage,
      skinToneImage,
      poseLandmarks: landmarks,
      customer_id: getSessionCustomerId(),
    };

    try {
      if (mode === "direct") {
        const res = await bodyScanApi.getDirectMeasurements(payload);
        onComplete({ frontImage, sideImage, skinToneImage, measurements: res.measurements });
      } else {
        await bodyScanApi.uploadBodyScan(payload);
        onComplete({ frontImage, sideImage, skinToneImage });
      }
    } catch (err: any) {
      console.error("Error uploading body scan images:", err);
      // Even if network API call fails, proceed with local base64 images
      onComplete({ frontImage, sideImage, skinToneImage });
    } finally {
      setIsUploading(false);
    }
  };

  const isUploadedSetComplete = includeSkinTone
    ? !!(frontImage && sideImage && skinToneImage)
    : !!(frontImage && sideImage);

  return (
    <div className="w-full max-w-lg mx-auto bg-[#091413] border border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_40px_120px_-60px_rgba(176,228,204,0.15)] relative overflow-hidden select-none">
      
      {/* Header Tabs */}
      {step !== "intro" && step !== "uploading" && (
        <div className="flex items-center justify-between gap-1 pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                step === "front_scan" ? "bg-[#B0E4CC] animate-pulse" : "bg-[#285A48]"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                step === "front_scan" ? "text-white" : "text-slate-500"
              }`}
            >
              Front
            </span>
          </div>

          <div className="h-px bg-white/5 flex-1 mx-1.5" />

          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                step === "side_scan"
                  ? "bg-[#B0E4CC] animate-pulse"
                  : step === "skin_tone_scan" || step === "preview"
                  ? "bg-[#285A48]"
                  : "bg-slate-800"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                step === "side_scan" ? "text-white" : "text-slate-500"
              }`}
            >
              Side
            </span>
          </div>

          {includeSkinTone && (
            <>
              <div className="h-px bg-white/5 flex-1 mx-1.5" />
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    step === "skin_tone_scan"
                      ? "bg-[#B0E4CC] animate-pulse"
                      : step === "preview"
                      ? "bg-[#285A48]"
                      : "bg-slate-800"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    step === "skin_tone_scan" ? "text-white" : "text-slate-500"
                  }`}
                >
                  Skin Tone
                </span>
              </div>
            </>
          )}

          <div className="h-px bg-white/5 flex-1 mx-1.5" />

          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                step === "preview" ? "bg-[#B0E4CC] animate-pulse" : "bg-slate-800"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                step === "preview" ? "text-white" : "text-slate-500"
              }`}
            >
              Review
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: WELCOME INTRO SCREEN */}
      {step === "intro" && (
        <div className="flex flex-col gap-6 text-left py-4 animate-fade-in relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#B0E4CC]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC]" />
              Body Scan {includeSkinTone && "& Skin Tone Sampling"}
            </div>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          
          <h3 className="font-display text-2xl md:text-3xl text-white tracking-tight font-light leading-snug">
            Analyze posture {includeSkinTone ? "& Skin Complexion" : ""}.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {includeSkinTone
              ? "Capture or upload front, side/torso, and skin tone photos. AI will analyze posture measurements and evaluate skin undertone harmony for bespoke outfit recommendations."
              : "Perform a quick camera scan or upload body photos to analyze dimensions."}
          </p>

          <div className="space-y-4 my-2">
            <div className="flex gap-3 items-start bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <Camera className="w-5 h-5 text-[#B0E4CC] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Camera or Photo Upload</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Use live camera alignment overlays or upload high-quality standing photos.
                </p>
              </div>
            </div>

            {includeSkinTone && (
              <div className="flex gap-3 items-start bg-[#285A48]/20 border border-[#B0E4CC]/20 rounded-2xl p-4">
                <Palette className="w-5 h-5 text-[#B0E4CC] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#B0E4CC]">Skin Tone Color Matching</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    Skin tone snapshot is sampled to match suit contrast, tie tones, and fabric color harmony.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleStartScan}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#408a71] hover:to-[#285A48] text-xs font-bold text-white transition-all hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-[#B0E4CC] animate-pulse" />
              <span>Start Camera Scan {includeSkinTone ? "(3 Steps)" : "(2 Steps)"}</span>
              <ArrowRight size={14} />
            </button>

            {mode !== "direct" && (
              <button
                onClick={() => setStep("upload_image")}
                className="w-full py-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-[#B0E4CC]/30 hover:bg-slate-900 text-xs font-bold text-slate-200 transition-all hover:shadow-lg hover:shadow-[#B0E4CC]/5 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} className="text-[#B0E4CC]" />
                <span>Upload Photos {includeSkinTone ? "(3 Photos)" : "(2 Photos)"}</span>
              </button>
            )}
            
          </div>
        </div>
      )}

      {/* STEP: UPLOAD IMAGES SCREEN (SUPPORTS ALL 3 PHOTOS FOR AI CONSULTATION) */}
      {step === "upload_image" && (
        <div className="flex flex-col gap-5 text-left py-2 animate-fade-in relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#B0E4CC]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC]" />
              Upload Photos
            </div>
            <button
              onClick={() => setStep("intro")}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <h3 className="font-display text-xl md:text-2xl text-white tracking-tight font-light leading-snug">
            Upload {includeSkinTone ? "Front, Torso & Skin Tone" : "Front & Side"} Photos
          </h3>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            {includeSkinTone
              ? "Select high-resolution photos for Front View, Side/Torso, and Skin Tone sampling. All 3 images will be processed for virtual try-on."
              : "Upload clear standing photos for posture evaluation."}
          </p>

          <div className="grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {/* Card 1: Front Photo */}
            <div className="border border-white/10 rounded-2xl p-3.5 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B0E4CC]" />
                  1. Front Posture Photo
                </span>
                {frontImage && <CheckCircle2 size={16} className="text-emerald-400" />}
              </div>

              {!frontImage ? (
                <label className="flex items-center justify-center border border-dashed border-[#B0E4CC]/30 hover:border-[#B0E4CC]/60 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-xl p-4 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFrontFileChange} className="hidden" />
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <Upload size={14} className="text-[#B0E4CC]" />
                    <span>Upload Front Photo</span>
                  </div>
                </label>
              ) : (
                <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={frontImage} alt="Front View" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setFrontImage("")}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black text-white transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Side / Torso Photo */}
            <div className="border border-white/10 rounded-2xl p-3.5 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B0E4CC]" />
                  2. Side / Torso Photo
                </span>
                {sideImage && <CheckCircle2 size={16} className="text-emerald-400" />}
              </div>

              {!sideImage ? (
                <label className="flex items-center justify-center border border-dashed border-[#B0E4CC]/30 hover:border-[#B0E4CC]/60 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-xl p-4 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleSideFileChange} className="hidden" />
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <Upload size={14} className="text-[#B0E4CC]" />
                    <span>Upload Side / Torso Photo</span>
                  </div>
                </label>
              ) : (
                <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sideImage} alt="Side View" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setSideImage("")}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black text-white transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Card 3: Skin Tone Photo (AI Style Consultation Only) */}
            {includeSkinTone && (
              <div className="border border-[#B0E4CC]/20 rounded-2xl p-3.5 bg-[#285A48]/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#B0E4CC] flex items-center gap-1.5">
                    <Palette size={14} />
                    3. Skin Tone Sample Photo
                  </span>
                  {skinToneImage && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>

                {!skinToneImage ? (
                  <label className="flex items-center justify-center border border-dashed border-[#B0E4CC]/40 hover:border-[#B0E4CC] bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-xl p-4 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleSkinToneFileChange} className="hidden" />
                    <div className="flex items-center gap-2 text-xs text-[#B0E4CC] font-semibold">
                      <Upload size={14} />
                      <span>Upload Skin Tone Photo</span>
                    </div>
                  </label>
                ) : (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={skinToneImage} alt="Skin Tone Sample" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setSkinToneImage("")}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black text-white transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/5">
            <button
              onClick={() => setStep("intro")}
              className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center cursor-pointer"
            >
              Back
            </button>
            <button
              disabled={!isUploadedSetComplete}
              onClick={() => onComplete({ frontImage, sideImage, skinToneImage })}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isUploadedSetComplete
                  ? "bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/30 hover:border-[#B0E4CC]/60 text-white shadow-lg shadow-[#B0E4CC]/10"
                  : "bg-slate-900/40 border border-white/5 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Sparkles size={15} className="text-[#B0E4CC]" />
              <span>Submit & Analyze Fit</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FRONT SCAN VIEW */}
      {step === "front_scan" && (
        <CameraView
          type="front"
          onCapture={handleFrontCapture}
          onCancel={() => setStep("intro")}
        />
      )}

      {/* STEP 3: SIDE SCAN VIEW */}
      {step === "side_scan" && (
        <CameraView
          type="side"
          onCapture={handleSideCapture}
          onCancel={() => setStep("front_scan")}
        />
      )}

      {/* STEP 4: SKIN TONE SCAN VIEW */}
      {step === "skin_tone_scan" && (
        <CameraView
          type="skin_tone"
          onCapture={(img) => handleSkinToneCapture(img)}
          onCancel={() => setStep("side_scan")}
        />
      )}

      {/* STEP 5: REVIEW SNAPSHOTS PREVIEW */}
      {step === "preview" && (
        <PreviewScreen
          frontImage={frontImage}
          sideImage={sideImage}
          skinToneImage={skinToneImage}
          onRetakeFront={handleRetakeFront}
          onRetakeSide={handleRetakeSide}
          onRetakeSkinTone={includeSkinTone ? handleRetakeSkinTone : undefined}
          onContinue={handleContinue}
        />
      )}

      {/* STEP 6: UPLOADING LOADING SPINNER */}
      {step === "uploading" && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in">
          <Loader2 className="w-10 h-10 animate-spin text-[#B0E4CC]" />
          <h4 className="font-bold text-slate-200 text-sm">Processing All 3 Photos</h4>
          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
            Encoding front, side, and skin tone images for AI style consultation...
          </p>
        </div>
      )}
    </div>
  );
}
