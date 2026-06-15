"use client";

import { useState, useEffect, FormEvent } from "react";
import { productApi, fabricApi, sizeChartApi, measurementApi } from "@/lib/api";
import { useToastContext } from "@/contexts/ToastContext";
import Modal from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import { MultiImageManager } from "@/components/ui/ImageUploader";
import Select from "@/components/ui/Select";
import type { Product, Fabric, WearCategory, SizeChart, Measurement } from "@/types";
import {
  Plus,
  Package,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

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
      <div className="h-56 bg-slate-900/50 rounded-t-3xl flex flex-col items-center justify-center text-slate-600 border-b border-white/5">
        <ImageIcon size={28} />
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
    <div className="relative h-56 rounded-t-3xl overflow-hidden bg-slate-950/50 group border-b border-white/5">
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
          alt="product"
          className="max-w-full max-h-full object-contain transition-all duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://placehold.co/300x200/1e293b/6366f1?text=Image+${idx + 1}`;
          }}
        />
      </div>

      {/* Zoom Button inside Carousel */}
      {onZoom && (
        <button
          onClick={handleZoomClick}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
          title="Zoom Image"
        >
          <Eye size={14} />
        </button>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 shadow-md cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 shadow-md cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1 px-2 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
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

function ProductCard({
  product,
  fabrics,
  onEdit,
  onDelete,
}: {
  product: Product;
  fabrics: Fabric[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const fabricName =
    fabrics.find((f) => f.id === product.fabric)?.name ?? "Unknown Fabric";
  const [lightboxSrc, setLightboxSrc] = useState("");

  return (
    <>
      <div className="glass-card-hover rounded-3xl overflow-hidden animate-slide-up flex flex-col h-full justify-between border border-white/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#B0E4CC]/5 hover:border-[#B0E4CC]/30">
        <div>
          {/* Carousel */}
          <div className="relative group">
            <ImageCarousel
              images={product.images}
              onZoom={(url) => setLightboxSrc(url)}
            />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100 leading-snug flex-1">
                {product.name}
              </h3>
              <Badge
                label={categoryLabel[product.wear_category]}
                variant={categoryVariant[product.wear_category]}
              />
            </div>
            <div className="flex items-center gap-1.5 bg-[#B0E4CC]/5 border border-[#B0E4CC]/10 text-slate-300/95 px-2.5 py-1 rounded-lg w-fit text-[11px] font-medium transition-all hover:bg-[#B0E4CC]/10 hover:border-[#B0E4CC]/20">
              <Tag size={11} className="text-[#B0E4CC]" />
              <span>{fabricName}</span>
              <span className="text-[#B0E4CC]/30">·</span>
              <span>{product.images.length} image{product.images.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Edit and Delete Actions Footer */}
        <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={() => onEdit(product)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-[#B0E4CC] transition-colors"
          >
            <Edit2 size={12} /> Edit Product
          </button>
          <button
            onClick={() => onDelete(product)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxSrc("")}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            onClick={() => setLightboxSrc("")}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt={product.name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  const { addToast } = useToastContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [filterCat, setFilterCat] = useState<WearCategory | "ALL">("ALL");
  const [filterFit, setFilterFit] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    wear_category: "TOPWEAR" as WearCategory,
    fabric: 0,
    sizeChartId: "",
    images: [{ image_url: "" }],
  });

  const chartHasMeasurements = (chartId: number) => {
    const chartMeas = measurements.filter((m) => m.size_chart === chartId);
    if (chartMeas.length === 0) return false;
    return chartMeas.some((m) => {
      const fields = [m.bust, m.shoulder, m.waist, m.hip, m.inseam, m.thighs];
      return fields.some((val) => val !== null && val !== undefined && val > 0);
    });
  };

  const loadData = async () => {
    try {
      const [prodRes, fabRes, chartRes, measRes] = await Promise.all([
        productApi.list(),
        fabricApi.list(),
        sizeChartApi.list(),
        measurementApi.list(),
      ]);
      setProducts(prodRes.data);
      setFabrics(fabRes.data);
      setSizeCharts(chartRes.data);
      setMeasurements(measRes.data);
      if (fabRes.data.length > 0 && form.fabric === 0) {
        setForm((f) => ({ ...f, fabric: fabRes.data[0].id }));
      }
    } catch {
      addToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setForm({
      name: "",
      wear_category: "TOPWEAR",
      fabric: fabrics[0]?.id ?? 0,
      sizeChartId: "",
      images: [{ image_url: "" }],
    });
  };

  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      wear_category: product.wear_category,
      fabric: product.fabric,
      sizeChartId: product.size_chart ? String(product.size_chart) : "",
      images: product.images.length > 0 ? product.images.map(img => ({ image_url: img.image_url })) : [{ image_url: "" }],
    });
    setModalOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This will delete all its images and measurement mappings.`)) {
      return;
    }
    try {
      await productApi.delete(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      addToast(`Product "${product.name}" deleted successfully.`, "success");
    } catch {
      addToast("Failed to delete product.", "error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      wear_category: form.wear_category,
      fabric: form.fabric,
      size_chart: form.sizeChartId ? Number(form.sizeChartId) : null,
      images: form.images.filter((img) => img.image_url.trim() !== ""),
    };
    if (!form.name.trim()) {
      addToast("Product Name is required.", "warning");
      return;
    }
    if (!form.fabric) {
      addToast("Please select a fabric.", "warning");
      return;
    }
    if (!form.sizeChartId) {
      addToast("Please select a sizing chart template.", "warning");
      return;
    }
    
    setSubmitting(true);
    try {
      if (editProduct) {
        // Edit flow
        const { data } = await productApi.update(editProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? data : p)));
        addToast(`Product "${data.name}" updated successfully!`, "success");
      } else {
        // Create flow
        const { data } = await productApi.create(payload);
        setProducts((prev) => [...prev, data]);
        addToast(`Product "${data.name}" created successfully!`, "success");
      }

      handleCloseModal();
    } catch {
      addToast(editProduct ? "Failed to update product." : "Failed to create product.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    // Category filter matches
    const matchesCat = filterCat === "ALL" || p.wear_category === filterCat;
    
    // Size Chart / Fit filter matches
    let matchesFit = true;
    if (filterFit) {
      const targetChartId = Number(filterFit);
      matchesFit = p.size_chart === targetChartId;
    }
    
    return matchesCat && matchesFit;
  });

  return (
    <div className="page-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Product Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} in your catalog
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
        {/* Category Tabs (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin-accent pb-2.5 w-full md:w-auto">
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
              {cat === "ALL" ? "All Categories" : categoryLabel[cat as WearCategory]}
            </button>
          ))}
        </div>

        {/* Size Chart / Fit Dropdown Filter (Responsive stack/row layout) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter by Size Chart:</label>
          <Select
            value={filterFit}
            onChange={setFilterFit}
            className="text-xs w-full sm:min-w-[180px] sm:max-w-[220px]"
            placeholder="All Sizing Charts"
            options={[
              { value: "", label: "All Sizing Charts" },
              ...sizeCharts.map((sc) => ({ value: String(sc.id), label: `${sc.name} (${sc.fit})` })),
            ]}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Package size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-slate-200 font-medium mb-2">No products found</h3>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            {filterCat !== "ALL" || filterFit
              ? "Try adjusting your category or sizing chart filters."
              : "Add your first product to get started."}
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 stagger-children">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              fabrics={fabrics}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Product Name</label>
            <input
              className="input-field"
              placeholder="e.g., Classic Polo Shirt"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Wear Category</label>
              <Select
                value={form.wear_category}
                onChange={(val) => setForm({ ...form, wear_category: val, sizeChartId: "" })}
                options={WEAR_CATEGORIES.map((c) => ({ value: c, label: categoryLabel[c] }))}
                required
              />
            </div>
            <div>
              <label className="label-text">Fabric</label>
              <Select
                value={form.fabric}
                onChange={(val) => setForm({ ...form, fabric: Number(val) })}
                options={fabrics.map((f) => ({ value: f.id, label: f.name }))}
                placeholder={fabrics.length === 0 ? "No fabrics available" : "Select a fabric..."}
                disabled={fabrics.length === 0}
                required
              />
            </div>
          </div>

          {/* Sizing Chart selection */}
          <div>
            <label className="label-text">Sizing Chart / Template</label>
            <Select
              value={form.sizeChartId}
              onChange={(val) => setForm({ ...form, sizeChartId: String(val) })}
              placeholder={
                sizeCharts.filter((sc) => sc.wear_category === form.wear_category && chartHasMeasurements(sc.id)).length === 0
                  ? "No sizing chart found"
                  : "Choose a sizing template..."
              }
              options={sizeCharts
                .filter((sc) => sc.wear_category === form.wear_category && chartHasMeasurements(sc.id))
                .map((sc) => ({ value: String(sc.id), label: `${sc.name} (${sc.fit})` }))
              }
              disabled={sizeCharts.filter((sc) => sc.wear_category === form.wear_category && chartHasMeasurements(sc.id)).length === 0}
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Link this product to an existing sizing chart template. Make sure you created a size chart and given the values in it.
            </p>
          </div>

          {/* Image Upload via Cloudinary */}
          <MultiImageManager
            images={form.images}
            onChange={(imgs) => setForm({ ...form, images: imgs })}
            disabled={submitting}
            max={8}
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving…</>
              ) : (
                editProduct ? "Save Product" : "Create Product"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
