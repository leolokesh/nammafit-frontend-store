"use client";

import { useState, useEffect, FormEvent } from "react";
import { productApi, sizeChartApi, measurementApi } from "@/lib/api";
import { useToastContext } from "@/contexts/ToastContext";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import type { Product, SizeChart, Measurement, WearCategory } from "@/types";
import {
  Ruler,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Trash2,
  Shirt,
  Package,
  AlertTriangle,
} from "lucide-react";

const ALL_SIZES = [
  "3XS",
  "2XS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
  "8XL",
  "9XL",
  "10XL",
];

const COLUMN_LABELS: Record<string, string> = {
  bust: "Bust",
  shoulder: "Shoulder",
  waist: "Waist",
  hip: "Hip",
  inseam: "Inseam",
  thighs: "Thighs",
};

const WEAR_CATEGORY_LABELS: Record<string, string> = {
  TOPWEAR: "Topwear",
  BOTTOMWEAR: "Bottomwear",
  FULL_BODY: "Full Body",
};

// Topwear columns: shoulder, bust, hip, waist
// Bottomwear columns: waist, hip, thighs, inseam
// Full Body columns: bust, shoulder, waist, hip, inseam, thighs
function getColumnsForCategory(cat: string) {
  switch (cat) {
    case "TOPWEAR":
      return ["shoulder", "bust", "hip", "waist"] as const;
    case "BOTTOMWEAR":
      return ["waist", "hip", "thighs", "inseam"] as const;
    case "FULL_BODY":
    default:
      return ["bust", "shoulder", "waist", "hip", "inseam", "thighs"] as const;
  }
}


// Detect gaps in selected sizes
function detectGaps(activeSizes: string[]): string[] {
  if (activeSizes.length <= 1) return [];

  const indices = activeSizes
    .map((s) => ALL_SIZES.indexOf(s))
    .filter((idx) => idx !== -1)
    .sort((a, b) => a - b);

  const minIdx = indices[0];
  const maxIdx = indices[indices.length - 1];

  const missing: string[] = [];
  for (let i = minIdx + 1; i < maxIdx; i++) {
    const size = ALL_SIZES[i];
    if (!activeSizes.includes(size)) {
      missing.push(size);
    }
  }
  return missing;
}

export default function SizingPage() {
  const { addToast } = useToastContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // unit is always "inch"
  const unit = "inch";
  const [displayUnit, setDisplayUnit] = useState<"cm" | "inch">("inch");

  // Accordion state
  const [expandedChartId, setExpandedChartId] = useState<number | null>(null);

  // In-memory edits table state: sizeChartId -> sizeLabel -> measurementValues
  const [localMeasurements, setLocalMeasurements] = useState<
    Record<number, Record<string, Partial<Measurement>>>
  >({});

  // Size chart creation modal state
  const [newChartModalOpen, setNewChartModalOpen] = useState(false);
  const [newChartForm, setNewChartForm] = useState({
    name: "",
    fit: "",
    wear_category: "" as any,
  });
  const [creatingChart, setCreatingChart] = useState(false);

  // Gap warning states
  const [gapModalOpen, setGapModalOpen] = useState(false);
  const [pendingSaveChartId, setPendingSaveChartId] = useState<number | null>(null);
  const [detectedGaps, setDetectedGaps] = useState<string[]>([]);

  // Saving states
  const [savingChartId, setSavingChartId] = useState<number | null>(null);

  // Load Sizing data from backend and format local state
  const loadAllData = async () => {
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        productApi.list(),
        sizeChartApi.list(),
        measurementApi.list(),
      ]);
      setProducts(pRes.data);
      setSizeCharts(cRes.data);
      setMeasurements(mRes.data);

      // Build local measurements map
      const localMap: Record<number, Record<string, Partial<Measurement>>> = {};

      cRes.data.forEach((chart) => {
        localMap[chart.id] = {};

        // Find measurements for this size chart in database
        const chartMeas = mRes.data.filter((m) => m.size_chart === chart.id);

        // Check if database values are stored in cm or double-converted (max bust/hip > 145)
        let dbUnitStatus: "inch" | "cm" | "double_cm" = "inch";
        const maxBustOrHip = Math.max(
          ...chartMeas.map((m) => Math.max(Number(m.bust) || 0, Number(m.hip) || 0))
        );
        if (maxBustOrHip > 145) {
          dbUnitStatus = "double_cm";
        } else if (maxBustOrHip > 50) {
          dbUnitStatus = "cm";
        }

        chartMeas.forEach((m) => {
          const parseDbVal = (v: any) => {
            if (v === null || v === undefined || v === "") return undefined;
            let num = Number(v);
            if (isNaN(num) || num === 0) return undefined;
            if (dbUnitStatus === "double_cm") {
              num = Number((num / 6.4516).toFixed(1));
            } else if (dbUnitStatus === "cm") {
              num = Number((num / 2.54).toFixed(1));
            }
            return num;
          };

          let bust = parseDbVal(m.bust);
          let shoulder = parseDbVal(m.shoulder);
          let waist = parseDbVal(m.waist);
          let hip = parseDbVal(m.hip);
          let inseam = parseDbVal(m.inseam);
          let thighs = parseDbVal(m.thighs);


          localMap[chart.id][m.size_label] = {
            bust,
            shoulder,
            waist,
            hip,
            inseam,
            thighs,
          };
        });
      });

      setLocalMeasurements(localMap);

      // Auto expand first fit
      if (cRes.data.length > 0 && expandedChartId === null) {
        setExpandedChartId(cRes.data[0].id);
      }
    } catch {
      addToast("Failed to load sizing data.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []); // Only load on mount, conversion is done on the fly in-memory


  const handleCloseNewChartModal = () => {
    setNewChartModalOpen(false);
    setNewChartForm({
      name: "",
      fit: "",
      wear_category: "" as any,
    });
  };

  // Create size chart handler
  const handleCreateChart = async (e: FormEvent) => {
    e.preventDefault();
    const name = newChartForm.name.trim();
    const fit = newChartForm.fit.trim();
    const wear_category = newChartForm.wear_category;
    if (!name || !fit || !wear_category) return;

    if (sizeCharts.some((sc) => sc.name.toLowerCase() === name.toLowerCase())) {
      addToast("A sizing chart with this name already exists.", "warning");
      return;
    }

    setCreatingChart(true);
    try {
      const { data } = await sizeChartApi.create({ name, fit, wear_category });
      setSizeCharts((prev) => [...prev, data]);
      setLocalMeasurements((prev) => ({ ...prev, [data.id]: {} }));
      setExpandedChartId(data.id);
      addToast(`Sizing Chart "${data.name}" created successfully!`, "success");
      handleCloseNewChartModal();
    } catch {
      addToast("Failed to create new sizing chart template.", "error");
    } finally {
      setCreatingChart(false);
    }
  };

  // Delete sizing chart handler
  const handleDeleteChart = async (chartId: number, chartName: string) => {
    // Check product links first
    const mappedProds = products.filter((p) => p.size_chart === chartId);
    if (mappedProds.length > 0) {
      const prodNames = mappedProds.map((p) => `"${p.name}"`).join(", ");
      addToast(
        `Cannot delete "${chartName}". It is still linked to the following product(s): ${prodNames}. Please unlink them from the Product Catalog first.`,
        "error"
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete the sizing chart "${chartName}"?`)) {
      return;
    }
    try {
      await sizeChartApi.delete(chartId);
      setSizeCharts((prev) => prev.filter((sc) => sc.id !== chartId));
      addToast(`Sizing Chart "${chartName}" deleted.`, "success");
      
      // Reload baseline
      const [pRes, mRes] = await Promise.all([
        productApi.list(),
        measurementApi.list(),
      ]);
      setProducts(pRes.data);
      setMeasurements(mRes.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to delete sizing chart.";
      addToast(errMsg, "error");
    }
  };

  // Add Size Row locally
  const handleAddSizeRow = (chartId: number, size: string) => {
    if (!size) return;
    setLocalMeasurements((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [size]: {
          bust: undefined,
          shoulder: undefined,
          waist: undefined,
          hip: undefined,
          inseam: undefined,
          thighs: undefined,
        },
      },
    }));
  };

  // Delete Size Row locally
  const handleDeleteSizeRowLocal = (chartId: number, size: string) => {
    setLocalMeasurements((prev) => {
      const updated = { ...prev[chartId] };
      delete updated[size];
      return {
        ...prev,
        [chartId]: updated,
      };
    });
  };

  // Save changes handler (with gap checking)
  const handleSaveClick = (chartId: number) => {
    const activeSizes = Object.keys(localMeasurements[chartId] || {});
    const gaps = detectGaps(activeSizes);

    if (gaps.length > 0) {
      setPendingSaveChartId(chartId);
      setDetectedGaps(gaps);
      setGapModalOpen(true);
    } else {
      executeSave(chartId);
    }
  };

  // Save changes to backend
  const executeSave = async (chartId: number) => {
    const chart = sizeCharts.find(sc => sc.id === chartId);
    if (!chart) return;
    const columns = getColumnsForCategory(chart.wear_category);

    setSavingChartId(chartId);
    try {
      const localChartMeas = localMeasurements[chartId] || {};
      const activeSizes = Object.keys(localChartMeas);

      // Fetch existing database rows for this size chart
      const dbChartMeas = measurements.filter((m) => m.size_chart === chartId);

      // 1. Delete rows that have been removed locally
      const toDelete = dbChartMeas.filter(
        (m) => !activeSizes.includes(m.size_label)
      );
      await Promise.all(
        toDelete.map((m) => {
          if (m.id) return measurementApi.delete(m.id);
        })
      );

      // 2. Create or Update size measurements directly in size chart
      await Promise.all(
        activeSizes.map(async (size) => {
          const existing = dbChartMeas.find((m) => m.size_label === size);
          const sizeVals = localChartMeas[size] || {};

          const formVals = Object.fromEntries(
            columns.map((col) => {
              let val = sizeVals[col as keyof Measurement] ?? null;
              if (val !== null && val !== undefined && (val as any) !== "") {
                const parsedVal = Number(val);
                if (!isNaN(parsedVal)) {
                  val = parsedVal;
                }
              }
              return [col, val];
            })
          );

          console.log("executeSave payload debug:", {
            size,
            unit,
            sizeVals,
            formVals
          });

          const payload = {
            size_chart: chartId,
            size_label: size as any,
            ...formVals,
          } as Measurement;

          if (existing?.id) {
            await measurementApi.update(existing.id, payload);
          } else {
            await measurementApi.create(payload);
          }
        })
      );

      addToast("Successfully saved!", "success");
      setGapModalOpen(false);
      setPendingSaveChartId(null);
      setDetectedGaps([]);

      // Reload baseline database measurements
      const res = await measurementApi.list();
      setMeasurements(res.data);
    } catch {
      addToast("Failed to save measurements.", "error");
    } finally {
      setSavingChartId(null);
    }
  };

  const handleContinueSave = () => {
    if (!pendingSaveChartId) return;
    executeSave(pendingSaveChartId);
  };

  return (
    <div className="page-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Sizing Matrices</h1>
          <p className="text-slate-500 text-sm mt-1">
            Define size chart templates once and select them on your product listing pages
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Unit Toggle Switch */}
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              disabled={loadingData}
              onClick={() => setDisplayUnit("cm")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                displayUnit === "cm"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                  : "text-slate-500 hover:text-slate-300"
              } ${loadingData ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              cm
            </button>
            <button
              disabled={loadingData}
              onClick={() => setDisplayUnit("inch")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                displayUnit === "inch"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                  : "text-slate-500 hover:text-slate-300"
              } ${loadingData ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              inch
            </button>
          </div>

          <button onClick={() => setNewChartModalOpen(true)} className="btn-primary">
            <Plus size={16} />
            Create Sizing Chart
          </button>
        </div>
      </div>

      {/* Main content */}
      {loadingData ? (
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : sizeCharts.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Ruler size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-slate-200 font-medium mb-1">No size charts defined yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Create your first sizing chart template to link it to products.
          </p>
          <button onClick={() => setNewChartModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Create Sizing Chart
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sizeCharts.map((chart) => {
            const isExpanded = expandedChartId === chart.id;

            // Find products mapped to this size chart
            const mappedProducts = products.filter((p) => p.size_chart === chart.id);

            const fitMeasLocal = localMeasurements[chart.id] || {};
            const sortedActiveSizes = Object.keys(fitMeasLocal).sort(
              (a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b)
            );
            const columns = getColumnsForCategory(chart.wear_category);

            return (
              <div
                key={chart.id}
                className={`glass-card rounded-2xl transition-all duration-300 ${
                  isExpanded ? "overflow-visible" : "overflow-hidden"
                }`}
              >
                {/* Header (Accordion Toggle) */}
                <div
                  onClick={() => setExpandedChartId(isExpanded ? null : chart.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-white/3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Shirt size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                        {chart.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fit style: <span className="text-indigo-400 font-medium">{chart.fit}</span> · Type: <span className="text-violet-400 font-medium">{WEAR_CATEGORY_LABELS[chart.wear_category] || chart.wear_category}</span> · {mappedProducts.length} product{mappedProducts.length !== 1 ? "s" : ""} linked
                      </p>
                    </div>
                  </div>

                  {/* Badges of mapped products (Read-Only) */}
                  <div className="flex flex-wrap gap-2 max-w-xl">
                    {mappedProducts.map((p) => (
                      <Badge key={p.id} label={p.name} variant="indigo" />
                    ))}
                    {mappedProducts.length === 0 && (
                      <span className="text-xs text-slate-600 italic">
                        No products linked
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 hover:text-slate-300 transition-colors self-end md:self-auto">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Table & Inline Editor (Accordion Content) */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-6 space-y-6 animate-slide-down">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Sizing Template Matrix ({displayUnit})
                        </h4>

                        <div className="flex items-center gap-3">
                          {/* Add Size row dropdown */}
                          <Select
                            value=""
                            onChange={(val) => handleAddSizeRow(chart.id, String(val))}
                            className="text-xs min-w-[150px] max-w-[200px]"
                            placeholder="+ Add Size Row..."
                            options={ALL_SIZES.filter(
                              (s) => !Object.keys(fitMeasLocal).includes(s)
                            ).map((s) => ({ value: s, label: s }))}
                          />

                          {/* Delete Chart Template */}
                          <button
                            onClick={() => handleDeleteChart(chart.id, chart.name)}
                            className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold hover:text-red-200 transition-all"
                          >
                            Delete Chart
                          </button>
                        </div>
                      </div>

                      {sortedActiveSizes.length === 0 ? (
                        <div className="text-center py-10 bg-slate-900/10 rounded-2xl border border-white/5">
                          <p className="text-xs text-slate-500">No sizing rows defined yet.</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Use the dropdown above to add size rows (3XS to 10XL) to this matrix.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-white/5 rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10 bg-white/[0.01]">
                                  <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium w-24 min-w-[80px]">
                                    Size
                                  </th>
                                  {columns.map((col) => (
                                    <th
                                      key={col}
                                      className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium min-w-[130px]"
                                    >
                                      {COLUMN_LABELS[col]} ({displayUnit})
                                    </th>
                                  ))}
                                  <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium w-16 min-w-[70px]">
                                    Remove
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                  {sortedActiveSizes.map((size, idx) => {
                                    const m = fitMeasLocal[size] || {};

                                    return (
                                      <tr
                                        key={size}
                                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors ${
                                          idx % 2 === 0 ? "" : "bg-white/[0.005]"
                                        }`}
                                      >
                                        <td className="px-5 py-3 font-semibold text-slate-200 min-w-[80px]">
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                            {size}
                                          </div>
                                        </td>
                                        {columns.map((col) => {
                                          const val = m[col];
                                          const displayVal = val !== undefined && val !== null && (val as any) !== ""
                                            ? (displayUnit === "cm" ? Number((Number(val) * 2.54).toFixed(1)) : val)
                                            : "";
                                          return (
                                            <td key={col} className="px-3 py-2 text-slate-300 min-w-[130px]">
                                              <div className="relative flex items-center">
                                                <input
                                                  type="number"
                                                  step="0.1"
                                                  min="0"
                                                  placeholder="—"
                                                  className="w-full max-w-[120px] bg-slate-900/50 border border-white/5 focus:border-[#408a71]/50 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#408a71]/30 transition-all"
                                                  value={displayVal}
                                                  onChange={(e) => {
                                                    const valStr = e.target.value;
                                                    // Restrict: max 4 digits before dot, max 2 digits after dot
                                                    if (valStr !== "" && !/^\d{0,4}(\.\d{0,2})?$/.test(valStr)) {
                                                      return;
                                                    }
                                                    const parsed =
                                                      valStr === ""
                                                        ? undefined
                                                        : Number(valStr);
                                                    const valInInches = parsed !== undefined
                                                      ? (displayUnit === "cm" ? Number((parsed / 2.54).toFixed(2)) : parsed)
                                                      : undefined;
                                                    setLocalMeasurements((prev) => ({
                                                      ...prev,
                                                      [chart.id]: {
                                                        ...prev[chart.id],
                                                        [size]: {
                                                          ...prev[chart.id][size],
                                                          [col]: valInInches,
                                                        },
                                                      },
                                                    }));
                                                  }}
                                                />
                                              </div>
                                            </td>
                                          );
                                        })}
                                        <td className="px-5 py-3 text-right min-w-[70px]">
                                          <button
                                            onClick={() =>
                                              handleDeleteSizeRowLocal(chart.id, size)
                                            }
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all hover:text-red-200"
                                            title="Delete Row"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      {sortedActiveSizes.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-white/5">
                          <button
                            disabled={savingChartId === chart.id}
                            onClick={() => handleSaveClick(chart.id)}
                            className="btn-primary flex-items-center gap-1.5 px-5 py-2.5 text-xs font-semibold"
                          >
                            {savingChartId === chart.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Chart Modal */}
      <Modal
        isOpen={newChartModalOpen}
        onClose={handleCloseNewChartModal}
        title="Create Sizing Chart Template"
        size="sm"
      >
        <form onSubmit={handleCreateChart} className="space-y-4">
          <div>
            <label className="label-text">Sizing Chart Name</label>
            <input
              className="input-field"
              placeholder="e.g. Premium Denim Jacket Chart"
              value={newChartForm.name}
              onChange={(e) => setNewChartForm({ ...newChartForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-text">Fit Profile</label>
            <input
              className="input-field"
              placeholder="e.g. Slim, Relaxed..."
              value={newChartForm.fit}
              onChange={(e) => setNewChartForm({ ...newChartForm, fit: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="label-text">Wear Type</label>
            <Select
              value={newChartForm.wear_category}
              onChange={(val) => setNewChartForm({ ...newChartForm, wear_category: val as WearCategory })}
              placeholder="Select Category..."
              options={[
                { value: "TOPWEAR", label: "Topwear" },
                { value: "BOTTOMWEAR", label: "Bottomwear" },
                { value: "FULL_BODY", label: "Full Body" },
              ]}
              required
            />
          </div>


          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseNewChartModal}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingChart || !newChartForm.name.trim() || !newChartForm.fit.trim() || !newChartForm.wear_category}
              className="btn-primary flex-1"
            >
              {creatingChart ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Creating…
                </>
              ) : (
                "Create Chart"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Gap Warning Modal */}
      <Modal
        isOpen={gapModalOpen}
        onClose={() => setGapModalOpen(false)}
        title="Sizing Gap Warning"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Missing Size Labels Detected</h4>
              <p className="text-xs text-amber-400/80 leading-relaxed">
                You have skipped measurements for the following size(s):
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedGaps.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/25 border border-amber-500/35"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Skip warnings might break automatic sizing recommendation logic for buyers of intermediate sizes. Do you want to go back and add them, or continue saving?
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setGapModalOpen(false)}
              className="btn-ghost flex-1 text-xs"
            >
              Go Back & Fill
            </button>
            <button
              type="button"
              onClick={handleContinueSave}
              disabled={pendingSaveChartId === null || savingChartId !== null}
              className="btn-primary flex-1 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600"
            >
              {savingChartId !== null ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving...
                </>
              ) : (
                "Continue Saving"
              )}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
