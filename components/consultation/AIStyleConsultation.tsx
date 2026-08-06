"use client";

import { CustomSelect } from "@/components/ui/CustomSelect";
import React, { useState, useEffect } from "react";
import { customerApi, styleConsultationApi } from "@/lib/api";
import api from "@/lib/axios";
import {
  Sparkles,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Crown,
  Shirt,
  Scissors,
  Layers,
  Palette,
  Clock,
  User,
  FileText,
  Bookmark,
  Download,
  RotateCcw,
  Ruler,
  Check,
  Zap,
  Star,
  ShieldCheck,
  ChevronRight,
  Users,
  Plus,
  Calendar,
  Sliders,
  Tag,
  Lock,
  AlertCircle
} from "lucide-react";
import { BodyScan } from "@/components/scan/BodyScan";
import { DownloadPdfModal } from "./DownloadPdfModal";
import { useToastContext } from "@/contexts/ToastContext";
import { useCustomerContext } from "@/contexts/CustomerContext";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/lib/axios";

// --- Style Cards Config -------------------------------------------------------
interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  tag: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "Classic",
    name: "Classic",
    description: "Timeless, structured tailoring with refined notch or peak lapels.",
    icon: Shirt,
    tag: "Traditional & Timeless",
  },
  {
    id: "Modern",
    name: "Modern",
    description: "Sleek slim silhouettes, contemporary cuts, and subtle texture contrasts.",
    icon: Zap,
    tag: "Sleek & Contemporary",
  },
  {
    id: "Luxury",
    name: "Luxury",
    description: "Rich Italian fabrics, opulent sheen, and hand-stitched silk detailing.",
    icon: Crown,
    tag: "Opulent & High-End",
  },
  {
    id: "Minimal",
    name: "Minimal",
    description: "Clean lines, monochromatic tones, hidden buttons, and understated elegance.",
    icon: Layers,
    tag: "Clean & Monochromatic",
  },
  {
    id: "Traditional",
    name: "Traditional",
    description: "Cultural heritage aesthetics, intricate embroidery, and bandhgala cuts.",
    icon: Scissors,
    tag: "Cultural & Heritage",
  },
  {
    id: "Statement",
    name: "Statement",
    description: "Bold contrasting lapels, vibrant accents, unique textures, and standout flair.",
    icon: Sparkles,
    tag: "Bold & Standout",
  },
];

// --- Dummy Recommendation Data -----------------------------------------------
export interface RecommendationItem {
  id: string;
  dbId?: string;
  added_by_user?: boolean;
  name: string;
  isAiRecommended?: boolean;
  image: string;
  badge?: string;
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

const RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "classic-navy",
    name: "Classic Navy Elegance",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    details: {
      suitColor: "Deep Royal Navy Blue",
      fabric: "Super 130s Merino Wool & Cashmere",
      fit: "Classic Tailored Fit",
      lapelStyle: "Satin Notch Lapel",
      pieces: "Three-Piece (Jacket, Vest, Trousers)",
      shirt: "Crisp White Royal Oxford Cotton",
      tie: "Midnight Navy Silk Tie",
      color: "Deep Royal Navy Blue (#1B2A4A)",
      accessories: "Silver Engraved Cufflinks & White Silk Pocket Square",
      estimatedPrice: "₹36,500 ($440)",
      deliveryTime: "5 - 7 Business Days",
    },
    whyThisWorks:
      "This outfit complements your body proportions, matches your selected wedding occasion, creates a balanced silhouette, and provides timeless elegance within your selected budget.",
  },
  {
    id: "modern-charcoal",
    name: "Modern Charcoal Prestige",
    isAiRecommended: true,
    badge: "⭐ AI Recommended",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    details: {
      suitColor: "Metallic Charcoal Gray & Satin Trim",
      fabric: "Super 150s Wool & Mulberry Silk Blend",
      fit: "Tailored Slim Fit",
      lapelStyle: "Satin Peak Lapel",
      pieces: "Three-Piece (Jacket, Double-Breasted Vest, Trousers)",
      shirt: "Ivory Twill Cotton Spread Collar Shirt",
      tie: "Charcoal Silk Bowtie with Satin Edging",
      color: "Metallic Charcoal Gray (#20252B)",
      accessories: "Onyx & Rose Gold Cufflinks, Charcoal Silk Pocket Square",
      estimatedPrice: "₹48,500 ($580)",
      deliveryTime: "4 - 6 Business Days",
    },
    whyThisWorks:
      "This outfit elongates your posture with sharp slim-fit trousers, harmonizes perfectly with evening hotel ballroom lighting, and highlights your role with refined peak lapels.",
    whyAiSelectedThis:
      "Our AI determined this outfit offers the best balance of color harmony, body proportions, occasion suitability, and personal style preferences.",
  },
  {
    id: "royal-emerald",
    name: "Royal Emerald Signature",
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80",
    details: {
      suitColor: "Deep Royal Emerald & Black Satin Accents",
      fabric: "Italian Velvet & Fine Wool Blend",
      fit: "Contemporary Slim Fit",
      lapelStyle: "Shawl Collar Velvet Lapel",
      pieces: "Two-Piece Tuxedo (Jacket, Trousers)",
      shirt: "Pleated Formal Tuxedo Shirt in Pure White",
      tie: "Black Velvet Bowtie",
      color: "Deep Royal Emerald Green (#285A48)",
      accessories: "Gold Geometric Cufflinks, Emerald Silk Pocket Square",
      estimatedPrice: "₹62,000 ($740)",
      deliveryTime: "7 - 10 Business Days",
    },
    whyThisWorks:
      "A bold, opulent ensemble designed for high-profile reception celebrations, using rich emerald velvet to create a standout visual presence while complementing your body posture.",
  },
];

const LOADING_TEXTS = [
  "Analyzing body profile...",
  "Understanding event requirements...",
  "Matching colors...",
  "Selecting fabrics...",
  "Creating recommendations...",
];

export default function AIStyleConsultation() {
  const router = useRouter();
  const { addToast } = useToastContext();

  // Updated Flow Sequence:
  // Step 1: AI Style Consultation (Welcome)
  // Step 2: Start Body Scan & Capture Two Photos (Front + Side Camera/Upload)
  // Step 3: Customer Details Form
  // Step 4: AI Processing (Loading Screen)
  // Step 5: AI Style Recommendations
  const [step, setStep] = useState<number>(2);

  // Global Customer Selection Context
  const {
    selectedCustomerId,
    selectedCustomer,
    selectCustomer,
    customers,
  } = useCustomerContext();

  const setSelectedCustomerId = (id: string) => selectCustomer(id);

  // Previous Recommendations State for Selected Customer
  const [previousConsultations, setPreviousConsultations] = useState<any[]>([]);
  const [loadingPrevConsultations, setLoadingPrevConsultations] = useState<boolean>(false);

  useEffect(() => {
    const loadPreviousConsultations = async () => {
      if (!selectedCustomerId) {
        setPreviousConsultations([]);
        return;
      }
      setLoadingPrevConsultations(true);
      try {
        const { data } = await styleConsultationApi.getByCustomer(Number(selectedCustomerId));
        setPreviousConsultations(data || []);
      } catch (err) {
        console.warn("Could not load previous consultations for customer:", err);
      } finally {
        setLoadingPrevConsultations(false);
      }
    };

    loadPreviousConsultations();
  }, [selectedCustomerId]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialProgress, setInitialProgress] = useState(1);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  useEffect(() => {
    setInitialLoading(true);
    setInitialProgress(1);

    const intervalTime = 50;
    const totalSteps = 100;
    const stepIncrement = 100 / totalSteps;

    const timer = setInterval(() => {
      setInitialProgress((prev) => {
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

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    setIsEditingCustomer(false);
    const found = customers.find((c) => String(c.id) === id) || null;
    if (found) {
      setFormData((prev) => ({
        ...prev,
        height: found.height ? `${found.height} cm` : prev.height,
        additionalNotes: (found as any).notes ? `Customer Notes: ${(found as any).notes}.` : prev.additionalNotes,
      }));
    }
  };

  // Form Sub-Step (1-7) State for Step 3 Customer Details Form
  const [formSubStep, setFormSubStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Event Details
    occasion: "Wedding",
    customerRole: "Groom",
    eventTime: "Evening",
    venue: "Luxury Ballroom",
    season: "Winter",
    height: "180 cm",

    // Step 2: Personal Style
    stylePreference: "Modern",
    desiredImpression: "Royal",
    formalityLevel: 75,
    styleInspiration: "Tom Ford",

    // Step 3: Colors
    favoriteColor: "Navy",
    colorsToAvoid: ["Mustard Yellow"] as string[],
    partnerColor: "Ivory Gold",
    contrastPreference: "Balanced",

    // Step 4: Jacket Design
    lapelStyle: "Peak Lapel (Luxury & Weddings)",
    suitStyle: "Tuxedo",
    waistcoatStyle: "3-Piece Suit",
    pocketStyle: "Flap Pocket",
    fitPreference: "Slim Fit",

    // Step 5: Budget
    budget: "Premium",

    // Step 6: Accessories
    accessories: ["Waistcoat", "Pocket Square", "Bow Tie"] as string[],

    // Step 7: Additional Notes
    additionalNotes: "",
  });

  // Photos State
  const [photosCaptured, setPhotosCaptured] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<{ front: string; side: string; skinTone: string }>({
    front: "",
    side: "",
    skinTone: ""
  });

  // Loading Cycling Text State for Step 4
  const [loadingIndex, setLoadingIndex] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Save, Add to Account & PDF Modal States
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const [addedToAccount, setAddedToAccount] = useState<Record<string, boolean>>({});
  const [selectedPdfItem, setSelectedPdfItem] = useState<RecommendationItem | null>(null);
  const [recommendationsList, setRecommendationsList] = useState<RecommendationItem[]>(RECOMMENDATIONS);
  const [stylistSummary, setStylistSummary] = useState<string>("");

  const handleSelectPreviousConsultation = (cons: any) => {
    const recs = cons.recommendations || [];
    if (recs.length === 0) {
      addToast("No recommendations recorded for this consultation.", "warning");
      return;
    }

    const initialAdded: Record<string, boolean> = {};
    const mapped: RecommendationItem[] = recs.map((rec: any, idx: number) => {
      const recId = rec.fabric_id || `prev-rec-${idx}`;
      if (rec.added_by_user) {
        initialAdded[recId] = true;
      }
      return {
        id: recId,
        dbId: rec.id,
        name: rec.title || `Bespoke Outfit ${idx + 1}`,
        isAiRecommended: !!rec.is_ai_recommended,
        added_by_user: !!rec.added_by_user,
        image: rec.generated_image_url || RECOMMENDATIONS[idx % 3].image,
        badge: rec.is_ai_recommended ? "⭐ AI Recommended Pick" : undefined,
        details: {
          suitColor: rec.title || "Custom Suit",
          fabric: rec.fabric_code || rec.title || "Luxury Fabric",
          fit: rec.suit_style || "Tailored Fit",
          lapelStyle: "Peak Satin Lapel",
          pieces: "3-Piece Tuxedo",
          shirt: "Ivory Silk Shirt",
          tie: "Silk Tie",
          color: rec.color || rec.title || "Bespoke Fabric Color",
          accessories: "Pocket Square",
          estimatedPrice: rec.estimated_price ? `₹${Number(rec.estimated_price).toLocaleString("en-IN")}` : "₹38,000",
          deliveryTime: `${rec.estimated_delivery_days || 7} Days Standard Delivery`,
        },
        whyThisWorks: rec.why_recommended || rec.description || "Tailored for skin undertone and occasion structure.",
        whyAiSelectedThis: rec.why_recommended || rec.description
      };
    });

    setRecommendationsList(mapped);
    setAddedToAccount(initialAdded);
    if (cons.additional_notes) {
      setStylistSummary(`Customer Consultation for ${cons.occasion || "Special Event"}. Notes: ${cons.additional_notes}`);
    } else {
      setStylistSummary(`Previous Consultation Result saved on ${cons.created_at ? new Date(cons.created_at).toLocaleDateString() : "Database Record"}.`);
    }
    setStep(5);
    addToast("Loaded style recommendations into output screen!", "info");
  };

  const handleAddToAccount = async (rec: RecommendationItem) => {
    const isCurrentlyAdded = !!addedToAccount[rec.id];
    const newStatus = !isCurrentlyAdded;

    setAddedToAccount((prev) => ({ ...prev, [rec.id]: newStatus }));

    if (newStatus) {
      addToast(`Added "${rec.name}" to customer account database!`, "success");
    } else {
      addToast(`Removed "${rec.name}" from customer account database.`, "info");
    }

    if (rec.dbId) {
      try {
        await styleConsultationApi.updateRecommendation(rec.dbId, { added_by_user: newStatus });
      } catch (err) {
        console.warn("Could not update added_by_user in backend database:", err);
      }
    }
  };

  // Handle Loading & Call FastAPI Gemini Style Generator on Step 4
  useEffect(() => {
    if (step === 4) {
      setLoadingIndex(0);
      setLoadingProgress(0);

      const interval = setInterval(() => {
        setLoadingIndex((prev) => {
          if (prev < LOADING_TEXTS.length - 1) return prev + 1;
          return prev;
        });
      }, 900);

      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            return 90; // Hold at 90% until API completes
          }
          return prev + 15;
        });
      }, 500);

      const fetchStyleRecommendations = async () => {
        let finalRecommendations = RECOMMENDATIONS;

        try {
          console.log("[AI STYLE FRONTEND] Initiating API call to /generate-style/...");
          console.log("  • Occasion:", formData.occasion, "| Venue:", formData.venue, "| Role:", formData.customerRole);
          console.log("  • Photo payload sizes -> skinTone:", capturedPhotos.skinTone?.length || 0, "chars | front:", capturedPhotos.front?.length || 0, "chars | side:", capturedPhotos.side?.length || 0, "chars");

          const { data } = await api.post(
            "/generate-style/",
            {
              occasion: formData.occasion,
              customer_role: formData.customerRole,
              event_time: formData.eventTime,
              venue: formData.venue,
              season: formData.season,

              style_preference: (formData as any).stylePreference || "Luxury",
              desired_impression: formData.desiredImpression,
              style_inspiration: formData.styleInspiration || "",

              lapel_preference: formData.lapelStyle || "Let AI Decide",
              suit_style: formData.suitStyle || "Single Breasted",
              fit_preference: (formData as any).fitPreference || "Tailored Fit",
              waistcoat: formData.waistcoatStyle || "Let AI Decide",

              favorite_color: formData.favoriteColor,
              colors_to_avoid: formData.colorsToAvoid,
              bride_partner_color: formData.partnerColor,

              budget: formData.budget,

              additional_notes: formData.additionalNotes,

              skin_tone_image: capturedPhotos.skinTone || "",
              front_close_up: capturedPhotos.front || "",
              torso_image: capturedPhotos.side || ""
            },
            {
              timeout: 120000 // Extended timeout to 120 seconds
            }
          );

          console.log("[AI STYLE FRONTEND SUCCESS] API Response received:", data);

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.recommendations && data.recommendations.length > 0) {
            finalRecommendations = data.recommendations.map((rec: any, idx: number) => ({
              id: rec.fabric_id || `rec-${idx}`,
              name: rec.title || `Custom Bespoke Outfit ${idx + 1}`,
              isAiRecommended: rec.is_ai_recommended,
              image: rec.generated_image_url || RECOMMENDATIONS[idx % 3].image,
              badge: rec.is_ai_recommended ? "⭐ AI Recommended Pick" : undefined,
              details: {
                suitColor: rec.title,
                fabric: rec.title,
                fit: rec.suit_style || "Tailored Fit",
                lapelStyle: rec.lapel_style || "Peak Satin Lapel",
                pieces: rec.pieces || "3-Piece Tuxedo",
                shirt: rec.shirt || "Ivory Silk Shirt",
                tie: rec.tie || "Silk Tie",
                color: rec.color || rec.title || "Bespoke Fabric Color",
                accessories: rec.accessories || "Pocket Square",
                estimatedPrice: `₹${Number(rec.estimated_price || 38000).toLocaleString("en-IN")}`,
                deliveryTime: `${rec.estimated_delivery_days || 7} Days Standard Delivery`,
              },
              whyThisWorks: rec.why_recommended,
              whyAiSelectedThis: rec.why_recommended
            }));
            if (data.stylist_summary) {
              setStylistSummary(data.stylist_summary);
            }
          } else {
            throw new Error("No recommendations returned from AI Style Service.");
          }

          setRecommendationsList(finalRecommendations);

          // ALWAYS Persist Consultation & Recommendations to Database
          try {
            const custId = selectedCustomerId ? Number(selectedCustomerId) : null;
            const dbRes = await styleConsultationApi.create({
              customer: custId,
              status: "COMPLETED",
              height: (formData as any).height || "180 cm",
              occasion: formData.occasion,
              customer_role: formData.customerRole,
              event_time: formData.eventTime,
              venue: formData.venue,
              style_preference: formData.desiredImpression || "Modern",
              favorite_color: formData.favoriteColor,
              colors_to_avoid: Array.isArray(formData.colorsToAvoid) ? formData.colorsToAvoid.join(", ") : (formData.colorsToAvoid || ""),
              bride_partner_color: formData.partnerColor,
              budget_tier: formData.budget,
              additional_notes: formData.additionalNotes,
              front_photo_url: capturedPhotos.front || "",
              back_photo_url: capturedPhotos.side || "",
              skin_tone_photo_url: capturedPhotos.skinTone || "",
              model_name: "gemini-1.5-pro",
              recommendations: finalRecommendations.map((r, i) => ({
                recommendation_rank: i + 1,
                title: r.name,
                description: r.whyThisWorks,
                suit_style: r.details.fit,
                estimated_price: parseFloat(r.details.estimatedPrice.replace(/[^0-9.]/g, "")) || 38000,
                estimated_delivery_days: 7,
                generated_image_url: r.image,
                why_recommended: r.whyThisWorks,
                is_ai_recommended: !!r.isAiRecommended
              }))
            });

            if (dbRes.data && dbRes.data.recommendations) {
              const updatedMapped = finalRecommendations.map((mItem, idx) => ({
                ...mItem,
                dbId: dbRes.data.recommendations[idx]?.id || mItem.id
              }));
              setRecommendationsList(updatedMapped);
            }
            addToast("AI Style Consultation saved to database!", "success");
          } catch (dbErr) {
            console.error("Error saving consultation to database:", dbErr);
          }

          setLoadingProgress(100);
          clearInterval(progressInterval);
          clearInterval(interval);
          setTimeout(() => setStep(5), 400);

        } catch (err: any) {
          const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "AI Style Consultation Service Error";
          console.error("[AI STYLE FRONTEND ERROR] Failed to fetch style recommendations:", err);
          if (err?.response) {
            console.error("  • HTTP Status:", err.response.status);
            console.error("  • Response Data:", err.response.data);
            console.error("  • Request URL:", err.config?.url);
          }
          clearInterval(progressInterval);
          clearInterval(interval);
          setLoadingProgress(0);
          setConsultationError(errMsg);
          addToast(`AI Style Error: ${errMsg}`, "error");
        }
      };

      fetchStyleRecommendations();

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [step, formData]);

  // Form Input Change Handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSaveRecommendation = (id: string, name: string) => {
    setSavedItems((prev) => {
      const isSaved = !prev[id];
      if (isSaved) {
        addToast(`Saved "${name}" to your profile recommendations!`, "success");
      } else {
        addToast(`Removed "${name}" from saved list.`, "info");
      }
      return { ...prev, [id]: isSaved };
    });
  };

  const handleDownloadImage = async (imageUrl: string, imageName: string) => {
    if (!imageUrl) return;
    try {
      addToast(`Downloading image for ${imageName}...`, "info");
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const fileExt = blob.type.includes("png") ? "png" : "jpg";
      const cleanName = imageName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      link.download = `${cleanName}_nammafit_style.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      addToast(`Image downloaded successfully!`, "success");
    } catch (err) {
      console.warn("Direct blob download failed, opening image in new window:", err);
      window.open(imageUrl, "_blank");
      addToast("Opened image in a new tab for saving.", "info");
    }
  };

  // 1. Initial 10-Second Loading Screen ALONE
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#070F0E] text-white flex flex-col items-center justify-center p-4 text-center select-none">
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
              strokeDashoffset={251.32 - (251.32 * initialProgress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white font-mono">{initialProgress}%</span>
            <span className="text-[9px] font-bold text-[#B0E4CC] uppercase tracking-wider">LOADING</span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-2 mt-6">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#285A48] via-[#B0E4CC] to-emerald-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(176,228,204,0.6)]"
              style={{ width: `${initialProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
            <span>AI Style Sync: {initialProgress}%</span>
            <span>5s</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Content View
  return (
    <div className="page-container py-6 sm:py-8 space-y-6 sm:space-y-8 select-none">
      {/* --- Header & Progress Indicator -------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#B0E4CC] font-bold">
            <Sparkles size={14} className="animate-pulse" />
            NammaFit AI Style Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            AI Style Consultation
          </h1>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/[0.03] border border-white/8 p-2 rounded-2xl">
          {[
            { num: 2, displayNum: 1, label: "Capture Photos" },
            { num: 3, displayNum: 2, label: "Customer Details" },
            { num: 4, displayNum: 3, label: "AI Processing" },
            { num: 5, displayNum: 4, label: "Recommendations" },
          ].map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-1.5">
                <div
                  onClick={() => isCompleted && setStep(s.num)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted ? "cursor-pointer" : "cursor-default"
                  } ${
                    isActive
                      ? "bg-gradient-to-br from-[#285A48] to-[#408a71] text-white border border-[#B0E4CC]/40 shadow-md shadow-[#B0E4CC]/10"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-slate-500 border border-white/5"
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : s.displayNum}
                </div>
                <span
                  className={`text-[10px] font-semibold hidden lg:inline ${
                    isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 5 && <div className="h-px w-2 sm:w-3 bg-white/10 hidden sm:block" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* -- CUSTOMER SELECTION BAR -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-[#B0E4CC]" />
            SELECT REGISTERED CUSTOMER:
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold text-white">Loaded Profile: {selectedCustomer.name}</span>
              <span className="text-slate-400 text-[11px] sm:border-l sm:border-white/10 sm:pl-2">
                Height: {selectedCustomer.height || 178} cm | Weight: {selectedCustomer.weight || 74} kg
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- STEP 2: CAPTURE PHOTOS & PREVIOUS RECOMMENDATIONS --- */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#285A48]/40 via-[#347660]/30 to-[#285A48]/40 border border-[#B0E4CC]/30 text-[#B0E4CC] text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-[#285A48]/20">
              <Camera size={14} className="animate-pulse text-[#B0E4CC]" />
              <span>Step 2 • Capture Photos (Front, Side & Skin Tone)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Capture front, side, and skin tone images. AI will process body silhouette dimensions and analyze skin tone undertone harmony for custom outfit matching.
            </p>
          </div>

              {/* 2-Column Grid: Left (Previous Recommendations) | Right (Inner Scan Card) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Previous AI Recommendations */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between bg-[#0B1714] border border-[#B0E4CC]/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-[#B0E4CC]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Previous AI Recommendations
                      </h3>
                    </div>
                    {selectedCustomer && (
                      <span className="text-[11px] font-semibold text-[#B0E4CC] bg-[#285A48]/30 px-2.5 py-1 rounded-full border border-[#B0E4CC]/20">
                        {selectedCustomer.name}
                      </span>
                    )}
                  </div>

                  {loadingPrevConsultations ? (
                    <div className="p-8 border border-white/5 bg-[#08120F] rounded-2xl text-center space-y-3">
                      <Sparkles size={24} className="text-[#B0E4CC] animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Loading previous style recommendations…</p>
                    </div>
                  ) : previousConsultations.length === 0 ? (
                    <div className="p-8 border border-white/5 bg-[#08120F] rounded-2xl text-center space-y-3">
                      <Shirt size={28} className="text-slate-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-300">No Previous Consultations</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        No saved recommendations found for {selectedCustomer?.name || "this customer"}. Run a new consultation to save recommendations to their account!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {previousConsultations.map((cons: any, idx: number) => {
                        const recs = cons.recommendations || [];
                        const dateStr = cons.created_at ? new Date(cons.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Previous Session";
                        return (
                          <div
                            key={cons.id || idx}
                            onClick={() => handleSelectPreviousConsultation(cons)}
                            className="bg-[#091512] border border-white/10 hover:border-[#B0E4CC]/60 p-4 rounded-2xl space-y-3 cursor-pointer transition-all hover:bg-white/[0.03] group shadow-lg"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                              <span className="text-slate-400 font-mono">ST-{cons.consultation_number || idx + 1} • {dateStr}</span>
                              <span className="text-[#B0E4CC] font-semibold text-[11px] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                View Output <ArrowRight size={12} />
                              </span>
                            </div>

                            {recs.length > 0 ? (
                              <div className="space-y-3">
                                {recs.map((rec: any, rIdx: number) => (
                                  <div key={rec.id || rIdx} className="flex gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5 items-center">
                                    {rec.generated_image_url ? (
                                      <img src={rec.generated_image_url} alt={rec.title} className="w-14 h-18 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                                    ) : (
                                      <div className="w-14 h-18 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 flex-shrink-0">
                                        <Shirt size={20} />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-bold text-white truncate">{rec.title || `Outfit ${rIdx + 1}`}</h5>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                           {rec.generated_image_url && (
                                             <button
                                               type="button"
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleDownloadImage(rec.generated_image_url, rec.title || "outfit");
                                               }}
                                               className="p-1 rounded-md bg-white/10 hover:bg-[#B0E4CC]/20 text-slate-300 hover:text-[#B0E4CC] transition cursor-pointer"
                                               title="Download Image"
                                             >
                                               <Download size={13} />
                                             </button>
                                           )}
                                           {rec.added_by_user && (
                                             <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                               ADDED
                                             </span>
                                           )}
                                         </div>
                                      </div>
                                      <p className="text-[11px] text-[#B0E4CC] font-semibold">{rec.suit_style || "Bespoke Suit"}</p>
                                      {rec.estimated_price && (
                                        <p className="text-[10px] text-slate-400">₹{Number(rec.estimated_price).toLocaleString("en-IN")}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Consultation recorded for {cons.occasion || "Formal"}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Inner Scan Card (Directly rendered without outer box wrapper!) */}
                <div className="lg:col-span-7">
                  <BodyScan
                    includeSkinTone={true}
                    onComplete={(data) => {
                      setTimeout(() => {
                        if (data) {
                          setCapturedPhotos({
                            front: data.frontImage || "",
                            side: data.sideImage || "",
                            skinTone: data.skinToneImage || ""
                          });
                        }
                        setPhotosCaptured(true);
                        addToast("Front, Side & Skin Tone photos captured!", "success");
                        setFormSubStep(1);
                        setStep(3);
                      }, 0);
                    }}
                    onCancel={() => setStep(2)}
                    mode="recommend"
                  />
                </div>

              </div>
            </div>
          )}
      {step === 3 && (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B0E4CC]/10 text-[#B0E4CC] text-xs font-bold uppercase tracking-wider">
              <FileText size={14} />
              Step 3 • Customer Style Questionnaire
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Specify Event, Design & Preferences</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              3 streamlined tabs to configure your occasion, colors, jacket design, and budget.
            </p>
          </div>

          {/* 3 Streamlined Navigation Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-white/10 pb-4">
            {[
              { id: 1, title: "1. Event & Impression", sub: "Occasion, Role, Venue & Impression", icon: Calendar },
              { id: 2, title: "2. Colors & Design", sub: "Palette, Lapel & Suit Cuts", icon: Palette },
              { id: 3, title: "3. Budget & Accessories", sub: "Tier, Accessories & Notes", icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = formSubStep === tab.id;
              const isDone = formSubStep > tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormSubStep(tab.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#285A48] text-white border-[#B0E4CC] shadow-xl shadow-[#B0E4CC]/15"
                      : isDone
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? "bg-[#B0E4CC] text-slate-950 font-bold" : "bg-white/10 text-slate-300"
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>{tab.title}</span>
                      {isDone && <CheckCircle2 size={13} className="text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate mt-0.5">{tab.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-8">
            {/* -- TAB 1: EVENT & IMPRESSION ------------------------------------ */}
            {formSubStep === 1 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#285A48]/30 border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Event Details & Desired Impression</h3>
                    <p className="text-xs text-slate-400">Tell us about your event, role, venue, and how you want to be seen</p>
                  </div>
                </div>

                {/* Customer Profile Select / Locked Banner */}
                {selectedCustomer ? (
                  <div className="bg-[#091512] border border-[#B0E4CC]/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#285A48]/40 border border-[#B0E4CC]/30 flex items-center justify-center text-[#B0E4CC] flex-shrink-0">
                        <Lock size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold text-[#B0E4CC] uppercase tracking-wider">🔒 Active Linked Customer Profile (Frozen)</div>
                        <div className="text-xs font-bold text-white">{selectedCustomer.name} (ID #{selectedCustomer.id} • {selectedCustomer.phone || "No Phone"})</div>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <ShieldCheck size={16} />
                      <span>Customer Profile Frozen for Session</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="w-9 h-9 rounded-xl bg-[#285A48]/30 border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC] flex-shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="w-full md:w-80">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Select Registered Customer Profile
                        </label>
                        <CustomSelect
                          options={customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.phone || "No phone"})` }))}
                          value={selectedCustomerId}
                          onChange={handleCustomerChange}
                          placeholder="-- Choose registered customer --"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Occasion */}
                  <div>
                    <label className="label-text">Occasion (Required)</label>
                    <select
                      name="occasion"
                      value={formData.occasion}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["Wedding", "Reception", "Engagement", "Business", "Party", "Black Tie", "Cocktail", "Casual", "Other"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Your Role */}
                  <div>
                    <label className="label-text">Your Role (Required)</label>
                    <select
                      name="customerRole"
                      value={formData.customerRole}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["Groom", "Best Man", "Groom's Friend", "Wedding Guest", "Business Professional", "Host", "VIP Guest", "Other"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Event Time */}
                  <div>
                    <label className="label-text">Event Time (Required)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Morning", "Afternoon", "Evening", "Night"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, eventTime: t }))}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                            formData.eventTime === t
                              ? "bg-[#285A48] border-[#B0E4CC] text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Venue */}
                  <div>
                    <label className="label-text">Venue (Required)</label>
                    <select
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["Luxury Ballroom", "Hotel", "Banquet Hall", "Beach", "Outdoor Garden", "Destination Wedding", "Office", "Indoor", "Other"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Season */}
                  <div>
                    <label className="label-text">Season (Required)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Summer", "Winter", "Monsoon", "Spring", "All Season"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, season: s }))}
                          className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                            formData.season === s
                              ? "bg-[#285A48] border-[#B0E4CC] text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desired Impression */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Desired Impression (Required)</label>
                  <p className="text-xs text-slate-400">How do you want people to see you?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Elegant", "Royal", "Powerful", "Sophisticated", "Fashion Forward", "Classic Gentleman", "Understated"].map((imp) => {
                      const isSel = formData.desiredImpression === imp;
                      return (
                        <div
                          key={imp}
                          onClick={() => setFormData((prev) => ({ ...prev, desiredImpression: imp }))}
                          className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all text-xs font-bold ${
                            isSel
                              ? "bg-[#285A48] border-[#B0E4CC] text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          {imp}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Style Inspiration */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Style Inspiration (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {["James Bond", "David Beckham", "Shah Rukh Khan", "Ranveer Singh", "Tom Ford", "Old Money", "Italian Tailoring", "British Tailoring", "Let AI Decide"].map((insp) => {
                      const isSel = formData.styleInspiration === insp;
                      return (
                        <button
                          key={insp}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, styleInspiration: insp }))}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                            isSel
                              ? "bg-[#285A48] border-[#B0E4CC] text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          {insp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* -- TAB 2: COLORS & DESIGN --------------------------------------- */}
            {formSubStep === 2 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#285A48]/30 border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC]">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Color Preferences & Jacket Design</h3>
                    <p className="text-xs text-slate-400">Color swatches, lapel design, suit cuts, and contrast preference</p>
                  </div>
                </div>

                {/* Favorite Color */}
                <div className="space-y-3">
                  <label className="label-text">Favorite Color (Required)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { id: "Navy", hex: "#1B263B" },
                      { id: "Black", hex: "#111111" },
                      { id: "Charcoal", hex: "#333333" },
                      { id: "Grey", hex: "#6C757D" },
                      { id: "Brown", hex: "#4A3B32" },
                      { id: "Beige", hex: "#D4C3B3" },
                      { id: "White", hex: "#F8F9FA" },
                      { id: "Olive", hex: "#556B2F" },
                      { id: "Burgundy", hex: "#6B1D2F" },
                      { id: "Emerald", hex: "#1A5E44" },
                      { id: "Royal Blue", hex: "#254E70" },
                    ].map((c) => {
                      const isSel = formData.favoriteColor === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setFormData((prev) => ({ ...prev, favoriteColor: c.id }))}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSel
                              ? "bg-[#285A48]/40 border-[#B0E4CC] text-white shadow-md"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="text-xs font-bold truncate">{c.id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Colors to Avoid & Partner Outfit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colors to Avoid */}
                  <div className="space-y-3">
                    <label className="label-text">Colors to Avoid (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {["Mustard Yellow", "Orange", "Bright Red", "Neon Green", "Pink", "Purple", "Gold", "Silver"].map((avoid) => {
                        const isSel = formData.colorsToAvoid.includes(avoid);
                        return (
                          <button
                            key={avoid}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const exists = prev.colorsToAvoid.includes(avoid);
                                return {
                                  ...prev,
                                  colorsToAvoid: exists
                                    ? prev.colorsToAvoid.filter((x) => x !== avoid)
                                    : [...prev.colorsToAvoid, avoid],
                                };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                              isSel
                                ? "bg-red-950/80 border-red-500 text-red-300"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            {isSel ? `✕ ${avoid}` : avoid}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Partner Color */}
                  <div className="space-y-3">
                    <label className="label-text">Partner Outfit Color (Optional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: "Ivory Gold", hex: "#E6D7B8" },
                        { id: "Maroon", hex: "#58111A" },
                        { id: "Champagne", hex: "#F7E7CE" },
                        { id: "Wine", hex: "#4A121A" },
                        { id: "Pink", hex: "#E8A598" },
                      ].map((p) => {
                        const isSel = formData.partnerColor === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setFormData((prev) => ({ ...prev, partnerColor: p.id }))}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                              isSel
                                ? "bg-[#285A48] border-[#B0E4CC] text-white"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.hex }} />
                            <span className="text-[11px] font-bold truncate">{p.id}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Contrast Preference */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Contrast Preference (Required)</label>
                  <div className="grid grid-cols-3 gap-4">
                    {["Safe", "Balanced", "Bold"].map((ct) => {
                      const isSel = formData.contrastPreference === ct;
                      return (
                        <div
                          key={ct}
                          onClick={() => setFormData((prev) => ({ ...prev, contrastPreference: ct }))}
                          className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all ${
                            isSel
                              ? "bg-[#285A48]/40 border-[#B0E4CC] text-white font-bold"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-bold">{ct}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lapel Style Cards */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Lapel Style (Required)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: "Notch Lapel (Classic Business)", label: "Notch Lapel", sub: "Classic Business", desc: "Versatile V-cut notch ideal for corporate & everyday elegance." },
                      { id: "Peak Lapel (Luxury & Weddings)", label: "Peak Lapel", sub: "Luxury & Weddings", desc: "Upward pointed lapel accentuating broad shoulders & posture." },
                      { id: "Shawl Lapel (Tuxedo & Black Tie)", label: "Shawl Lapel", sub: "Tuxedo & Black Tie", desc: "Continuous smooth curved satin lapel for formal galas." },
                      { id: "Let AI Decide", label: "Let AI Decide", sub: "Smart Recommendation", desc: "AI selects optimal lapel based on your venue & occasion." },
                    ].map((lp) => {
                      const isSel = formData.lapelStyle === lp.id;
                      return (
                        <div
                          key={lp.id}
                          onClick={() => setFormData((prev) => ({ ...prev, lapelStyle: lp.id }))}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                            isSel
                              ? "bg-[#285A48]/30 border-[#B0E4CC] text-white shadow-lg"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{lp.label}</span>
                            <span className="text-[10px] text-[#B0E4CC] font-semibold">{lp.sub}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{lp.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suit Style, Waistcoat & Pocket Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-white/10">
                  {/* Suit Style */}
                  <div className="space-y-2">
                    <label className="label-text">Suit Style (Required)</label>
                    <select
                      name="suitStyle"
                      value={formData.suitStyle}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["Single Breasted", "Double Breasted", "Bandhgala", "Tuxedo", "Let AI Decide"].map((ss) => (
                        <option key={ss} value={ss}>{ss}</option>
                      ))}
                    </select>
                  </div>

                  {/* Waistcoat */}
                  <div className="space-y-2">
                    <label className="label-text">Waistcoat (Optional)</label>
                    <select
                      name="waistcoatStyle"
                      value={formData.waistcoatStyle}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["No Waistcoat", "2-Piece Suit", "3-Piece Suit", "Let AI Decide"].map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pocket Style */}
                  <div className="space-y-2">
                    <label className="label-text">Pocket Style (Optional)</label>
                    <select
                      name="pocketStyle"
                      value={formData.pocketStyle}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {["Flap Pocket", "Jetted Pocket", "Patch Pocket", "Let AI Decide"].map((pk) => (
                        <option key={pk} value={pk}>{pk}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* -- TAB 3: BUDGET, ACCESSORIES & NOTES --------------------------- */}
            {formSubStep === 3 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#285A48]/30 border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC]">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Budget, Accessories & Additional Notes</h3>
                    <p className="text-xs text-slate-400">Configure price tier, complimentary accessories, and tailor notes</p>
                  </div>
                </div>

                {/* Budget Tier */}
                <div className="space-y-3">
                  <label className="label-text">Budget Tier (Required)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                      { id: "Economy", label: "Economy", sub: "₹15,000 - ₹30,000 ($400 - $800)" },
                      { id: "Premium", label: "Premium", sub: "₹30,000 - ₹75,000 ($800 - $1,800)" },
                      { id: "Luxury", label: "Luxury", sub: "₹75,000+ ($1,800+)" },
                    ].map((b) => {
                      const isSel = formData.budget === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setFormData((prev) => ({ ...prev, budget: b.id }))}
                          className={`p-6 rounded-2xl border text-center cursor-pointer transition-all space-y-2 ${
                            isSel
                              ? "bg-[#285A48]/30 border-[#B0E4CC] text-white shadow-xl shadow-[#B0E4CC]/10"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <div className="text-base font-extrabold text-white">{b.label}</div>
                          <div className="text-xs text-[#B0E4CC] font-semibold">{b.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Accessories Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Accessories & Styling (Optional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {["Waistcoat", "Pocket Square", "Tie", "Bow Tie", "Lapel Pin", "Cufflinks", "Let AI Decide"].map((acc) => {
                      const isSel = formData.accessories.includes(acc);
                      return (
                        <div
                          key={acc}
                          onClick={() => {
                            setFormData((prev) => {
                              const exists = prev.accessories.includes(acc);
                              return {
                                ...prev,
                                accessories: exists
                                  ? prev.accessories.filter((a) => a !== acc)
                                  : [...prev.accessories, acc],
                              };
                            });
                          }}
                          className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSel
                              ? "bg-[#285A48] border-[#B0E4CC] text-white font-bold"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isSel ? "bg-[#B0E4CC] border-[#B0E4CC] text-slate-950" : "border-white/20"
                          }`}>
                            {isSel && <Check size={14} />}
                          </div>
                          <span className="text-xs font-bold">{acc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="label-text">Additional Notes (Optional)</label>
                  <textarea
                    name="additionalNotes"
                    rows={4}
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Example: I prefer a timeless look. Avoid flashy designs. Comfort is important."
                    className="input-field"
                  />

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 block">Quick Tag Suggestions:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "I prefer a timeless look.",
                        "Avoid flashy designs.",
                        "Comfort is important.",
                        "Lightweight breathable fabric.",
                        "Bold lapel accent."
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              additionalNotes: prev.additionalNotes ? `${prev.additionalNotes} ${tag}` : tag,
                            }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-[11px] text-slate-300 cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => {
                  if (formSubStep > 1) {
                    setFormSubStep((prev) => prev - 1);
                  } else {
                    setStep(2);
                  }
                }}
                className="px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{formSubStep > 1 ? "Previous Section" : "Back to Photo Capture"}</span>
              </button>

              {formSubStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setFormSubStep((prev) => prev + 1)}
                  className="px-8 py-3.5 rounded-2xl bg-[#285A48] border border-[#B0E4CC]/40 hover:border-[#B0E4CC] text-white font-bold text-xs tracking-wide shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Next Section ({formSubStep === 1 ? "Colors & Design" : "Budget & Accessories"})</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#285A48] via-[#347660] to-[#1d4335] border border-[#B0E4CC]/40 hover:border-[#B0E4CC]/80 text-white font-bold text-sm tracking-wide shadow-xl shadow-[#285A48]/30 hover:shadow-[#B0E4CC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 cursor-pointer"
                >
                  <Sparkles size={18} className="text-[#B0E4CC] animate-pulse" />
                  <span>Generate AI Recommendations</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 4: AI PROCESSING OR ERROR STATE ----------------------------- */}
      {step === 4 && (
        <div className="min-h-[480px] flex flex-col items-center justify-center py-12 text-center space-y-6 animate-fade-in max-w-xl mx-auto">
          {consultationError ? (
            <div className="w-full glass-card rounded-3xl p-8 border border-red-500/40 bg-red-950/20 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">AI Consultation Generator Error</h3>
                <p className="text-xs text-red-300 font-mono bg-red-950/60 p-4 rounded-2xl border border-red-500/20 leading-relaxed text-left break-words">
                  {consultationError}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    setConsultationError(null);
                    setStep(3);
                  }}
                  className="flex-1 py-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span>Modify Form Inputs</span>
                </button>

                <button
                  onClick={() => {
                    setConsultationError(null);
                    setStep(4);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Retry AI Generator</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Animated AI Icon Container */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#285A48] via-[#408a71] to-[#142e25] border-2 border-[#B0E4CC] flex items-center justify-center text-[#B0E4CC] shadow-[0_0_60px_rgba(176,228,204,0.4)] animate-pulse">
                  <Sparkles size={48} className="animate-spin text-[#B0E4CC]" style={{ animationDuration: "6s" }} />
                </div>

                {/* Outer Spinning Orbit Ring */}
                <div
                  className="absolute -inset-4 rounded-full border border-dashed border-[#B0E4CC]/40 animate-spin pointer-events-none"
                  style={{ animationDuration: "12s" }}
                />
              </div>

              {/* Cycling Status Text */}
              <div className="space-y-3 max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {LOADING_TEXTS[loadingIndex]}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluating posture photos, occasion ({formData.occasion}), venue ({formData.venue}), and color contrast specs.
                </p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-[#285A48] via-[#B0E4CC] to-[#285A48] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* --- STEP 5: AI STYLE RECOMMENDATIONS -------------------------------- */}
      {step === 5 && (
        <div className="space-y-10 animate-fade-in">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="px-5 py-3 rounded-2xl border border-white/10 hover:border-[#B0E4CC]/40 bg-white/[0.03] hover:bg-[#285A48]/20 text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer w-fit shadow-lg backdrop-blur-md active:scale-95"
          >
            <ArrowLeft size={16} className="text-[#B0E4CC]" />
            <span>Back to Photo Capture & History</span>
          </button>

          {/* Top Title Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest shadow-md">
                <Sparkles size={14} className="animate-pulse text-[#B0E4CC]" />
                <span>AI Bespoke Style Intelligence</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#B0E4CC] bg-clip-text text-transparent">
                AI Style Recommendations
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Bespoke luxury menswear designs tailored specifically for your body posture, event role, venue lighting, and skin tone undertones.
              </p>
            </div>

            {/* Input Summary Badges */}
            <div className="flex flex-wrap md:flex-col lg:flex-row gap-2.5 self-start md:self-center">
              <div className="text-xs bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl text-slate-300 backdrop-blur-md shadow-sm">
                Occasion: <strong className="text-white font-bold">{formData.occasion}</strong>
              </div>
              <div className="text-xs bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl text-slate-300 backdrop-blur-md shadow-sm">
                Role: <strong className="text-[#B0E4CC] font-bold">{formData.customerRole}</strong>
              </div>
              <div className="text-xs bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl text-slate-300 backdrop-blur-md shadow-sm">
                Impression: <strong className="text-white font-bold">{formData.desiredImpression}</strong>
              </div>
            </div>
          </div>

          {/* Master Stylist Verdict Box */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#B0E4CC]/30 bg-gradient-to-r from-[#091814] via-[#0d221c] to-[#081512] shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#285A48]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#285A48] to-[#1a3c30] border border-[#B0E4CC]/30 flex items-center justify-center text-[#B0E4CC] shadow-md">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Master Tailor Bespoke Verdict
                  </h3>
                  <p className="text-[11px] text-[#B0E4CC] font-semibold">
                    Personalized Undertone & Silhouette Match
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                <ShieldCheck size={14} className="text-[#B0E4CC]" />
                <span>3D Body Posture Verified</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "Based on customer skin undertone sampling, physique posture analysis, and ambient venue lighting for <strong className="text-white not-italic">{formData.occasion}</strong> at <strong className="text-white not-italic">{formData.venue}</strong>, these 3 tailored outfits offer high contrast, elegant shoulder drape, and regal aesthetic harmony."
            </p>
          </div>

          {/* 3 Recommendation Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {recommendationsList.map((rec) => {
              const isAiPick = rec.isAiRecommended;
              const isSaved = !!savedItems[rec.id];

              return (
                <div
                  key={rec.id}
                  className={`glass-card rounded-[2.5rem] overflow-hidden flex flex-col justify-between transition-all duration-500 hover:-translate-y-2.5 hover:shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative group ${
                    isAiPick
                      ? "border-2 border-[#B0E4CC] bg-gradient-to-b from-[#091713] via-[#0b1d18] to-[#091413] shadow-[0_0_60px_rgba(176,228,204,0.3)] lg:-translate-y-3 z-10"
                      : "border border-white/10 hover:border-white/20 bg-gradient-to-b from-white/[0.02] to-transparent"
                  }`}
                >
                  {/* Top Badge for AI Recommended */}
                  {isAiPick && (
                    <div className="absolute top-4 left-4 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-400/20 flex items-center gap-1.5 uppercase tracking-wider border border-amber-200/50">
                      <Star size={14} className="fill-slate-950 animate-pulse" />
                      <span>AI Recommended Pick</span>
                    </div>
                  )}

                  {/* Top Right Action Buttons (Download & Save) */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(rec.image, rec.name);
                      }}
                      className="p-3 rounded-2xl backdrop-blur-md bg-black/60 hover:bg-black/90 text-slate-300 hover:text-[#B0E4CC] border border-white/15 hover:border-[#B0E4CC]/50 transition-all duration-300 cursor-pointer shadow-lg active:scale-90"
                      title="Download Outfit Image"
                    >
                      <Download size={17} />
                    </button>

                    <button
                      onClick={() => toggleSaveRecommendation(rec.id, rec.name)}
                      className={`p-3 rounded-2xl backdrop-blur-md border transition-all duration-300 cursor-pointer shadow-lg active:scale-90 ${
                        isSaved
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30"
                          : "bg-black/60 text-slate-300 border-white/15 hover:bg-black/90 hover:text-white hover:border-white/30"
                      }`}
                      title={isSaved ? "Saved" : "Save Recommendation"}
                    >
                      <Bookmark size={17} className={isSaved ? "fill-white" : ""} />
                    </button>
                  </div>

                  {/* Card Content Container */}
                  <div className="space-y-6 p-7">
                    {/* Large Outfit Image */}
                    <div className="relative aspect-[9/15] min-h-[460px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rec.image}
                        alt={rec.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                      {/* Image Bottom Badges */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/15 shadow-md font-mono">
                          {rec.details.estimatedPrice}
                        </span>
                        <span className="text-[11px] font-bold text-slate-200 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-1.5 shadow-md">
                          <Clock size={13} className="text-[#B0E4CC]" />
                          {rec.details.deliveryTime}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Title */}
                    <div className="space-y-1">
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">{rec.name}</h3>
                      <p className="text-xs text-[#B0E4CC] font-bold tracking-wide">
                        {rec.details.suitColor}
                      </p>
                    </div>

                    {/* Highlighted "Why AI Selected This" Box for Top Pick */}
                    {isAiPick && rec.whyAiSelectedThis && (
                      <div className="bg-gradient-to-r from-[#285A48]/40 via-[#408a71]/30 to-[#285A48]/40 border border-[#B0E4CC]/40 p-4.5 rounded-2xl space-y-1.5 shadow-md backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#B0E4CC] uppercase tracking-wider">
                          <Sparkles size={14} className="animate-pulse" />
                          <span>AI Master Selection Verdict</span>
                        </div>
                        <p className="text-xs text-slate-100 leading-relaxed italic">
                          "{rec.whyAiSelectedThis}"
                        </p>
                      </div>
                    )}

                    {/* Outfit Specification Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Fabric</span>
                        <span className="text-slate-100 font-bold truncate block">{rec.details.fabric}</span>
                      </div>
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Silhouette</span>
                        <span className="text-slate-100 font-bold block">{rec.details.fit}</span>
                      </div>
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Lapel Style</span>
                        <span className="text-slate-100 font-bold block">{rec.details.lapelStyle}</span>
                      </div>
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Pieces</span>
                        <span className="text-slate-100 font-bold block">{rec.details.pieces}</span>
                      </div>
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all flex flex-col justify-center" title={rec.details.shirt}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Shirt</span>
                        <span className="text-slate-100 font-bold text-xs leading-snug line-clamp-2 break-words" title={rec.details.shirt}>
                          {rec.details.shirt}
                        </span>
                      </div>
                      <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 p-3 rounded-2xl transition-all flex flex-col justify-center" title={rec.details.color || rec.details.suitColor}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Color</span>
                        <span className="text-slate-100 font-bold text-xs leading-snug line-clamp-2 break-words" title={rec.details.color || rec.details.suitColor}>
                          {(() => {
                            const raw = rec.details.color || rec.details.suitColor || "Bespoke Color";
                            const hexMatch = raw.match(/#[0-9A-Fa-f]{6}/)?.[0];
                            if (raw.startsWith("Fabric") && hexMatch) {
                              const hexMap: Record<string, string> = {
                                "#0A0E32": "Obsidian Midnight Navy",
                                "#2B3B6F": "Royal Navy Blue",
                                "#101A4E": "Midnight Navy",
                                "#20252B": "Dark Charcoal Gray",
                                "#111617": "Obsidian Black",
                                "#393126": "Dark Brown",
                                "#42464C": "Graphite Gray",
                                "#6B5E3C": "Olive Green",
                                "#87806B": "Khaki Sand",
                                "#9C9BA3": "Medium Steel Gray",
                                "#FFFFFF": "Pure White",
                                "#F5F5F0": "Ivory White",
                                "#FAFAEC": "Off-White Linen",
                                "#285A48": "Forest Emerald",
                              };
                              const name = hexMap[hexMatch.toUpperCase()] || "Bespoke Color";
                              return `${name} (${hexMatch.toUpperCase()})`;
                            }
                            if (raw.includes("(") && !raw.includes("#")) {
                              return raw.split("(")[0].trim();
                            }
                            return raw;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Why Recommended Detailed Rationale */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 text-[#B0E4CC]">
                        <Sparkles size={13} className="text-[#B0E4CC]" />
                        <span>Stylist Rationale Breakdown</span>
                      </span>
                      <p className={`text-xs leading-relaxed p-4 rounded-2xl border ${
                        isAiPick
                          ? "text-slate-100 bg-[#285A48]/30 border-[#B0E4CC]/40 font-medium shadow-inner"
                          : "text-slate-300 bg-white/[0.02] border-white/8"
                      }`}>
                        {rec.whyThisWorks}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Action Buttons */}
                  <div className="p-7 pt-0 space-y-2.5">
                    <button
                      onClick={() => handleAddToAccount(rec)}
                      className={`w-full py-3.5 rounded-2xl border text-xs font-extrabold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                        addedToAccount[rec.id]
                          ? "bg-gradient-to-r from-[#285A48] to-[#1e4537] text-white border-[#B0E4CC] shadow-lg shadow-[#B0E4CC]/20"
                          : "bg-gradient-to-r from-[#285A48]/80 to-[#1e4537]/80 hover:from-[#285A48] hover:to-[#245242] text-white border-[#B0E4CC]/40 hover:border-[#B0E4CC]"
                      }`}
                    >
                      {addedToAccount[rec.id] ? (
                        <>
                          <CheckCircle2 size={16} className="text-[#B0E4CC]" />
                          <span>Added to Customer Account</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="text-[#B0E4CC]" />
                          <span>Add to Customer Account</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedPdfItem(rec)}
                      className="w-full py-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
                    >
                      <Download size={14} className="text-[#B0E4CC]" />
                      <span>View Lookbook Spec</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Action Bar */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">Next Steps for Your Custom Ensemble</h3>
              <p className="text-xs text-slate-400 mt-1">
                Save your selections, download lookbook PDF specs, or proceed to measurement verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Start New Consultation */}
              <button
                onClick={() => setStep(2)}
                className="flex-1 md:flex-initial px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Start New Consultation</span>
              </button>

              {/* Download PDF (UI Only) */}
              <button
                onClick={() => setSelectedPdfItem(RECOMMENDATIONS[1])}
                className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} className="text-[#B0E4CC]" />
                <span>Download PDF</span>
              </button>

              {/* Continue to Measurement */}
              <button
                onClick={() => {
                  addToast("Navigating to Measurement Verification...", "info");
                  router.push("/digital-ledger");
                }}
                className="flex-1 md:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-[#285A48] via-[#347660] to-[#1d4335] border border-[#B0E4CC]/30 hover:border-[#B0E4CC]/60 text-xs font-bold text-white transition-all shadow-lg shadow-[#285A48]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Measurement</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PDF MODAL -------------------------------------------------------- */}
      <DownloadPdfModal
        isOpen={!!selectedPdfItem}
        onClose={() => setSelectedPdfItem(null)}
        recommendation={selectedPdfItem}
        customerData={formData}
      />
    </div>
  );
}
