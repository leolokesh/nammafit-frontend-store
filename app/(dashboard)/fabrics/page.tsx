"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { fabricApi } from "@/lib/api";
import { useToastContext } from "@/contexts/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { Fabric } from "@/types";
import { Plus, Layers, Grid3X3, Edit2, Trash2, Palette, Image as ImageIcon, Upload, X, Check } from "lucide-react";

const PRESET_COLORS = [
  { name: "NammaFit Emerald", hex: "#285A48" },
  { name: "Midnight Navy", hex: "#1E293B" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Deep Burgundy", hex: "#881337" },
  { name: "Golden Amber", hex: "#D97706" },
  { name: "Slate Charcoal", hex: "#334155" },
  { name: "Royal Purple", hex: "#7C3AED" },
  { name: "Crimson Red", hex: "#E11D48" },
  { name: "Cotton White", hex: "#F8FAFC" },
  { name: "Jet Black", hex: "#0F172A" },
];

function FabricCard({
  fabric,
  onEdit,
  onDelete,
}: {
  fabric: Fabric;
  onEdit: (f: Fabric) => void;
  onDelete: (f: Fabric) => void;
}) {
  const hexColor = fabric.color || "#285A48";

  return (
    <div className="glass-card-hover rounded-2xl overflow-hidden animate-slide-up flex flex-col justify-between h-full border border-white/10 group">
      <div>
        {/* Fabric Swatch Preview Header */}
        <div className="relative h-36 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
          {fabric.image_url ? (
            <img
              src={fabric.image_url}
              alt={fabric.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${hexColor}FF 0%, ${hexColor}88 100%)`,
              }}
            />
          )}

          {/* Color Indicator Badge overlay */}
          {fabric.color && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white font-bold">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: hexColor }}
              />
              <span>{hexColor.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-100 leading-snug">{fabric.name}</h3>
        </div>
      </div>

      <div className="p-4 pt-0 flex items-center gap-2">
        <button
          onClick={() => onEdit(fabric)}
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Edit2 size={13} className="text-[#B0E4CC]" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onDelete(fabric)}
          className="flex-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

export default function FabricsPage() {
  const { addToast } = useToastContext();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFabric, setEditFabric] = useState<Fabric | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fabricToDelete, setFabricToDelete] = useState<Fabric | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<Omit<Fabric, "id">>({
    name: "",
    color: "#285A48",
    image_url: "",
  });

  const loadFabrics = async () => {
    try {
      const { data } = await fabricApi.list();
      setFabrics(data);
    } catch {
      addToast("Failed to load fabrics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFabrics(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditFabric(null);
    setForm({
      name: "",
      color: "#285A48",
      image_url: "",
    });
  };

  const handleEditClick = (fabric: Fabric) => {
    setEditFabric(fabric);
    setForm({
      name: fabric.name,
      color: fabric.color || "#285A48",
      image_url: fabric.image_url || "",
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (fabric: Fabric) => {
    setFabricToDelete(fabric);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fabricToDelete) return;
    setDeleting(true);
    try {
      await fabricApi.delete(fabricToDelete.id);
      setFabrics((prev) => prev.filter((f) => f.id !== fabricToDelete.id));
      addToast(`Fabric "${fabricToDelete.name}" deleted successfully.`, "success");
      setDeleteModalOpen(false);
      setFabricToDelete(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to delete fabric.";
      addToast(errMsg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("Image size must be less than 5MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64String = uploadEvent.target?.result as string;
        setForm((prev) => ({ ...prev, image_url: base64String }));
        addToast("Fabric texture encoded as Base64!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Please enter a fabric name.", "warning");
      return;
    }
    setSubmitting(true);
    
    const payload = {
      name: form.name.trim(),
      color: form.color || "#285A48",
      image_url: form.image_url || "",
    };

    try {
      if (editFabric) {
        const { data } = await fabricApi.update(editFabric.id, payload);
        setFabrics((prev) => prev.map((f) => (f.id === editFabric.id ? data : f)));
        addToast(`Fabric "${data.name}" updated in database!`, "success");
      } else {
        const { data } = await fabricApi.create(payload);
        setFabrics((prev) => [...prev, data]);
        addToast(`Fabric "${data.name}" saved to database!`, "success");
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Fabric save error:", err);
      const msg = err.response?.data?.detail || err.response?.data?.name?.[0] || "Failed to save fabric to database.";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container py-8 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Fabric Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            {fabrics.length} bespoke fabric{fabrics.length !== 1 ? "s" : ""} configured with texture & color hex codes
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary cursor-pointer">
          <Plus size={16} />
          Add Fabric
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Layers, label: "Total Fabrics", value: fabrics.length, color: "text-indigo-400" },
          { icon: ImageIcon, label: "Texture Swatches", value: fabrics.filter((f) => !!f.image_url).length, color: "text-amber-400" },
          { icon: Palette, label: "Custom Hex Colors", value: fabrics.filter((f) => !!f.color).length, color: "text-emerald-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : fabrics.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Grid3X3 size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-slate-200 font-medium mb-2">No fabrics yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Add your first fabric swatch & color hex code to start building your library.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary cursor-pointer">
            <Plus size={16} /> Add Fabric
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
          {fabrics.map((fabric) => (
            <FabricCard
              key={fabric.id}
              fabric={fabric}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editFabric ? "Edit Fabric" : "Add New Fabric"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fabric Name */}
          <div>
            <label className="label-text">Fabric Name</label>
            <input
              className="input-field"
              placeholder="e.g., Italian Super 130s Wool Twill"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Color Choice & Hex Code */}
          <div className="space-y-2">
            <label className="label-text flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette size={14} className="text-[#B0E4CC]" />
                Choose Color or Enter Hex Code
              </span>
              <span className="font-mono text-xs text-[#B0E4CC]">{form.color || "#285A48"}</span>
            </label>

            <div className="flex items-center gap-3">
              {/* Native Color Picker Box */}
              <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-white/20 shadow-md cursor-pointer">
                <input
                  type="color"
                  value={form.color || "#285A48"}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="absolute -inset-2 w-16 h-16 cursor-pointer opacity-0"
                />
                <div
                  className="w-full h-full rounded-xl border border-white/20"
                  style={{ backgroundColor: form.color || "#285A48" }}
                />
              </div>

              {/* Hex Code Input */}
              <input
                type="text"
                className="input-field font-mono text-xs uppercase"
                placeholder="#285A48"
                value={form.color || ""}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>

            {/* Quick Color Swatch Presets */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Preset Color Swatches:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setForm({ ...form, color: c.hex })}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      form.color?.toLowerCase() === c.hex.toLowerCase()
                        ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                        : "border-white/20 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {form.color?.toLowerCase() === c.hex.toLowerCase() && (
                      <Check size={10} className="text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fabric Image & Presets */}
          <div className="space-y-2">
            <label className="label-text flex items-center gap-1.5">
              <ImageIcon size={14} className="text-[#B0E4CC]" />
              Fabric Texture Image (Upload / URL / Presets)
            </label>

            {/* Live Preview Box */}
            {form.image_url ? (
              <div className="relative h-24 w-full rounded-xl overflow-hidden border border-white/20 bg-slate-900 group">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                  title="Remove Image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File Upload Button */}
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-200 cursor-pointer transition">
                <Upload size={14} className="text-[#B0E4CC]" />
                Upload Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              {/* Image URL Input */}
              <input
                type="url"
                className="input-field text-xs"
                placeholder="Or paste Image URL..."
                value={form.image_url || ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={handleCloseModal} className="btn-ghost flex-1 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 cursor-pointer">
              {submitting ? "Saving…" : (editFabric ? "Save Changes" : "Add Fabric")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFabricToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Fabric"
        message={`Are you sure you want to delete the fabric "${fabricToDelete?.name}"? This will permanently delete the fabric configuration and cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
