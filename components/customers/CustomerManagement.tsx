"use client";

import React, { useState, useEffect } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import { customerApi, stitchingOrderApi } from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  ShoppingBag,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Customer Interface
interface Customer {
  id: string;
  name: string;
  phone: string;
  height: number;
  weight: number;
  notes: string;
  createdAt: string;
}

// Stitching Order Interface
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  garmentType: string;
  fabricDetails: string;
  advanceAmount: number;
  remainingAmount: number;
  deliveryDate: string;
  status: "Pending" | "In Progress" | "Ready for Trial" | "Delivered";
  createdAt: string;
}

// Backend Mappers
const mapBackendToCustomer = (bc: any): Customer => ({
  id: String(bc.id),
  name: bc.name,
  phone: bc.phone,
  height: bc.height || 0,
  weight: bc.weight || 0,
  notes: bc.notes || "",
  createdAt: bc.created_at ? bc.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
});

export default function CustomerManagement() {
  const { addToast } = useToastContext();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    height: "",
    weight: "",
    notes: "",
  });

  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [saving, setSaving] = useState(false);

  // Fetch Customers Data in Background
  const fetchCustomerData = async () => {
    try {
      const [custRes, orderRes] = await Promise.all([
        customerApi.list(),
        stitchingOrderApi.list(),
      ]);

      const mappedCustomers = custRes.data.map(mapBackendToCustomer);
      const mappedOrders: Order[] = orderRes.data.map((bo: any) => ({
        id: String(bo.order_id || bo.id),
        customerId: String(bo.customer || bo.customer_id || ""),
        customerName: bo.customer_name || "Customer",
        garmentType: bo.garment_type || "Coat Suit",
        fabricDetails: bo.fabric_details || "",
        advanceAmount: bo.advance_amount || 0,
        remainingAmount: bo.remaining_amount || 0,
        deliveryDate: bo.delivery_date || "",
        status: bo.status || "Pending",
        createdAt: bo.created_at ? bo.created_at.split("T")[0] : "",
      }));

      setCustomers(mappedCustomers);
      setOrders(mappedOrders);
    } catch (err) {
      console.warn("Failed to fetch customer data from server, using local cache:", err);
      const savedCustomers = localStorage.getItem("nf_ledger_customers");
      const savedOrders = localStorage.getItem("nf_ledger_orders");

      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    }
  };

  // 10-Second Smooth Progress Loader (1% to 100%)
  useEffect(() => {
    fetchCustomerData();

    setLoading(true);
    setLoadingProgress(1);

    const intervalTime = 50; // Update every 50ms (5 seconds total)
    const totalSteps = 100;
    const stepIncrement = 100 / totalSteps;

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 200);
          return 100;
        }
        return Math.min(100, Math.round(prev + stepIncrement));
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const syncCustomers = (data: Customer[]) => {
    setCustomers(data);
    localStorage.setItem("nf_ledger_customers", JSON.stringify(data));
  };

  // Add / Edit Handlers
  const handleOpenAddCustomer = () => {
    setEditCustomer(null);
    setCustomerForm({ name: "", phone: "", height: "", weight: "", notes: "" });
    setCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      height: c.height ? String(c.height) : "",
      weight: c.weight ? String(c.weight) : "",
      notes: c.notes || "",
    });
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      addToast("Name and Phone Number are required.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: customerForm.name,
        phone: customerForm.phone,
        height: Number(customerForm.height) || 0,
        weight: Number(customerForm.weight) || 0,
        notes: customerForm.notes,
      };

      if (editCustomer) {
        const res = await customerApi.update(Number(editCustomer.id), payload);
        const updatedCustomer = mapBackendToCustomer(res.data);
        const updated = customers.map((c) => (c.id === editCustomer.id ? updatedCustomer : c));
        syncCustomers(updated);
        addToast(`Customer "${customerForm.name}" updated successfully.`, "success");
      } else {
        const res = await customerApi.create(payload);
        const newCust = mapBackendToCustomer(res.data);
        syncCustomers([...customers, newCust]);
        addToast(`Customer "${customerForm.name}" registered successfully.`, "success");
      }
      setCustomerModalOpen(false);
    } catch (err: any) {
      console.error("Error saving customer:", err);
      addToast("Failed to save customer details.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!confirmDeleteConfig) return;
    try {
      await customerApi.delete(Number(confirmDeleteConfig.id));
      const updated = customers.filter((c) => c.id !== confirmDeleteConfig.id);
      syncCustomers(updated);
      addToast("Customer record deleted successfully.", "success");
    } catch (err) {
      console.error("Error deleting customer:", err);
      addToast("Failed to delete customer record.", "error");
    }
    setConfirmDeleteConfig(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  if (loading) {
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

        <div className="w-full max-w-md space-y-2 mt-2">
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#285A48] via-[#B0E4CC] to-emerald-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(176,228,204,0.6)]"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
            <span>Database Sync: {loadingProgress}%</span>
            <span>5s</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 text-slate-100 select-none">
          <motion.div
            key="customer-main-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B0E4CC] mb-1">
                  <Users size={16} />
                  Customer Directory & Profile Management
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Customers
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage registered customer profiles, contact info, height/weight metrics, and style notes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCustomerData}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                  title="Refresh Customers"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={handleOpenAddCustomer}
                  className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Plus size={14} /> Register Customer
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                className="input-field pl-10 text-xs w-full"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            {/* Customers Table */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      <th className="pb-3">Customer Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Height</th>
                      <th className="pb-3">Weight</th>
                      <th className="pb-3">Registered Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                        <td className="py-3.5">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerProfileOpen(true);
                            }}
                            className="font-bold text-slate-100 hover:text-[#B0E4CC] transition-colors cursor-pointer text-left flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#B0E4CC]/10 border border-[#B0E4CC]/20 flex items-center justify-center text-[#B0E4CC] font-bold text-xs">
                              {c.name.charAt(0)}
                            </div>
                            {c.name}
                          </button>
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono">{c.phone}</td>
                        <td className="py-3.5 text-slate-400">{c.height ? `${c.height} cm` : "—"}</td>
                        <td className="py-3.5 text-slate-400">{c.weight ? `${c.weight} kg` : "—"}</td>
                        <td className="py-3.5 text-slate-500">{c.createdAt}</td>
                        <td className="py-3.5 text-right space-x-3">
                          <button
                            onClick={() => handleOpenEditCustomer(c)}
                            className="text-slate-500 hover:text-slate-200 transition-colors inline-flex align-middle cursor-pointer"
                            title="Edit Info"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteConfig({ id: c.id, name: c.name })}
                            className="text-slate-600 hover:text-rose-400 transition-colors inline-flex align-middle cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          No customer records found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

      {/* MODAL: REGISTER / EDIT CUSTOMER */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={editCustomer ? "Edit Customer Info" : "Register New Customer"}
        size="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="space-y-1">
            <label className="label-text">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              className="input-field text-xs py-2.5"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="label-text">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="input-field text-xs py-2.5"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-text">Height (cm)</label>
              <input
                type="text"
                placeholder="e.g. 165"
                className="input-field text-xs py-2.5"
                value={customerForm.height}
                onChange={(e) => setCustomerForm({ ...customerForm, height: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Weight (kg)</label>
              <input
                type="text"
                placeholder="e.g. 60"
                className="input-field text-xs py-2.5"
                value={customerForm.weight}
                onChange={(e) => setCustomerForm({ ...customerForm, weight: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-text">Notes & Style Preferences</label>
            <textarea
              placeholder="Style notes, specific necklines, standard modifications..."
              className="input-field text-xs py-2.5 min-h-[80px] resize-y"
              value={customerForm.notes}
              onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCustomerModalOpen(false)}
              className="btn-ghost flex-1 py-2 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-2 text-xs font-semibold cursor-pointer"
              disabled={saving}
            >
              {saving ? "Saving..." : editCustomer ? "Save Changes" : "Register Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CUSTOMER PROFILE DETAILS */}
      <Modal
        isOpen={customerProfileOpen && selectedCustomerId !== null}
        onClose={() => setCustomerProfileOpen(false)}
        title="Customer Profile Details"
        size="md"
      >
        {selectedCustomerId && (() => {
          const customer = customers.find((c) => c.id === selectedCustomerId);
          const customerOrders = orders.filter((o) => o.customerId === selectedCustomerId);

          if (!customer) return <p className="text-slate-500 text-xs">Customer profile not found.</p>;

          return (
            <div className="space-y-6 text-slate-200 text-xs">
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 pb-2 mb-1">
                  <User size={13} className="text-[#B0E4CC]" />
                  Profile Metadata
                </div>
                <div className="grid grid-cols-2 gap-y-2.5">
                  <div className="text-slate-500 font-semibold">Name:</div>
                  <div className="text-slate-200 font-bold">{customer.name}</div>
                  <div className="text-slate-500 font-semibold">Phone:</div>
                  <div className="text-slate-200 font-mono">{customer.phone}</div>
                  <div className="text-slate-500 font-semibold">Height:</div>
                  <div className="text-slate-200">{customer.height ? `${customer.height} cm` : "—"}</div>
                  <div className="text-slate-500 font-semibold">Weight:</div>
                  <div className="text-slate-200">{customer.weight ? `${customer.weight} kg` : "—"}</div>
                </div>
                {customer.notes && (
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <div className="text-slate-500 font-semibold mb-1">Special Notes:</div>
                    <div className="text-slate-300 italic whitespace-pre-wrap">{customer.notes}</div>
                  </div>
                )}
              </div>

              {/* Linked Orders History */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 pb-2 mb-1">
                  <ShoppingBag size={13} className="text-[#B0E4CC]" />
                  Orders History ({customerOrders.length})
                </div>
                {customerOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[450px] text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-white/5 font-bold uppercase text-[9px] tracking-wider">
                          <th className="pb-2">Order ID</th>
                          <th className="pb-2">Garment Type</th>
                          <th className="pb-2">Delivery Date</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((o) => (
                          <tr key={o.id} className="border-b border-white/[0.01]">
                            <td className="py-2.5 font-mono font-semibold text-[#B0E4CC]">{o.id}</td>
                            <td className="py-2.5 text-slate-300 font-bold">{o.garmentType}</td>
                            <td className="py-2.5 text-slate-500">{o.deliveryDate}</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-500/20">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No active stitching orders for this customer.</p>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmDeleteConfig !== null}
        onClose={() => setConfirmDeleteConfig(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete customer "${confirmDeleteConfig?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
