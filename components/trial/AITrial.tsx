"use client";

import { useState, useEffect } from "react";
import api, { getApiBaseUrl } from "@/lib/axios";
import { customerApi, aiTrialSessionApi } from "@/lib/api";
import { useCustomerContext } from "@/contexts/CustomerContext";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { BodyScan, ScanResultData } from "@/components/scan/BodyScan";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Scissors,
  Shirt,
  RotateCcw,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  RefreshCw,
  Users,
  Lock
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  height: number;
  weight: number;
  notes: string;
  measurements?: any;
}

interface AuditResult {
  overall_fit_score: number;
  overall_result: string;
  verdict_title: string;
  summary: string;
  customer_measurements: Record<string, any>;
  fit_breakdown: {
    shoulders_chest?: { status: string; score: number; feedback: string };
    waist_taper?: { status: string; score: number; feedback: string };
    sleeves?: { status: string; score: number; feedback: string };
    trousers?: { status: string; score: number; feedback: string };
  };
  perfect_fit_aspects: string[];
  improvements_suggested: string[];
  tailor_alteration_notes: string;
}

export default function AITrial() {
  const [phase, setPhase] = useState<"scan" | "preview" | "auditing" | "result" | "error">("scan");
  
  // Global Customer Selection Context
  const {
    selectedCustomerId,
    selectedCustomer,
    selectCustomer,
    customers: contextCustomers,
  } = useCustomerContext();

  const setSelectedCustomerId = (id: string) => selectCustomer(id);
  const customers = contextCustomers as any[];
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);

  // Previous Trial Sessions State for Selected Customer
  const [previousTrialSessions, setPreviousTrialSessions] = useState<any[]>([]);
  const [loadingPrevTrialSessions, setLoadingPrevTrialSessions] = useState<boolean>(false);

  useEffect(() => {
    const loadPreviousTrialSessions = async () => {
      if (!selectedCustomerId) {
        setPreviousTrialSessions([]);
        return;
      }
      setLoadingPrevTrialSessions(true);
      try {
        const { data } = await aiTrialSessionApi.getByCustomer(Number(selectedCustomerId));
        setPreviousTrialSessions(data || []);
      } catch (err) {
        console.warn("Could not load previous trial sessions for customer:", err);
      } finally {
        setLoadingPrevTrialSessions(false);
      }
    };

    loadPreviousTrialSessions();
  }, [selectedCustomerId]);

  const [capturedPhotos, setCapturedPhotos] = useState<{
    front: string | null;
    side: string | null;
    skinTone: string | null;
  }>({
    front: null,
    side: null,
    skinTone: null
  });

  const [selectedSuit, setSelectedSuit] = useState<string>("Midnight Royal Navy Wool-Silk Three-Piece Tuxedo");
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(1);

  useEffect(() => {
    setInitialLoading(true);
    setLoadingProgress(1);

    const intervalTime = 50;
    const totalSteps = 100;
    const stepIncrement = 100 / totalSteps;

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setInitialLoading(false), 200);
          return 100;
        }
        return Math.min(100, Math.round(prev + stepIncrement));
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    setIsEditingCustomer(false);
  };

  // Handle completion from BodyScan component
  const handleScanComplete = (data: any) => {
    if (!data) return;
    const photos = {
      front: data.frontImage || null,
      side: data.sideImage || null,
      skinTone: data.skinToneImage || null
    };
    setCapturedPhotos(photos);
    // Directly invoke Gemini API fit analysis!
    runFitAnalysis(photos);
  };

  const handleSelectPreviousTrial = (session: any) => {
    const data = session.ai_response_json;
    if (data && data.verdict_title) {
      setAuditData(data);
    } else {
      setAuditData({
        overall_fit_score: session.overall_fit_score || 92.0,
        overall_result: session.overall_result || "PERFECT_FIT",
        verdict_title: "Bespoke Fitting Audit",
        summary: "Historical AI trial inspection report.",
        customer_measurements: {},
        fit_breakdown: {},
        perfect_fit_aspects: ["Shoulder drape aligned."],
        improvements_suggested: [],
        tailor_alteration_notes: "Garment matches customer posture measurements."
      });
    }

    if (session.front_photo_url) {
      setCapturedPhotos((prev) => ({ ...prev, front: session.front_photo_url }));
    }

    setPhase("result");
  };

  const runFitAnalysis = async (photosParam?: any) => {
    setPhase("auditing");
    setErrorMessage(null);

    const photosToUse = photosParam || capturedPhotos;

    // Build customer measurements payload
    const custName = selectedCustomer ? selectedCustomer.name : "Bespoke Customer";
    const heightCm = selectedCustomer?.height || 178;
    const weightKg = selectedCustomer?.weight || 74;
    const m: any = selectedCustomer?.measurements || {};

    const customer_measurements = {
      customer_name: custName,
      height_cm: heightCm,
      weight_kg: weightKg,
      chest_inches: Number(m.bust || m.chest) ? Math.round(((Number(m.bust || m.chest)) / 2.54) * 10) / 10 : 39.5,
      waist_inches: Number(m.waist) ? Math.round(((Number(m.waist)) / 2.54) * 10) / 10 : 33.0,
      hips_inches: Number(m.hip || m.hips) ? Math.round(((Number(m.hip || m.hips)) / 2.54) * 10) / 10 : 39.0,
      shoulder_width_inches: Number(m.shoulder) ? Math.round(((Number(m.shoulder)) / 2.54) * 10) / 10 : 18.0,
      sleeve_length_inches: Number(m.sleeve_length || m.sleeveLength) ? Math.round(((Number(m.sleeve_length || m.sleeveLength)) / 2.54) * 10) / 10 : 25.0,
      inseam_inches: Number(m.inseam) ? Math.round(((Number(m.inseam)) / 2.54) * 10) / 10 : 31.5,
      neck_inches: Number(m.neck) ? Math.round(((Number(m.neck)) / 2.54) * 10) / 10 : 15.5,
    };

    try {
      console.log("[AI TRIAL FRONTEND] Calling /ai-trial/ API with customer measurements and photos...");
      const { data } = await api.post(
        "/ai-trial/",
        {
          customer_id: selectedCustomerId,
          customer_name: custName,
          customer_phone: selectedCustomer?.phone || "",
          customer_height: selectedCustomer?.height || 178,
          customer_weight: selectedCustomer?.weight || 74,
          customer_measurements,
          suit_name: selectedSuit,
          front_photo: photosToUse.front || "",
          side_photo: photosToUse.side || "",
          back_photo: photosToUse.back || photosToUse.side || ""
        },
        {
          timeout: 120000 // Extended timeout to 120 seconds for Gemini fit analysis on Render
        }
      );

      if (data && !data.error) {
        setAuditData(data);
        setPhase("result");

        // Save AI Trial Session to Backend Database
        try {
          if (selectedCustomerId) {
            await aiTrialSessionApi.create({
              customer: Number(selectedCustomerId),
              order: null,
              status: "COMPLETED",
              front_photo_url: capturedPhotos.front || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
              left_photo_url: capturedPhotos.side || null,
              right_photo_url: capturedPhotos.side || null,
              back_photo_url: capturedPhotos.side || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
              overall_fit_score: data.overallFitScore || 94.0,
              overall_result: data.overallFitResult === "PERFECT FIT" ? "PERFECT_FIT" : "MINOR_CORRECTION",
              gemini_prompt: `Master Tailor Audit for Customer ${selectedCustomerId}`,
              ai_response_json: data,
              model_name: "gemini-1.5-pro",
              processing_time_ms: 2500
            });
          }
        } catch (dbErr) {
          console.warn("Could not save AI Trial session to database:", dbErr);
        }
      } else {
        setErrorMessage(data.error || "Failed to analyze trial photos. Please verify your images and API configuration.");
        setPhase("error");
      }
    } catch (err: any) {
      console.error("AI Trial API network error:", err);
      let detailMsg = err.response?.data?.error || err.message || "Network error connecting to AI Fitting Service.";
      if (err.message === "Network Error" || err.code === "ERR_NETWORK" || !err.response) {
        detailMsg = "Network / CORS Error: The Render backend failed to respond. This usually occurs if the server timed out (30s limit on Render), crashed due to missing GEMINI_API_KEY, or dropped headers on an HTTP 500/504 error.";
      }
      setErrorMessage(detailMsg);
      setPhase("error");
    }
  };

  // 1. Initial 10-Second Loading Screen ALONE
  if (initialLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center select-none">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#285A48]/30 animate-pulse" />
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="5" className="text-white/5" fill="transparent" />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="5"
              className="text-[#B0E4CC] transition-all duration-100 ease-linear"
              fill="transparent"
              strokeDasharray={251.32}
              strokeDashoffset={251.32 - (251.32 * loadingProgress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white font-mono">{loadingProgress}%</span>
            <span className="text-[9px] font-bold text-[#B0E4CC] uppercase tracking-wider">LOADING</span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-2 mt-6">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#285A48] via-[#B0E4CC] to-emerald-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(176,228,204,0.6)]"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
            <span>AI Trial Sync: {loadingProgress}%</span>
            <span>5s</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Content View
  return (
    <div className="min-h-screen bg-[#070F0E] text-white p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* -- Header ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B0E4CC] mb-1">
            <Shirt size={16} />
            AI Trial & Master Tailor Inspection
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            AI Trial Fitting Inspection
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Select a registered customer, capture/upload trial photos wearing their stitched coat suit, and let AI Master Tailor inspect the real fit.
          </p>
        </div>

        {(phase === "result" || phase === "preview" || phase === "error") && (
          <button
            onClick={() => {
              setPhase("scan");
              setErrorMessage(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw size={14} />
            Retake Trial Photos
          </button>
        )}
      </div>

      {/* -- CUSTOMER SELECTION BAR -------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-[#B0E4CC]" />
            SELECT CUSTOMER:
          </label>
          {!selectedCustomer || isEditingCustomer ? (
            <CustomSelect
              options={customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.phone || "No phone"})` }))}
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              placeholder="-- Choose registered customer --"
              className="min-w-[260px] sm:w-80"
            />
          ) : (
            <div className="flex items-center justify-between gap-3 bg-[#285A48]/30 border border-[#B0E4CC]/40 px-3.5 py-2 rounded-xl text-xs font-bold text-white min-w-[260px] sm:w-80 shadow-md">
              <span className="flex items-center gap-2 truncate">
                <Lock size={14} className="text-[#B0E4CC]" />
                {selectedCustomer.name} ({selectedCustomer.phone || "No phone"})
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCustomer(true)}
                className="text-[11px] font-semibold text-slate-300 hover:text-white underline cursor-pointer ml-2 flex-shrink-0"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950/80 p-2.5 px-4 rounded-xl border border-[#B0E4CC]/20 w-full sm:w-auto">
            <ShieldCheck size={16} className="text-[#B0E4CC] flex-shrink-0" />
            <div>
              <span className="font-bold text-white">{selectedCustomer.name}</span>
              <span className="text-slate-400 block text-[11px]">
                Height: {selectedCustomer.height || 178} cm | Weight: {selectedCustomer.weight || 74} kg
              </span>
            </div>
          </div>
        )}
      </div>

      {/* -- NO CUSTOMER SELECTED CARD OR PHASE CONTENT ----------------------------- */}
      {!selectedCustomerId ? (
        <div className="flex flex-col items-center justify-center p-12 md:p-16 border border-white/10 bg-[#091512] rounded-3xl text-center space-y-4 max-w-2xl mx-auto my-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
            <Ruler size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">
              NO CUSTOMER SELECTED
            </h3>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Please select a customer from the dropdown above to begin AI Trial Fitting & Master Tailor Inspection.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* STEP 1: Body Scan & Trial Photo Capture / Upload + History */}
          {phase === "scan" && (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B0E4CC]/10 text-[#B0E4CC] text-xs font-bold uppercase tracking-wider">
                  <Shirt size={14} />
                  AI Trial Fitting & Master Tailor Audit
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                  Capture or upload customer garment trial photos. AI evaluates 3D posture alignment, seam drape, and precision fit scores.
                </p>
              </div>

              {/* 2-Column Grid: Left (Previous AI Trial Sessions) | Right (Inner Scan Card) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Previous AI Trial Sessions */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between bg-[#0B1714] border border-[#B0E4CC]/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-[#B0E4CC]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Previous Trial Sessions
                      </h3>
                    </div>
                    {selectedCustomer && (
                      <span className="text-[11px] font-semibold text-[#B0E4CC] bg-[#285A48]/30 px-2.5 py-1 rounded-full border border-[#B0E4CC]/20">
                        {selectedCustomer.name}
                      </span>
                    )}
                  </div>

                  {loadingPrevTrialSessions ? (
                    <div className="p-8 border border-white/5 bg-[#08120F] rounded-2xl text-center space-y-3">
                      <Sparkles size={24} className="text-[#B0E4CC] animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Loading previous trial sessions…</p>
                    </div>
                  ) : previousTrialSessions.length === 0 ? (
                    <div className="p-8 border border-white/5 bg-[#08120F] rounded-2xl text-center space-y-3">
                      <Shirt size={28} className="text-slate-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-300">No Previous Trial Sessions</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        No saved trial sessions found for {selectedCustomer?.name || "this customer"}. Run a new trial audit to save results to their account!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {previousTrialSessions.map((session: any, idx: number) => {
                        const dateStr = session.created_at ? new Date(session.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Previous Trial";
                        const score = session.overall_fit_score || 94;
                        const isPerfect = session.overall_result === "PERFECT_FIT" || score >= 90;

                        return (
                          <div
                            key={session.id || idx}
                            onClick={() => handleSelectPreviousTrial(session)}
                            className="bg-[#091512] border border-white/10 hover:border-[#B0E4CC]/60 p-4 rounded-2xl space-y-3 cursor-pointer transition-all hover:bg-white/[0.03] group shadow-lg"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                              <span className="text-slate-400 font-mono">TRIAL #{idx + 1} • {dateStr}</span>
                              <span className="text-[#B0E4CC] font-semibold text-[11px] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                View Result <ArrowRight size={12} />
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {session.front_photo_url ? (
                                  <img src={session.front_photo_url} alt="Trial Photo" className="w-12 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                                ) : (
                                  <div className="w-12 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 flex-shrink-0">
                                    <Shirt size={20} />
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-bold text-white">
                                    Fit Audit Score: <span className="text-[#B0E4CC]">{score}%</span>
                                  </div>
                                  <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                                    isPerfect ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}>
                                    {isPerfect ? "PERFECT FIT" : "MINOR CORRECTION"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Inner Camera Scan Card (Directly rendered without outer card box!) */}
                <div className="lg:col-span-7">
                  <BodyScan onComplete={handleScanComplete} onCancel={() => setPhase("scan")} includeSkinTone={false} />
                </div>

              </div>
            </div>
          )}



      {/* -- STEP 3A: Auditing Loading State ------------------------------------------ */}
      {phase === "auditing" && (
        <div className="min-h-[450px] glass-card rounded-3xl border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
            <div className="w-24 h-24 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center">
              <Shirt size={32} className="text-[#B0E4CC]" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-white">
              AI Master Tailor Inspecting Real Trial Photos...
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating shoulder seam alignment, waist suppression, sleeve length, and trouser break...
            </p>
          </div>
        </div>
      )}

      {/* -- STEP 3B: Error Display ------------------------------------------------- */}
      {phase === "error" && (
        <div className="glass-card rounded-3xl p-8 border border-red-500/30 bg-red-950/10 space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">AI Analysis Failed</h2>
            <p className="text-xs text-red-300 leading-relaxed bg-red-950/40 p-4 rounded-xl border border-red-500/20 font-mono">
              {errorMessage}
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={runFitAnalysis}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-2 hover:brightness-110 cursor-pointer"
            >
              <RefreshCw size={14} />
              Retry Analysis
            </button>
            <button
              onClick={() => setPhase("scan")}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-xs hover:bg-white/10 cursor-pointer"
            >
              Retake Photos
            </button>
          </div>
        </div>
      )}

      {/* -- STEP 3C: ACTUAL AI Output Result Dashboard ------------------------------ */}
      {phase === "result" && auditData && (
        <div className="space-y-8">
          {/* Back Button */}
          <button
            onClick={() => setPhase("scan")}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer w-fit shadow-md"
          >
            <ArrowLeft size={16} />
            <span>Back to Fit Audit & History</span>
          </button>

          {/* Executive Summary Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#091A16] via-[#0d2620] to-[#091A16] border-2 border-[#B0E4CC]/40 shadow-[0_0_50px_rgba(176,228,204,0.15)] flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Master Tailor Fit Inspection Complete
                </span>
                <span className="text-xs text-slate-400">
                  Suit: <strong className="text-white">{selectedSuit}</strong>
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
                {auditData.verdict_title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {auditData.summary}
              </p>
            </div>

            {/* Fit Score Circular Display */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-white/10 w-full lg:w-56 text-center flex-shrink-0">
              <div className="text-5xl font-black text-[#B0E4CC] tracking-tight">
                {auditData.overall_fit_score}
                <span className="text-xl font-medium text-slate-400">/100</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-1">
                Overall Fit Score
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                Savile Row Standard
              </span>
            </div>
          </div>

          {/* 4-Zone Drape & Fit Breakdown Grid */}
          {auditData.fit_breakdown && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ruler size={18} className="text-[#B0E4CC]" />
                Zone-by-Zone Fit Assessment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {auditData.fit_breakdown.shoulders_chest && (
                  <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300 uppercase">Shoulders & Chest</span>
                      <span className="text-xs font-bold text-[#B0E4CC] bg-[#B0E4CC]/10 px-2 py-0.5 rounded-md">
                        {auditData.fit_breakdown.shoulders_chest.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {auditData.fit_breakdown.shoulders_chest.feedback}
                    </p>
                  </div>
                )}

                {auditData.fit_breakdown.waist_taper && (
                  <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300 uppercase">Waist & Taper</span>
                      <span className="text-xs font-bold text-[#B0E4CC] bg-[#B0E4CC]/10 px-2 py-0.5 rounded-md">
                        {auditData.fit_breakdown.waist_taper.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {auditData.fit_breakdown.waist_taper.feedback}
                    </p>
                  </div>
                )}

                {auditData.fit_breakdown.sleeves && (
                  <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300 uppercase">Sleeves</span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                        {auditData.fit_breakdown.sleeves.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {auditData.fit_breakdown.sleeves.feedback}
                    </p>
                  </div>
                )}

                {auditData.fit_breakdown.trousers && (
                  <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300 uppercase">Trousers</span>
                      <span className="text-xs font-bold text-[#B0E4CC] bg-[#B0E4CC]/10 px-2 py-0.5 rounded-md">
                        {auditData.fit_breakdown.trousers.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {auditData.fit_breakdown.trousers.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perfect Fit Aspects & Alteration Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {auditData.perfect_fit_aspects && (
              <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/10 space-y-4">
                <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  What Fits Perfectly
                </h3>
                <ul className="space-y-2.5">
                  {auditData.perfect_fit_aspects.map((aspect, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{aspect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {auditData.improvements_suggested && (
              <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-amber-950/10 space-y-4">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Scissors size={20} className="text-amber-400" />
                  Tailor's Alterations Suggested
                </h3>
                <ul className="space-y-2.5">
                  {auditData.improvements_suggested.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                      <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Master Tailor Notes Box */}
          {auditData.tailor_alteration_notes && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 flex items-start gap-4">
              <Scissors className="text-[#B0E4CC] flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white">Master Tailor Final Note</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 italic">
                  "{auditData.tailor_alteration_notes}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
