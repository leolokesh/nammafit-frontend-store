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
  Search,
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

function ImageCarousel({
  images,
  onZoom,
}: {
  images: { image_url: string }[];
  onZoom?: (url: string) => void;
}) {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-56 bg-slate-900/50 rounded-none flex flex-col items-center justify-center text-slate-600 border-b border-white/5">
        <Shirt size={32} />
        <span className="text-xs mt-2">No images available</span>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  };

  const handleZoomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onZoom) {
      onZoom(images[idx].image_url);
    }
  };

  return (
    <div className="relative h-56 rounded-none overflow-hidden bg-slate-950/50 group border-b border-white/5">
      {/* Blurred background layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx].image_url}
          alt="Blur Background"
          className="w-full h-full object-cover blur-md opacity-30 scale-110"
        />
      </div>

      {/* Dark gradient mask bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none" />

      {/* Foreground image */}
      <div className="relative w-full h-full flex items-center justify-center z-10 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx].image_url}
          alt="Product View"
          className="max-w-full max-h-full object-contain transition-all duration-500"
        />
      </div>

      {/* Zoom Button inside Carousel */}
      {onZoom && (
        <button
          onClick={handleZoomClick}
          className="absolute top-3 right-3 z-30 p-2 rounded-none bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
          title="Zoom Image"
        >
          <Eye size={14} />
        </button>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-none bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 shadow-md cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-none bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 shadow-md cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1 px-2 py-1 rounded-none bg-slate-950/60 backdrop-blur-md border border-white/5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`w-1.5 h-1.5 rounded-none transition-all ${
                  i === idx ? "bg-[#B0E4CC] w-3" : "bg-slate-500 hover:bg-slate-400"
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

  // Product detail modal states
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const handleProductClick = (product: Product) => {
    if (!product.size_chart) {
      addToast("This product does not have a sizing template mapped yet.", "warning");
      return;
    }

    setSelectedProduct(product);
    setRecoModalOpen(true);
  };

  const handleWhatsAppEnquiry = (product: Product) => {
    const messageLines = [
      "*📦 NEW PRODUCT ENQUIRY*",
      "",
      `*🛒 Product Details:*`,
      `• Name: ${product.name}`,
      `• Fabric: ${product.fabric_name || "Premium Fabric"}`,
      `• Category: ${categoryLabel[product.wear_category]}`,
    ];

    if (product.price !== undefined && product.price !== null) {
      messageLines.push(`• Price: ₹${product.price}`);
    }

    if (product.images && product.images.length > 0) {
      messageLines.push("", `• Link: ${product.images[0].image_url}`);
    }

    const messageText = messageLines.join("\n");
    const cleanPhone = (profile?.phone_number || "").replace(/\D/g, "");
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, "_blank");
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
    const matchesCat = filterCat === "ALL" || p.wear_category === filterCat;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.fabric_name && p.fabric_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
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

              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                {/* Category filters */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1.5 md:pb-0">
                  {(["ALL", ...WEAR_CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        filterCat === cat
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
                          : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5"
                      }`}
                    >
                      {cat === "ALL" ? "All Items" : categoryLabel[cat]}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-64">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="w-full pl-9 pr-8 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    placeholder="Search name, fabric, details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
                      className="glass-card-hover rounded-none overflow-hidden flex flex-col h-full justify-between border border-white/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#B0E4CC]/5 hover:border-[#B0E4CC]/30"
                    >
                      <div className="flex flex-col h-full">
                        {/* Image Carousel */}
                        <div className="relative group flex-shrink-0">
                          <ImageCarousel
                            images={product.images}
                            onZoom={(url) => setLightboxSrc(url)}
                          />
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Category & Fabric badges aligned at the top */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <Badge
                                label={categoryLabel[product.wear_category]}
                                variant={categoryVariant[product.wear_category]}
                              />
                              <div className="flex items-center gap-1 bg-[#B0E4CC]/5 border border-[#B0E4CC]/10 text-slate-400 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                                <Tag size={10} className="text-[#B0E4CC]" />
                                <span>{product.fabric_name || "Premium Fabric"}</span>
                              </div>
                            </div>

                            {/* Product Name (Bold & Large) */}
                            <h3 className="text-sm font-bold text-slate-100 leading-snug">
                              {product.name}
                            </h3>

                            {/* Pricing Block (Large and prominent) */}
                            {product.price !== undefined && product.price !== null && (
                              <div className="flex items-baseline gap-2 pt-1">
                                <span className="text-base font-extrabold text-[#B0E4CC]">
                                  ₹{product.price}
                                </span>
                                {product.mrp && product.mrp > product.price && (
                                  <>
                                    <span className="text-xs text-slate-500 line-through">
                                      ₹{product.mrp}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-white/5 mt-4 space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductForDetail(product);
                                  setDetailModalOpen(true);
                                }}
                                className="flex-1 inline-flex items-center justify-center px-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900/40 border border-white/10 hover:bg-slate-900/80 hover:border-[#B0E4CC]/30 active:scale-[0.98] transition-all cursor-pointer"
                              >
                                More Details
                              </button>
                              <button
                                onClick={() => handleProductClick(product)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#32715b] hover:to-[#285A48] hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <Sparkles size={11} className="text-[#B0E4CC] animate-pulse" />
                                <span>Find My Size</span>
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsAppEnquiry(product);
                              }}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <svg
                                className="w-3.5 h-3.5 fill-current"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.706 1.458h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              <span>Order through WhatsApp</span>
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
            shopPhoneNumber={profile?.phone_number}
          />
        )}
      </Modal>

      {/* Public Product Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedProductForDetail(null);
        }}
        title="Product Details"
        size="md"
      >
        {selectedProductForDetail && (
          <div className="space-y-6 text-slate-200">
            {selectedProductForDetail.images && selectedProductForDetail.images.length > 0 && (
              <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-950/50 flex items-center justify-center p-2 border border-white/5 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProductForDetail.images[0].image_url}
                  alt={selectedProductForDetail.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedProductForDetail.name}</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider mb-1">Category</span>
                  <Badge
                    label={categoryLabel[selectedProductForDetail.wear_category]}
                    variant={categoryVariant[selectedProductForDetail.wear_category]}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider mb-1">Fabric</span>
                  <div className="flex items-center gap-1 bg-[#B0E4CC]/5 border border-[#B0E4CC]/10 text-slate-300 px-2 py-0.5 rounded-lg text-[11px] font-medium w-fit">
                    <Tag size={10} className="text-[#B0E4CC]" />
                    <span className="truncate max-w-[80px]">{selectedProductForDetail.fabric_name || "Premium Fabric"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider mb-1">Pricing</span>
                  {selectedProductForDetail.price !== undefined && selectedProductForDetail.price !== null ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#B0E4CC]">₹{selectedProductForDetail.price}</span>
                      {selectedProductForDetail.mrp && selectedProductForDetail.mrp > selectedProductForDetail.price && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 line-through">₹{selectedProductForDetail.mrp}</span>
                          <span className="text-[9px] font-extrabold text-emerald-400">
                            {Math.round(((selectedProductForDetail.mrp - selectedProductForDetail.price) / selectedProductForDetail.mrp) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-2">Description</span>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedProductForDetail.description || "No description available for this product."}
                </p>
                <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 items-stretch">
                  {selectedProductForDetail.size_chart && (
                    <button
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleProductClick(selectedProductForDetail);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#32715b] hover:to-[#285A48] hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Sparkles size={12} className="text-[#B0E4CC] animate-pulse" />
                      <span>Find My Size</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleWhatsAppEnquiry(selectedProductForDetail)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.706 1.458h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Order through WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Footer className="relative z-10 max-w-6xl mx-auto px-4 mt-12" />
    </div>
  );
}
