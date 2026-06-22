"use client";

import { useState, useEffect, FormEvent } from "react";
import { fabricApi } from "@/lib/api";
import { useToastContext } from "@/contexts/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import type { Fabric, StretchType, StructureType, WeightCategory } from "@/types";
import { Plus, Layers, Zap, Weight, Grid3X3, Edit2, Trash2 } from "lucide-react";

const STRETCH_TYPES: StretchType[] = ["Non-Stretch", "Low", "Medium", "High"];
const STRUCTURE_TYPES: StructureType[] = ["Structured", "Flowy", "Knit", "Rigid"];
const WEIGHT_CATEGORIES: WeightCategory[] = ["Light", "Medium", "Heavy"];

const stretchVariant: Record<StretchType, "emerald" | "indigo" | "violet" | "amber"> = {
  "Non-Stretch": "emerald",
  Low: "indigo",
  Medium: "violet",
  High: "amber",
};
const weightVariant: Record<WeightCategory, "indigo" | "violet" | "amber"> = {
  Light: "indigo",
  Medium: "violet",
  Heavy: "amber",
};

const stretchLabels: Record<StretchType, string> = {
  "Non-Stretch": "Non-Stretch",
  Low: "Low Stretch",
  Medium: "Medium Stretch",
  High: "High Stretch",
};

function FabricCard({
  fabric,
  onEdit,
  onDelete,
}: {
  fabric: Fabric;
  onEdit: (f: Fabric) => void;
  onDelete: (f: Fabric) => void;
}) {
  return (
    <div className="glass-card-hover rounded-2xl overflow-hidden animate-slide-up flex flex-col justify-between h-full">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
            <Layers size={20} className="text-indigo-400" />
          </div>
          <Badge
            label={`${fabric.weight_category}weight`}
            variant={weightVariant[fabric.weight_category]}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-100 leading-snug">{fabric.name}</h3>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            label={stretchLabels[fabric.stretch_type]}
            variant={stretchVariant[fabric.stretch_type]}
          />
          <Badge label={fabric.structure_type} variant="slate" />
        </div>
      </div>

      <div className="px-5 pb-4 pt-2.5 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
        <button
          onClick={() => onEdit(fabric)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          onClick={() => onDelete(fabric)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors"
        >
          <Trash2 size={12} /> Delete
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
    stretch_type: "Non-Stretch",
    structure_type: "Structured",
    weight_category: "Light",
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
      stretch_type: "Non-Stretch",
      structure_type: "Structured",
      weight_category: "Light",
    });
  };

  const handleEditClick = (fabric: Fabric) => {
    setEditFabric(fabric);
    setForm({
      name: fabric.name,
      stretch_type: fabric.stretch_type,
      structure_type: fabric.structure_type,
      weight_category: fabric.weight_category,
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editFabric) {
        const { data } = await fabricApi.update(editFabric.id, form);
        setFabrics((prev) => prev.map((f) => (f.id === editFabric.id ? data : f)));
        addToast(`Fabric "${data.name}" updated!`, "success");
      } else {
        const { data } = await fabricApi.create(form);
        setFabrics((prev) => [...prev, data]);
        addToast(`Fabric "${data.name}" added!`, "success");
      }
      handleCloseModal();
    } catch {
      addToast(editFabric ? "Failed to update fabric." : "Failed to add fabric.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Fabric Library</h1>
          <p className="text-slate-500 text-sm mt-1">
            {fabrics.length} fabric{fabrics.length !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Add Fabric
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Layers, label: "Total Fabrics", value: fabrics.length, color: "text-indigo-400" },
          { icon: Zap, label: "High Stretch", value: fabrics.filter((f) => f.stretch_type === "High").length, color: "text-amber-400" },
          { icon: Weight, label: "Heavyweight", value: fabrics.filter((f) => f.weight_category === "Heavy").length, color: "text-violet-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
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
          <p className="text-slate-500 text-sm mb-6">
            Add your first fabric to start building your library.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
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
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Fabric Name</label>
            <input
              className="input-field"
              placeholder="e.g., Premium Cotton Twill"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label-text">Stretch Type</label>
            <Select
              value={form.stretch_type}
              onChange={(val) => setForm({ ...form, stretch_type: val as StretchType })}
              options={STRETCH_TYPES.map((s) => ({ value: s, label: s }))}
              required
            />
          </div>

          <div>
            <label className="label-text">Structure Type</label>
            <Select
              value={form.structure_type}
              onChange={(val) => setForm({ ...form, structure_type: val as StructureType })}
              options={STRUCTURE_TYPES.map((s) => ({ value: s, label: s }))}
              required
            />
          </div>

          <div>
            <label className="label-text">Weight Category</label>
            <Select
              value={form.weight_category}
              onChange={(val) => setForm({ ...form, weight_category: val as WeightCategory })}
              options={WEIGHT_CATEGORIES.map((w) => ({ value: w, label: w }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
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
