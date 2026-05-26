"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { publicApi } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { DemoPanel } from "@/components/products/DemoPanel";
import { useToastContext } from "@/contexts/ToastContext";
import type { Product, User } from "@/types";
import Footer from "@/components/layout/Footer";
import {
  Building2,
  Globe,
  Phone,
  Mail,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shirt,
  Tag,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

// Wear categories definition matching the app config
type WearCategory = "TOPWEAR" | "BOTTOMWEAR" | "FULL_BODY";
const WEAR_CATEGORIES: WearCategory[] = ["TOPWEAR", "BOTTOMWEAR", "FULL_BODY"];

const categoryVariant: Record<WearCategory, "indigo" | "violet" | "emerald"> = {
  TOPWEAR: "indigo",
  BOTTOMWEAR: "violet",
  FULL_BODY: "emerald",
};

const categoryLabel: Record<WearCategory, string> = {
  TOPWEAR: "Topwear",
  BOTTOMWEAR: "Bottomwear",
  FULL_BODY: "Full Body",
};

function ImageCarousel({ images }: { images: { image_url: string }[] }) {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-48 bg-slate-900/50 rounded-t-2xl flex flex-col items-center justify-center text-slate-600 border-b border-white/5">
        <Shirt size={32} />
        <span className="text-xs mt-2">No images available</span>
      </div>
    );
  }

  return (
    <div className="relative h-48 rounded-t-2xl overflow-hidden bg-slate-900/50 group border-b border-white/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].image_url}
        alt="Product View"
        className="w-full h-full object-contain transition-all duration-500"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 border border-white/10 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity hover:bg-slate-950"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 border border-white/10 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity hover:bg-slate-950"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/40 backdrop-blur-sm">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${
                  i === idx ? "bg-indigo-400 w-2.5" : "bg-slate-500"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShareCatalogPage() {
  const params = useParams();
  const userId = Number(params.userId);

  const { addToast } = useToastContext();
  const [profile, setProfile] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [filterCat, setFilterCat] = useState<WearCategory | "ALL">("ALL");
  const [lightboxSrc, setLightboxSrc] = useState("");

  // Sizing recommendations states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recoModalOpen, setRecoModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    if (!product.size_chart) {
      addToast("This product does not have a sizing template mapped yet.", "warning");
      return;
    }

    setSelectedProduct(product);
    setRecoModalOpen(true);
  };

  useEffect(() => {
    if (!userId) return;

    const loadPublicCatalog = async () => {
      try {
        const [profRes, prodRes] = await Promise.all([
          publicApi.getUserProfile(userId),
          publicApi.getUserProducts(userId),
        ]);
        setProfile(profRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error(err);
        setErrorMsg("The shared catalog you are trying to view does not exist or has been disabled.");
      } finally {
        setLoading(false);
      }
    };

    loadPublicCatalog();
  }, [userId]);

  const filteredProducts = products.filter((p) => {
    return filterCat === "ALL" || p.wear_category === filterCat;
  });

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 space-y-10 relative z-10">
        
        {/* Loading state Skeletons */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            {/* Profile skeleton */}
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-4">
              <div className="h-6 bg-slate-800 rounded-lg w-1/4" />
              <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="h-10 bg-slate-800 rounded-xl" />
                <div className="h-10 bg-slate-800 rounded-xl" />
                <div className="h-10 bg-slate-800 rounded-xl" />
                <div className="h-10 bg-slate-800 rounded-xl" />
              </div>
            </div>

            {/* Products grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-80 overflow-hidden space-y-4">
                  <div className="h-48 bg-slate-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : errorMsg ? (
          /* Error State */
          <div className="glass-card rounded-3xl p-16 text-center max-w-lg mx-auto flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Package size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-200">Catalog Not Available</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{errorMsg}</p>
          </div>
        ) : (
          /* Main Content */
          <>
            {/* Merchant Header Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-indigo-950/50 flex-shrink-0">
                  {profile?.company_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || "M"}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-100">
                    {profile?.company_name || `${profile?.username}'s Catalog`}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      Powered By
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/nammafit-logo-white.png"
                      alt="NammaFit"
                      className="h-3.5 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              {/* Quick contact actions */}
              <div className="flex flex-wrap gap-3">
                {profile?.phone_number && (
                  <a
                    href={`tel:${profile.phone_number}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-slate-100 transition-all"
                  >
                    <Phone size={14} />
                    <span>Call Shop</span>
                  </a>
                )}
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-slate-100 transition-all"
                  >
                    <Mail size={14} />
                    <span>Send Email</span>
                  </a>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/25 border border-indigo-500/35 hover:bg-indigo-500/40 text-xs font-bold text-indigo-300 transition-all"
                  >
                    <Globe size={14} />
                    <span>Visit Website</span>
                    <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Catalog Grid Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-400" />
                  Product Catalog ({products.length})
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {(["ALL", ...WEAR_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      filterCat === cat
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                        : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5"
                    }`}
                  >
                    {cat === "ALL" ? "All Items" : categoryLabel[cat]}
                  </button>
                ))}
              </div>

              {/* Product Listing */}
              {filteredProducts.length === 0 ? (
                <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Package size={24} className="text-indigo-400" />
                  </div>
                  <h3 className="text-slate-200 font-semibold mb-1">No products found</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    This merchant hasn&apos;t published any items in this category yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full justify-between"
                    >
                      <div className="flex flex-col h-full">
                        {/* Image Carousel */}
                        <div className="relative group flex-shrink-0">
                          <ImageCarousel images={product.images} />
                          {product.images && product.images.length > 0 && (
                            <button
                              onClick={() => setLightboxSrc(product.images[0].image_url)}
                              className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-[10px] font-bold opacity-90 hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                            >
                              <Eye size={12} /> View Zoom
                            </button>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-100 leading-snug flex-1">
                                {product.name}
                              </h3>
                              <Badge
                                label={categoryLabel[product.wear_category]}
                                variant={categoryVariant[product.wear_category]}
                              />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Tag size={11} className="text-slate-600" />
                              <span>{product.fabric_name || "Premium Fabric"}</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/5 mt-4">
                            <button
                              onClick={() => handleProductClick(product)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 transition-all cursor-pointer"
                            >
                              <Sparkles size={12} />
                              <span>Find My Size</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Public Zoom Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxSrc("")}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            onClick={() => setLightboxSrc("")}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Preview"
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Public Sizing Recommendation Modal */}
      <Modal
        isOpen={recoModalOpen}
        onClose={() => {
          setRecoModalOpen(false);
          setSelectedProduct(null);
        }}
        title={`Find Your Size — ${selectedProduct?.name || ""}`}
        size="lg"
      >
        {selectedProduct && (
          <DemoPanel
            product={selectedProduct}
            resetSignal={selectedProduct.id}
          />
        )}
      </Modal>

      <Footer className="relative z-10 max-w-6xl mx-auto px-4 mt-12" />
    </div>
  );
}
