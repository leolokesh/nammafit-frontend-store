"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Ruler,
  Weight,
  Shirt,
  Calendar,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  Info,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import type { Product } from "@/types";
import Select from "@/components/ui/Select";
import { BodyScan } from "@/components/scan/BodyScan";

const API_BASE = "https://fitintelligence.onrender.com";

const SHAPE_OPTIONS = [
  { v: "full_body", label: "Full Body" },
  { v: "slim", label: "Slim" },
  { v: "regular", label: "Regular" },
  { v: "curvy", label: "Curvy" },
  { v: "super_curvy", label: "Super Curvy" },
];

const SIZE_OPTIONS = ["3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "7XL", "8XL", "9XL", "10XL"];

const FIT_OPTIONS = [
  { v: "regular", label: "Regular" },
  { v: "relaxed", label: "Relaxed" },
];

const FIT_ISSUES = [
  { v: "good", label: "All good" },
  { v: "tight_bust", label: "Tight bust" },
  { v: "loose_bust", label: "Loose bust" },
  { v: "tight_waist", label: "Tight waist" },
  { v: "loose_waist", label: "Loose waist" },
  { v: "tight_hip", label: "Tight hip" },
  { v: "loose_hip", label: "Loose hip" },
];

const MEASUREMENT_KEYS = [
  { k: "bust", label: "Bust" },
  { k: "waist", label: "Waist" },
  { k: "hip", label: "Hip" },
  { k: "shoulder", label: "Shoulder" },
  { k: "thigh", label: "Thigh" },
  { k: "inseam", label: "Inseam" },
];

function getKeysForCategory(category: string) {
  if (category === "TOPWEAR") {
    return ["shoulder", "bust", "waist", "hip"];
  }
  if (category === "BOTTOMWEAR") {
    return ["waist", "hip", "thigh", "inseam"];
  }
  return ["bust", "waist", "hip", "shoulder", "thigh", "inseam"];
}

export const getSessionCustomerId = (): number => {
  if (typeof window === "undefined") return 0;
  let idStr = sessionStorage.getItem("nammafit_customer_id");
  if (!idStr) {
    // Generate a random 13 digit number
    let val = "";
    val += Math.floor(Math.random() * 9) + 1; // 1-9
    for (let i = 0; i < 12; i++) {
      val += Math.floor(Math.random() * 10); // 0-9
    }
    sessionStorage.setItem("nammafit_customer_id", val);
    idStr = val;
  }
  return Number(idStr);
};

const LOADING_MESSAGES = [
  "Mapping your fit signature…",
  "Cross-referencing garment specs…",
  "Calibrating against fit cohorts…",
  "Computing precision drape…",
  "Reading the fabric’s memory…",
  "Aligning recommendation with your shape…",
  "Finalising your perfect size…",
];

const PART_LABELS = {
  bust: "Bust",
  waist: "Waist",
  hip: "Hip",
  shoulder: "Shoulder",
  thigh: "Thigh",
  inseam: "Inseam",
};

const GENERIC_ERROR = "Sorry for the trouble, please try again or after some time.";

// Custom Switch component to avoid Radix dependencies
export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#408A71]" : "bg-slate-800"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// Custom ValarSelect dropdown
function ValarSelect({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  testid?: string;
}) {
  return (
    <Select
      value={value}
      onChange={onValueChange}
      options={options}
      placeholder={placeholder}
    />
  );
}

interface DemoPanelProps {
  product: Product;
  resetSignal?: number;
  shopPhoneNumber?: string;
}

export function DemoPanel({ product, resetSignal, shopPhoneNumber }: DemoPanelProps) {
  const [showBodyScan, setShowBodyScan] = useState(true);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(25);
  const [shape, setShape] = useState("regular");
  const [usualSize, setUsualSize] = useState("M");
  const [fitPref, setFitPref] = useState("regular");
  const [fitIssues, setFitIssues] = useState<string[]>(["good"]);

  const [measureToggle, setMeasureToggle] = useState(false);
  const [measurements, setMeasurements] = useState<any>(null);
  const [estimateStatus, setEstimateStatus] = useState("idle");

  const [recoStatus, setRecoStatus] = useState("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showShapeGuide, setShowShapeGuide] = useState(false);
  const [widgetUnit, setWidgetUnit] = useState<"cm" | "inch">("inch");
  const [hasEdited, setHasEdited] = useState(false);

  const activeKeys = getKeysForCategory(product.wear_category);

  const handleWidgetUnitToggle = (newUnit: "cm" | "inch") => {
    if (newUnit === widgetUnit) return;
    if (measurements) {
      const next = { ...measurements };
      MEASUREMENT_KEYS.forEach(({ k }) => {
        const val = next[k];
        if (val !== undefined && val !== null && val !== "") {
          const num = Number(val);
          if (!isNaN(num)) {
            if (newUnit === "inch") {
              next[k] = Number((num / 2.54).toFixed(1));
            } else {
              next[k] = Number((num * 2.54).toFixed(1));
            }
          }
        }
      });
      setMeasurements(next);
    }
    setWidgetUnit(newUnit);
  };

  useEffect(() => {
    setRecoStatus("idle");
    setResult(null);
    setError("");
    setEstimateStatus("idle");
    setMeasureToggle(false);
    setMeasurements(null);
    setWidgetUnit("inch");
    setHasEdited(false);
    setFitIssues(["good"]);
    setShowBodyScan(true);
  }, [resetSignal, product]);

  const toggleFitIssue = (v: string) => {
    setFitIssues((prev) => {
      if (v === "good") return prev.includes("good") ? [] : ["good"];
      
      // Remove "good" if user selects a specific issue
      let next = prev.filter((x) => x !== "good");
      
      if (next.includes(v)) {
        return next.filter((x) => x !== v);
      } else {
        // Enforce mutual exclusivity per body part (cannot select both tight & loose)
        if (v === "tight_bust") next = next.filter((x) => x !== "loose_bust");
        if (v === "loose_bust") next = next.filter((x) => x !== "tight_bust");
        if (v === "tight_waist") next = next.filter((x) => x !== "loose_waist");
        if (v === "loose_waist") next = next.filter((x) => x !== "tight_waist");
        if (v === "tight_hip") next = next.filter((x) => x !== "loose_hip");
        if (v === "loose_hip") next = next.filter((x) => x !== "tight_hip");
        
        return [...next, v];
      }
    });
  };

  const buildCustomerPayload = () => ({
    height: Number(height),
    weight: Number(weight),
    age: Number(age),
    shape,
    usual_size: usualSize,
    fit_issues: fitIssues,
  });

  const fetchEstimate = async () => {
    setEstimateStatus("loading");
    try {
      const { data } = await axios.post(`${API_BASE}/estimate-body`, {
        customer: buildCustomerPayload(),
      });
      const next: any = {};
      MEASUREMENT_KEYS.forEach(({ k }) => {
        let m = data?.body?.[k]?.mean;
        if (typeof m === "number") {
          if (widgetUnit === "inch") {
            m = Number((m / 2.54).toFixed(1));
          } else {
            m = Math.round(m);
          }
        }
        next[k] = typeof m === "number" ? m : "";
      });
      setMeasurements(next);
      setEstimateStatus("ready");
    } catch (e) {
      console.error(e);
      setMeasurements(null);
      setEstimateStatus("error");
    }
  };

  const onToggleMeasurements = (next: boolean) => {
    setMeasureToggle(next);
    setHasEdited(false);
    if (next) {
      fetchEstimate();
    } else {
      setMeasurements(null);
      setEstimateStatus("idle");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoStatus("loading");
    setError("");
    setResult(null);

    const payload = {
      product_id: product.id,
      customer_id: getSessionCustomerId(),
      height: Number(height),
      weight: Number(weight),
      age: Number(age),
      shape,
      usual_size: usualSize,
      fit_pref: fitPref,
      fit_issues: fitIssues,
      measurements:
        measureToggle && measurements && hasEdited
          ? Object.fromEntries(
              MEASUREMENT_KEYS.map(({ k }) => {
                if (!activeKeys.includes(k)) {
                  return [k, null];
                }
                const val = measurements[k];
                if (val === "" || val == null) {
                  return [k, null];
                }
                let num = Number(val);
                if (isNaN(num)) {
                  return [k, null];
                }
                if (widgetUnit === "inch") {
                  num = Number((num * 2.54).toFixed(1));
                }
                return [k, num];
              })
            )
          : Object.fromEntries(MEASUREMENT_KEYS.map(({ k }) => [k, null])),
    };

    console.log("DemoPanel onSubmit payload debug:", {
      widgetUnit,
      payload
    });

    try {
      const { data } = await publicApi.recommendSize(payload);
      setResult(data);
      setRecoStatus("success");
    } catch (err) {
      console.error(err);
      setError(GENERIC_ERROR);
      setRecoStatus("error");
    }
  };

  const goBackToForm = () => {
    setRecoStatus("idle");
    setResult(null);
    setError("");
  };

  const handleWhatsAppOrder = () => {
    const recommended = result?.recommended_size || "Not Recommended";

    const messageLines = [
      "*📦 NEW ORDER*",
      "",
      `*🛒 Product Details:*`,
      `• Name: ${product.name}`,
      `• Fabric: ${product.fabric_name || "Premium Fabric"}`,
      `• Category: ${product.wear_category || "N/A"}`,
      "",
      `*📏 Recommended Size:*`,
      `• Size: *${recommended}*`,
    ];

    const messageText = messageLines.join("\n");
    const cleanPhone = (shopPhoneNumber || "").replace(/\D/g, "");
    
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, "_blank");
  };

  if (showBodyScan) {
    return (
      <BodyScan
        onComplete={() => setShowBodyScan(false)}
        onCancel={() => setShowBodyScan(false)}
      />
    );
  }

  return (
    <div className="conic-border rounded-3xl overflow-hidden shadow-[0_40px_120px_-60px_rgba(176,228,204,0.25)] bg-[#091413]">
      <AnimatePresence mode="wait">
        {(recoStatus === "idle" || recoStatus === "error") && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <FormView
              onSubmit={onSubmit}
              height={height}
              setHeight={setHeight}
              weight={weight}
              setWeight={setWeight}
              age={age}
              setAge={setAge}
              shape={shape}
              setShape={setShape}
              usualSize={usualSize}
              setUsualSize={setUsualSize}
              fitPref={fitPref}
              setFitPref={setFitPref}
              fitIssues={fitIssues}
              toggleFitIssue={toggleFitIssue}
              measureToggle={measureToggle}
              onToggleMeasurements={onToggleMeasurements}
              estimateStatus={estimateStatus}
              measurements={measurements}
              setMeasurements={setMeasurements}
              recoStatus={recoStatus}
              error={error}
              showShapeGuide={showShapeGuide}
              setShowShapeGuide={setShowShapeGuide}
              widgetUnit={widgetUnit}
              handleWidgetUnitToggle={handleWidgetUnitToggle}
              activeKeys={activeKeys}
              setHasEdited={setHasEdited}
            />
          </motion.div>
        )}

        {recoStatus === "loading" && <LoadingView key="loading" />}

        {recoStatus === "success" && result && (
          <ResultView 
            key="result" 
            result={result} 
            onTryAgain={goBackToForm} 
            onWhatsAppOrder={handleWhatsAppOrder} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============= FORM ============= */
function FormView({
  onSubmit,
  height,
  setHeight,
  weight,
  setWeight,
  age,
  setAge,
  shape,
  setShape,
  usualSize,
  setUsualSize,
  fitPref,
  setFitPref,
  fitIssues,
  toggleFitIssue,
  measureToggle,
  onToggleMeasurements,
  estimateStatus,
  measurements,
  setMeasurements,
  recoStatus,
  error,
  showShapeGuide,
  setShowShapeGuide,
  widgetUnit,
  handleWidgetUnitToggle,
  activeKeys,
  setHasEdited,
}: any) {
  return (
    <form onSubmit={onSubmit} data-testid="demo-form" className="p-6 md:p-9 text-left">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#B0E4CC]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC]" />
        Input
      </div>
      <h3 className="mt-3 font-display text-2xl md:text-3xl text-white tracking-tight font-light">
        Tell the engine about you.
      </h3>

      <div className="mt-8 space-y-7">
        {/* Row: Height + Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SliderField
            icon={Ruler}
            label="Height"
            unit="cm"
            min={140}
            max={210}
            value={height}
            onChange={setHeight}
            testid="demo-input-height"
          />
          <SliderField
            icon={Weight}
            label="Weight"
            unit="kg"
            min={40}
            max={140}
            value={weight}
            onChange={setWeight}
            testid="demo-input-weight"
          />
        </div>

        {/* Row: Age + Shape */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={Calendar}>Age</FieldLabel>
            <input
              type="number"
              data-testid="demo-input-age"
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl bg-[#091413] border border-[#B0E4CC]/15 text-white/90 focus:border-[#B0E4CC]/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/55">Shape</span>
              <button
                type="button"
                onClick={() => setShowShapeGuide(true)}
                className="text-[#B0E4CC] hover:text-white transition-colors cursor-pointer focus:outline-none flex items-center justify-center p-0.5"
                title="Body Shape Guide"
              >
                <Info size={14} />
              </button>
            </div>
            <ValarSelect
              testid="demo-input-shape"
              value={shape}
              onValueChange={setShape}
              options={SHAPE_OPTIONS.map((o) => ({ value: o.v, label: o.label }))}
            />
          </div>
        </div>

        {/* Row: Usual Size + Fit Preference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel icon={Shirt}>Usual size</FieldLabel>
            <ValarSelect
              testid="demo-input-usual-size"
              value={usualSize}
              onValueChange={setUsualSize}
              options={SIZE_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div>
            <FieldLabel>Fit preference</FieldLabel>
            <ValarSelect
              testid="demo-input-fit-pref"
              value={fitPref}
              onValueChange={setFitPref}
              options={FIT_OPTIONS.map((o) => ({ value: o.v, label: o.label }))}
            />
          </div>
        </div>

        {/* Fit issues */}
        <div>
          <FieldLabel>Fit issues</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {FIT_ISSUES.map((opt) => {
              const active = fitIssues.includes(opt.v);
              return (
                <button
                  key={opt.v}
                  type="button"
                  data-testid={`demo-fit-issue-${opt.v}`}
                  onClick={() => toggleFitIssue(opt.v)}
                  className={`px-3 py-1.5 rounded-full text-[12px] tracking-wide border transition ${
                    active
                      ? "border-[#B0E4CC]/60 bg-[#B0E4CC]/10 text-white"
                      : "border-[#B0E4CC]/15 bg-[#091413] text-white/55 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Helper + toggle */}
        <div className="rounded-2xl border border-[#B0E4CC]/12 bg-[#091413]/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] tracking-[0.18em] uppercase text-white/75">
                Enter actual measurements
              </span>
              {measureToggle && (
                <div className="flex items-center gap-0.5 p-0.5 bg-white/5 border border-white/10 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleWidgetUnitToggle("inch")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      widgetUnit === "inch"
                        ? "bg-[#408A71] text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    inch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWidgetUnitToggle("cm")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      widgetUnit === "cm"
                        ? "bg-[#408A71] text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    cm
                  </button>
                </div>
              )}
            </div>
            <Switch checked={measureToggle} onCheckedChange={onToggleMeasurements} />
          </div>

          <AnimatePresence initial={false}>
            {measureToggle && (
              <motion.div
                key="measurements"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-5">
                  <p className="text-[12.5px] text-white/55 leading-relaxed mb-4">
                    Values are predicted by your height, weight, age and shape. Enter
                    the actual measurements to get an even more accurate size.
                  </p>
                  {estimateStatus === "loading" && (
                    <div className="flex items-center gap-2 text-[#B0E4CC] text-[12px] tracking-[0.22em] uppercase">
                      <Loader2 size={14} className="animate-spin" /> Estimating
                      body…
                    </div>
                  )}
                  {estimateStatus === "error" && (
                    <div className="text-[12px] text-red-300/80">
                      {GENERIC_ERROR}
                    </div>
                  )}
                  {estimateStatus === "ready" && measurements && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {MEASUREMENT_KEYS.filter(({ k }) => activeKeys.includes(k)).map(({ k, label }) => (
                        <div key={k}>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1.5">
                            {label}
                          </div>
                          <div className="flex items-center rounded-xl border border-[#B0E4CC]/15 bg-[#091413] focus-within:border-[#B0E4CC]/45 transition-colors">
                            <input
                              type="number"
                              data-testid={`demo-measurement-${k}`}
                              value={measurements[k] ?? ""}
                              onChange={(e) => {
                                setMeasurements((m: any) => ({
                                  ...m,
                                  [k]: e.target.value,
                                }));
                                setHasEdited(true);
                              }}
                              className="flex-1 min-w-0 h-9 bg-transparent pl-3 pr-1 text-white/90 text-sm focus:outline-none"
                            />
                            <span className="flex-shrink-0 pr-3 text-[10px] uppercase tracking-[0.2em] text-[#B0E4CC]/40">
                              {widgetUnit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {recoStatus === "error" && error && (
          <div className="text-[13px] text-red-300/85" data-testid="demo-error">
            {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        data-testid="demo-submit"
        className="glow-ring mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#285A48] hover:bg-[#408A71] disabled:opacity-70 px-6 py-3.5 text-white text-sm font-medium tracking-wide cursor-pointer transition-colors"
      >
        <Sparkles size={16} /> Recommend My Size
      </button>

      {/* ── Body Shape Guide Modal ── */}
      {showShapeGuide && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#0c1a18] border border-[#B0E4CC]/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowShapeGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-lg focus:outline-none"
            >
              &times;
            </button>
            <h4 className="text-sm font-semibold text-[#B0E4CC] tracking-wider uppercase flex items-center gap-2 mb-5">
              <Info size={14} /> Body Shape Guide
            </h4>
            <div className="space-y-4 text-xs">
              <div className="border-b border-[#B0E4CC]/10 pb-3">
                <div className="font-semibold text-slate-200 text-[13px]">Full Body</div>
                <div className="text-slate-400 mt-1">Bust is bigger than hips</div>
              </div>
              <div className="border-b border-[#B0E4CC]/10 pb-3">
                <div className="font-semibold text-slate-200 text-[13px]">Slim</div>
                <div className="text-slate-400 mt-1">Bust and hips are almost the same size</div>
              </div>
              <div className="border-b border-[#B0E4CC]/10 pb-3">
                <div className="font-semibold text-slate-200 text-[13px]">Regular</div>
                <div className="text-slate-400 mt-1">Hips are a little bigger than bust</div>
              </div>
              <div className="border-b border-[#B0E4CC]/10 pb-3">
                <div className="font-semibold text-slate-200 text-[13px]">Curvy</div>
                <div className="text-slate-400 mt-1">Hips are noticeably bigger than bust</div>
              </div>
              <div className="pb-1">
                <div className="font-semibold text-slate-200 text-[13px]">Super Curvy</div>
                <div className="text-slate-400 mt-1">Hips are much bigger than bust</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowShapeGuide(false)}
              className="btn-primary w-full mt-6 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

/* ============= LOADING ============= */
function LoadingView() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      1700
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative px-6 md:px-12 py-16 md:py-24 min-h-[420px] flex flex-col items-center justify-center text-center overflow-hidden"
      data-testid="demo-loading"
      style={{
        background:
          "radial-gradient(700px 420px at 50% 50%, rgba(64,138,113,0.28), rgba(9,20,19,1) 70%)",
      }}
    >
      <div className="valar-orb absolute -top-32 left-1/2 -translate-x-1/2 opacity-50 pointer-events-none" />

      <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border border-[#B0E4CC]/30 bg-[#091413]/70 backdrop-blur-md">
        <span className="absolute inset-0 rounded-full animate-valar-pulse" />
        <Sparkles size={22} className="text-[#B0E4CC]" />
      </div>

      <div className="relative mt-6 text-[10px] uppercase tracking-[0.32em] text-[#B0E4CC]/85 font-semibold">
        NammaFit Engine
      </div>

      <h3 className="relative mt-3 font-display text-2xl md:text-3xl text-white tracking-tight font-light">
        Computing your{" "}
        <span className="italic text-[#B0E4CC]">precision fit</span>
      </h3>

      <div className="relative mt-5 h-7 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block text-white/60 text-sm md:text-[15px]"
            data-testid="demo-loading-msg"
          >
            {LOADING_MESSAGES[idx]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mt-7 w-full max-w-xs h-1 rounded-full overflow-hidden bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#408A71] via-[#B0E4CC] to-[#408A71]"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ============= RESULT ============= */
function ResultView({ result, onTryAgain, onWhatsAppOrder }: any) {
  const recommended = result?.recommended_size;
  const sizes = Array.isArray(result?.all_sizes_ranked) ? result.all_sizes_ranked : [];
  const explanation = result?.explanation || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-6 md:p-9 text-left animate-slide-up"
      data-testid="demo-output"
      style={{
        background:
          "radial-gradient(900px 500px at 50% -10%, rgba(64,138,113,0.22), rgba(9,20,19,1) 70%)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onTryAgain}
          data-testid="demo-try-again"
          className="glow-ring inline-flex items-center gap-1.5 rounded-full border border-[#B0E4CC]/25 bg-[#091413]/60 px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-white/80 hover:text-white hover:border-[#B0E4CC]/55 cursor-pointer transition-all"
        >
          <ArrowLeft size={12} /> Try again
        </button>

        <button
          type="button"
          onClick={onWhatsAppOrder}
          className="glow-ring inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3.5 py-1.5 text-[11px] tracking-[0.18em] uppercase text-[#25D366] hover:text-white hover:bg-[#25D366]/20 hover:border-[#25D366]/60 cursor-pointer transition-all font-semibold"
        >
          <svg
            className="w-3.5 h-3.5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.706 1.458h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Order on WhatsApp
        </button>
      </div>

      {/* Hero size */}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-10 gap-y-3 items-end">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">
            Recommended Size
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            data-testid="demo-result-size"
            className="font-display text-[5.5rem] md:text-[7rem] leading-none text-[#B0E4CC]"
          >
            {recommended || "—"}
          </motion.div>
        </div>
        {explanation.size_justification && (
          <p
            data-testid="demo-result-justification"
            className="text-white/75 text-sm md:text-[15px] leading-relaxed border-l border-[#B0E4CC]/30 pl-4 max-w-xl"
          >
            {explanation.size_justification}
          </p>
        )}
      </div>

      {/* All sizes ranked — visualised */}
      {sizes.length > 0 && (
        <div className="mt-9">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/45">
            <span>Size fit map</span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#B0E4CC]/25 to-transparent" />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sizes.slice(0, 6).map((s: any, i: number) => (
              <SizeFitCard
                key={`${s.size}-${i}`}
                size={s.size}
                fitNotes={s.fit_notes || {}}
                score={s.score}
                isBest={s.size === recommended}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fit summary */}
      {Array.isArray(explanation.fit_summary) && explanation.fit_summary.length > 0 && (
        <div className="mt-9">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/45">
            <span>Fit summary</span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#B0E4CC]/25 to-transparent" />
          </div>
          <ul className="mt-4 space-y-2.5">
            {explanation.fit_summary.map((line: string, i: number) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                className="flex gap-3 text-[14px] text-white/75 leading-relaxed"
              >
                <CheckCircle2 size={15} className="text-[#B0E4CC] mt-0.5 shrink-0" />
                <span>{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Pickup line */}
      {explanation.pickup_line && (
        <div className="mt-9 pt-6 border-t border-[#B0E4CC]/15">
          <p className="font-display italic text-[#B0E4CC] text-[15px] md:text-base leading-relaxed">
            “{explanation.pickup_line}”
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* SizeFitCard — visual fit map per size */
function SizeFitCard({ size, fitNotes, score, isBest }: any) {
  const parts = Object.keys(PART_LABELS).filter((p) => fitNotes[p] != null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      data-testid={`demo-result-size-row-${size}`}
      className={`relative rounded-2xl p-4 md:p-5 overflow-hidden border transition ${
        isBest ? "border-[#B0E4CC]/55" : "border-[#B0E4CC]/15 hover:border-[#B0E4CC]/35"
      }`}
      style={{
        background: isBest
          ? "linear-gradient(180deg, rgba(64,138,113,0.22), rgba(9,20,19,0.7))"
          : "rgba(9,20,19,0.55)",
      }}
    >
      {isBest && (
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-40 h-40 rounded-full opacity-50 pointer-events-none"
          style={{
            background: "radial-gradient(closest-side, rgba(176,228,204,0.35), rgba(9,20,19,0))",
          }}
        />
      )}

      <div className="relative flex items-start justify-between">
        <div className="font-display text-3xl md:text-4xl text-white tracking-tight leading-none">
          {size}
        </div>
        {isBest ? (
          <span className="text-[9.5px] tracking-[0.24em] uppercase text-[#B0E4CC] border border-[#B0E4CC]/45 rounded-full px-2 py-0.5 font-bold">
            Best
          </span>
        ) : (
          <span className="text-[9.5px] tracking-[0.22em] uppercase text-white/40">
            Alt
          </span>
        )}
      </div>

      {parts.length === 0 ? (
        <div className="mt-4 text-[12.5px] text-white/55">No notable fit issues.</div>
      ) : (
        <div className="mt-4 space-y-2">
          {parts.map((p) => (
            <FitRow key={p} part={p} kind={fitNotes[p]} />
          ))}
        </div>
      )}

      {typeof score === "number" && (
        <div className="relative mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/45">
          <span>Fit score</span>
          <span className="text-white/75">{Math.round(score)}</span>
        </div>
      )}
    </motion.div>
  );
}

function FitRow({ part, kind }: any) {
  const labelColor: any = {
    tight: "text-amber-200/85",
    perfect: "text-[#B0E4CC]",
    loose: "text-sky-200/85",
  };

  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span className="text-white/60">
        {PART_LABELS[part as keyof typeof PART_LABELS] || part}
      </span>
      <span className={`tracking-[0.12em] uppercase font-semibold text-[11px] ${labelColor[kind] || "text-white/55"}`}>
        {kind}
      </span>
    </div>
  );
}

function FieldLabel({ icon: Icon, children }: any) {
  return (
    <div className="text-[11px] uppercase tracking-[0.22em] text-white/55 mb-2 flex items-center gap-2">
      {Icon ? <Icon size={13} /> : null}
      {children}
    </div>
  );
}

function SliderField({ icon: Icon, label, unit, min, max, value, onChange, testid }: any) {
  return (
    <div>
      <FieldLabel icon={Icon}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          data-testid={testid}
          className="flex-1 accent-[#B0E4CC] bg-transparent cursor-pointer"
        />
        <div className="min-w-[68px] text-right">
          <span className="font-display text-lg text-white tracking-tight">{value}</span>
          <span className="ml-1 text-[10px] text-white/45 uppercase tracking-[0.2em]">{unit}</span>
        </div>
      </div>
    </div>
  );
}
