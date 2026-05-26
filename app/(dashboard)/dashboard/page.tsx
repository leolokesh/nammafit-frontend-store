"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { productApi, userApi } from "@/lib/api";
import { useToastContext } from "@/contexts/ToastContext";
import { formatRelativeTime } from "@/lib/utils";
import QRCode from "qrcode";
import { getNammaFitSVGString } from "@/components/ui/NammaFitLogo";
import type { jsPDF as JsPDFType } from "jspdf";
import {
  Mail,
  Building2,
  Globe,
  Phone,
  Hash,
  Loader2,
  Package,
  Layers,
  Copy,
  Check,
  Download,
  QrCode,
  Link2,
  CheckCircle2,
  Sparkles,
  Clock,
} from "lucide-react";

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  /** small muted text beneath the value */
  sub?: string;
  /** gradient class for the icon bg */
  gradient: string;
  /** icon color */
  iconColor: string;
  /** optional pill badge */
  badge?: { text: string; color: string };
  /** show a live pulsing dot */
  live?: boolean;
  /** loading skeleton */
  loading?: boolean;
  /** custom value text sizing */
  valueClassName?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  iconColor,
  badge,
  live,
  loading,
  valueClassName,
}: StatCardProps) {
  return (
    <div className="glass-card-hover rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
      {/* Subtle bg glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 ${gradient}`} />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
          <Icon size={22} className={iconColor} />
        </div>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        )}
        {live && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse mb-1" />
        ) : (
          <p className={`font-bold text-slate-100 leading-none ${valueClassName || "text-2xl"}`}>{value}</p>
        )}
        <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-slate-200 font-medium truncate">
          {value || <span className="text-slate-600 italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Renders an SVG string to a PNG data-URL via an off-screen canvas */
async function svgToPngDataUrl(svgString: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generates a branded PDF containing:
 *  • NammaFit logo (mark + wordmark)
 *  • QR code for the shareUrl
 *  • User's name / company / URL
 *  • Branded footer
 */
async function downloadQrPdf(
  shareUrl: string,
  username: string,
  companyName: string
) {
  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = (await import("jspdf")) as { jsPDF: new (...args: unknown[]) => JsPDFType };

  // ── 1. Generate assets ──────────────────────────────────────────────────────
  const [qrDataUrl, logoDataUrl] = await Promise.all([
    QRCode.toDataURL(shareUrl, {
      width: 500,
      margin: 1,
      color: { dark: "#1e1b4b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }),
    // Logo mark on white background for the PDF
    svgToPngDataUrl(getNammaFitSVGString("#ffffff"), 300),
  ]);

  // ── 2. Build PDF ────────────────────────────────────────────────────────────
  // Card-style format: 100mm × 130mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 130],
  }) as JsPDFType;

  const W = 100; // page width  mm
  const H = 130; // page height mm

  // Background — deep indigo-950
  pdf.setFillColor(2, 6, 23); // #020617 slate-950
  pdf.rect(0, 0, W, H, "F");

  // Top accent bar gradient approximation (solid indigo strip)
  pdf.setFillColor(99, 102, 241); // indigo-500
  pdf.rect(0, 0, W, 1.5, "F");

  // ── Logo mark (top-center) ──────────────────────────────────────────────────
  const markMm = 14; // 14 mm square
  pdf.addImage(logoDataUrl, "PNG", (W - markMm) / 2, 8, markMm, markMm);

  // ── Wordmark text ──────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  // "namma" in indigo
  pdf.setTextColor(129, 140, 248); // indigo-400
  pdf.text("namma", W / 2 - 8, 27, { align: "right" });
  // "fit" in violet/pink
  pdf.setTextColor(167, 139, 250); // violet-400
  pdf.text("fit", W / 2 - 7, 27, { align: "left" });

  // Sub-label
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text("Adaptive fit intelligence", W / 2, 31.5, { align: "center" });

  // Divider
  pdf.setDrawColor(30, 41, 59); // slate-800
  pdf.setLineWidth(0.3);
  pdf.line(10, 34, W - 10, 34);

  // ── QR Code ────────────────────────────────────────────────────────────────
  const qrMm = 58; // QR size in mm
  const qrX = (W - qrMm) / 2;
  const qrY = 37;

  // White rounded background for QR
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(qrX - 3, qrY - 3, qrMm + 6, qrMm + 6, 3, 3, "F");
  pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrMm, qrMm);

  // ── User info ──────────────────────────────────────────────────────────────
  const infoY = qrY + qrMm + 8;

  if (companyName) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(226, 232, 240); // slate-200
    pdf.text(companyName, W / 2, infoY, { align: "center" });
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(`@${username}`, W / 2, infoY + (companyName ? 4.5 : 0), {
    align: "center",
  });

  // URL
  const urlY = infoY + (companyName ? 9 : 5);
  pdf.setFontSize(5.5);
  pdf.setTextColor(99, 102, 241); // indigo-500
  const displayUrl =
    shareUrl.length > 40 ? shareUrl.slice(0, 38) + "…" : shareUrl;
  pdf.text(displayUrl, W / 2, urlY, { align: "center" });

  // ── Footer ─────────────────────────────────────────────────────────────────
  pdf.setDrawColor(30, 41, 59);
  pdf.line(10, H - 9, W - 10, H - 9);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5);
  pdf.setTextColor(51, 65, 85); // slate-700
  pdf.text(
    `Powered by NammaFit  ·  ${new Date().getFullYear()}`,
    W / 2,
    H - 5.5,
    { align: "center" }
  );

  // ── Save ───────────────────────────────────────────────────────────────────
  pdf.save(`nammafit-qr-${username}.pdf`);
}

// ─── QR Share Card ────────────────────────────────────────────────────────────
function QRShareCard({ shareUrl }: { shareUrl: string }) {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!shareUrl) return;
    setQrGenerating(true);
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#f1f5f9", light: "#0f172a" },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch(console.error)
      .finally(() => setQrGenerating(false));
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadQrPdf(
        shareUrl,
        user?.username ?? "user",
        user?.company_name ?? ""
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-5">
      {/* Header */}
      <div className="w-full flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
          <QrCode size={16} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Share Profile</p>
          <p className="text-xs text-slate-500">Scan or copy your link</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="relative">
        <div className="w-[168px] h-[168px] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center shadow-lg shadow-indigo-950/40">
          {qrGenerating ? (
            <Loader2 size={28} className="text-indigo-400 animate-spin" />
          ) : qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <QrCode size={40} className="text-slate-700" />
          )}
        </div>
        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-indigo-500 rounded-br-lg pointer-events-none" />
      </div>

      {/* URL + Actions */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
          <Link2 size={13} className="text-slate-500 flex-shrink-0" />
          <p className="text-xs text-slate-400 flex-1 truncate font-mono">{shareUrl}</p>
        </div>

        <div className="flex gap-2">
          {/* Copy URL */}
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
              copied
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20"
            }`}
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy URL</>}
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={!qrDataUrl || pdfLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pdfLoading ? (
              <><Loader2 size={13} className="animate-spin" /> Generating…</>
            ) : (
              <><Download size={13} /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToastContext();

  // ── Live product count ──────────────────────────────────────────────────────
  const [productCount, setProductCount] = useState<number | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  useEffect(() => {
    userApi
      .getMe()
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("nf_user", JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Failed to refresh user details:", err);
      });

    productApi
      .list()
      .then(({ data }) => setProductCount(data.length))
      .catch(() => setProductCount(null))
      .finally(() => setProductLoading(false));
  }, [setUser]);

  // ── Last activity timestamp ─────────────────────────────────────────────────
  const [lastActivity, setLastActivity] = useState("Never");
  useEffect(() => {
    const tick = () => {
      if (user && user.last_recommendation_at) {
        setLastActivity(formatRelativeTime(user.last_recommendation_at));
      } else {
        setLastActivity("Never");
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [user?.last_recommendation_at]);

  // Build the share URL pointing to the public catalog page on the frontend
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      setShareUrl(`${window.location.origin}/share/${user.id}/`);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="page-container py-8 space-y-8">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Welcome back, {user.username} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your profile and account settings
          </p>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {/* Products */}
        <StatCard
          icon={Package}
          label="Products"
          value={productLoading ? "—" : String(productCount ?? 0)}
          sub="In your catalog"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          iconColor="text-white"
          badge={{ text: "Catalog", color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" }}
          loading={productLoading}
        />

        {/* Account Status */}
        <StatCard
          icon={CheckCircle2}
          label="Account Status"
          value="Active"
          sub="Verified account"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          iconColor="text-white"
          live
        />

        {/* Recommendations */}
        <StatCard
          icon={Sparkles}
          label="Recommendations"
          value={user.recommendations_count != null ? user.recommendations_count.toLocaleString() : "0"}
          sub="till now"
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          iconColor="text-white"
          badge={{ text: "+12%", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" }}
        />

        {/* Last Activity */}
        <StatCard
          icon={Clock}
          label="Last Activity"
          value={lastActivity}
          sub="Current session"
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          iconColor="text-white"
          badge={{ text: "Now", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" }}
          valueClassName="text-lg sm:text-xl md:text-2xl"
        />
      </div>

      {/* ── Profile card ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Share Card (replaces the avatar card) */}
        <QRShareCard shareUrl={shareUrl} />

        {/* Info list */}
        <div className="md:col-span-2 glass-card rounded-2xl px-6 py-2">
          <InfoRow icon={Mail} label="Email Address" value={user.email} />
          <InfoRow icon={Building2} label="Company Name" value={user.company_name} />
          <InfoRow icon={Globe} label="Website" value={user.website} />
          <InfoRow icon={Phone} label="Phone Number" value={user.phone_number} />
          <InfoRow icon={Hash} label="Store ID" value={user.store_id} />
          <InfoRow icon={Layers} label="User ID" value={String(user.id)} />
        </div>
      </div>

    </div>
  );
}
