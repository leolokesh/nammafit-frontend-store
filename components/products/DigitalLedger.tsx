"use client";

import React, { useState, useEffect } from "react";
import { BodyScan } from "@/components/scan/BodyScan";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import { useCustomerContext } from "@/contexts/CustomerContext";
import { customerApi, stitchingOrderApi } from "@/lib/api";
import {
  Ruler,
  Sparkles,
  Edit2,
  Trash2,
  User,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Plus
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

// Measurement Interface
interface MeasurementState {
  chest: number;
  bust?: number;
  waist: number;
  hip: number;
  shoulder: number;
  thigh: number;
  inseam: number;
  neck: number;
  sleeveLength: number;
  topLength: number;
  bottomLength: number;
  updatedAt: string;
}

// Stitching Order Interface
interface Order {
  id: string;
  dbId?: number;
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

type TabType = "measurements" | "orders";

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

const mapCustomerToBackend = (fc: Partial<Customer>, measurementsData?: any): any => {
  const payload: any = {
    name: fc.name,
    phone: fc.phone,
    height: fc.height,
    weight: fc.weight,
    notes: fc.notes,
  };
  if (measurementsData) {
    payload.measurements = measurementsData;
  }
  return payload;
};

const mapBackendToMeasurement = (bm: any): MeasurementState => ({
  chest: bm.chest || bm.bust || 0,
  bust: bm.chest || bm.bust || 0,
  waist: bm.waist || 0,
  hip: bm.hip || 0,
  shoulder: bm.shoulder || 0,
  thigh: bm.thigh || 0,
  inseam: bm.inseam || 0,
  neck: bm.neck || 0,
  sleeveLength: bm.sleeve_length || 0,
  topLength: bm.top_length || 0,
  bottomLength: bm.bottom_length || 0,
  updatedAt: bm.updated_at ? bm.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
});

const mapMeasurementToBackend = (ms: Partial<MeasurementState>): any => ({
  chest: ms.chest || ms.bust || 0,
  bust: ms.chest || ms.bust || 0,
  waist: ms.waist || 0,
  hip: ms.hip || 0,
  shoulder: ms.shoulder || 0,
  thigh: ms.thigh || 0,
  inseam: ms.inseam || 0,
  neck: ms.neck || 0,
  sleeve_length: ms.sleeveLength || 0,
  top_length: ms.topLength || 0,
  bottom_length: ms.bottomLength || 0,
});

const mapBackendToOrder = (bo: any): Order => {
  const advance = Number(bo.advance_amount) || 0;
  const remaining = Number(bo.remaining_amount) || 0;
  return {
    id: String(bo.order_id || bo.id),
    dbId: bo.id,
    customerId: String(bo.customer || bo.customer_id || ""),
    customerName: bo.customer_name || "Customer",
    garmentType: bo.garment_type || "Custom Garment",
    fabricDetails: bo.fabric_details || "",
    advanceAmount: advance,
    remainingAmount: remaining,
    deliveryDate: bo.delivery_date || "",
    status: bo.status || "Pending",
    createdAt: bo.created_at ? bo.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
  };
};

const mapOrderToBackend = (fo: Partial<Order>): any => {
  const paid = fo.advanceAmount || 0;
  const remaining = fo.remainingAmount || 0;
  return {
    customer: Number(fo.customerId),
    garment_type: fo.garmentType,
    fabric_details: fo.fabricDetails,
    advance_amount: String(paid),
    remaining_amount: String(remaining),
    delivery_date: fo.deliveryDate,
    status: fo.status,
  };
};

export default function DigitalLedger() {
  const { addToast } = useToastContext();

  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<TabType>("measurements");
  const [pageState, setPageState] = useState<"ledger" | "scan">("ledger");
  const [displayUnit, setDisplayUnit] = useState<"cm" | "inch">("inch");

  // Core Ledger Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [measurementsMap, setMeasurementsMap] = useState<Record<string, MeasurementState>>({});
  const [orders, setOrders] = useState<Order[]>([]);

  // Global Customer Selection Context
  const { selectedCustomerId, selectCustomer } = useCustomerContext();
  const setSelectedCustomerId = (id: string | null) => selectCustomer(id || "");

  // Modal Control States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    height: "",
    weight: "",
    notes: "",
  });

  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState({
    customerId: "",
    garmentType: "",
    fabricDetails: "",
    totalAmount: "",
    amountPaid: "",
    deliveryDate: "",
    status: "Pending" as Order["status"],
  });

  // Deletion States
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState<{
    type: "customer" | "order";
    id: string;
    name: string;
  } | null>(null);

  // Measurements Tab Input Form State
  const [measurementFormStrings, setMeasurementFormStrings] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [saving, setSaving] = useState(false);

  // Initial Data Loading in Background
  const fetchLedgerData = async () => {
    try {
      const [custRes, orderRes] = await Promise.all([
        customerApi.list(),
        stitchingOrderApi.list(),
      ]);

      const backendCustomers = custRes.data;
      const backendOrders = orderRes.data;

      // Map customers and build measurementsMap
      const mappedCustomers: Customer[] = [];
      const tempMeasurementsMap: Record<string, MeasurementState> = {};

      backendCustomers.forEach((bc: any) => {
        const fc = mapBackendToCustomer(bc);
        mappedCustomers.push(fc);
        if (bc.measurements) {
          tempMeasurementsMap[fc.id] = mapBackendToMeasurement(bc.measurements);
        }
      });

      // Map orders
      const mappedOrders = backendOrders.map(mapBackendToOrder);

      setCustomers(mappedCustomers);
      setMeasurementsMap(tempMeasurementsMap);
      setOrders(mappedOrders);

      if (mappedCustomers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(mappedCustomers[0].id);
      }
    } catch (error) {
      console.error("Error fetching ledger data from backend:", error);
      addToast("Failed to load digital ledger from server. Falling back to local cache.", "warning");
      
      const savedCustomers = localStorage.getItem("nf_ledger_customers");
      const savedMeasurements = localStorage.getItem("nf_ledger_measurements");
      const savedOrders = localStorage.getItem("nf_ledger_orders");

      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedMeasurements) setMeasurementsMap(JSON.parse(savedMeasurements));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    }
  };

  // 10-Second Smooth Progress Loader (1% to 100%)
  useEffect(() => {
    fetchLedgerData();

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

  const syncMeasurements = (data: Record<string, MeasurementState>) => {
    setMeasurementsMap(data);
    localStorage.setItem("nf_ledger_measurements", JSON.stringify(data));
  };

  const syncOrders = (data: Order[]) => {
    setOrders(data);
    localStorage.setItem("nf_ledger_orders", JSON.stringify(data));
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      addToast("Name and Phone Number are required.", "warning");
      return;
    }

    setSaving(true);
    try {
      if (editCustomer) {
        const backendPayload = mapCustomerToBackend({
          name: customerForm.name,
          phone: customerForm.phone,
          height: Number(customerForm.height) || 0,
          weight: Number(customerForm.weight) || 0,
          notes: customerForm.notes,
        });
        
        const customerDbId = Number(editCustomer.id);
        const res = await customerApi.update(customerDbId, backendPayload);
        const updatedCustomer = mapBackendToCustomer(res.data);

        const updated = customers.map((c) =>
          c.id === editCustomer.id ? updatedCustomer : c
        );
        syncCustomers(updated);
        
        const updatedOrders = orders.map((o) =>
          o.customerId === editCustomer.id ? { ...o, customerName: customerForm.name } : o
        );
        syncOrders(updatedOrders);

        addToast(`Customer "${customerForm.name}" updated successfully.`, "success");
      } else {
        const backendPayload = mapCustomerToBackend({
          name: customerForm.name,
          phone: customerForm.phone,
          height: Number(customerForm.height) || 0,
          weight: Number(customerForm.weight) || 0,
          notes: customerForm.notes,
        });

        const res = await customerApi.create(backendPayload);
        const newCust = mapBackendToCustomer(res.data);

        syncCustomers([...customers, newCust]);
        addToast(`Customer "${customerForm.name}" registered successfully.`, "success");
      }
      setCustomerModalOpen(false);
    } catch (err: any) {
      console.error("Error saving customer:", err);
      addToast("Failed to save customer", "error");
    } finally {
      setSaving(false);
    }
  };

  const [customerMeasurementsListMap, setCustomerMeasurementsListMap] = useState<Record<string, MeasurementState[]>>({});
  const [selectedMeasurementIndex, setSelectedMeasurementIndex] = useState<number>(0);

  // Measurement Tab Logic
  const handleSelectCustomer = (id: string, customUnit?: "cm" | "inch", targetIndex?: number) => {
    setSelectedCustomerId(id);
    const activeUnit = customUnit || displayUnit;

    const list = customerMeasurementsListMap[id] || (measurementsMap[id] ? [measurementsMap[id]] : [
      {
        chest: 90.0,
        bust: 90.0,
        waist: 74.0,
        hip: 96.0,
        shoulder: 38.0,
        thigh: 52.0,
        inseam: 72.0,
        neck: 34.0,
        sleeveLength: 56.0,
        topLength: 90.0,
        bottomLength: 95.0,
        updatedAt: new Date().toISOString().split("T")[0],
      }
    ]);

    const activeIndex = targetIndex !== undefined ? targetIndex : Math.max(0, list.length - 1);
    setSelectedMeasurementIndex(activeIndex);

    const saved = list[activeIndex];
    const newFormStrings: Record<string, string> = {};
    const keys: (keyof Omit<MeasurementState, "updatedAt">)[] = [
      "chest", "bust", "waist", "hip", "shoulder", "thigh", "inseam", "neck", "sleeveLength", "topLength", "bottomLength"
    ];

    if (saved) {
      keys.forEach((key) => {
        const cmVal = saved[key];
        if (cmVal === undefined || cmVal === null || cmVal === 0) {
          newFormStrings[key] = "";
        } else if (activeUnit === "cm") {
          newFormStrings[key] = String(Math.round(cmVal * 10) / 10);
        } else {
          newFormStrings[key] = String(Math.round((cmVal / 2.54) * 10) / 10);
        }
      });
    } else {
      keys.forEach((key) => {
        newFormStrings[key] = "";
      });
    }
    setMeasurementFormStrings(newFormStrings);
  };

  const customerMeasurementsList = selectedCustomerId
    ? (customerMeasurementsListMap[selectedCustomerId] || (measurementsMap[selectedCustomerId] ? [measurementsMap[selectedCustomerId]] : [
        {
          chest: 90.0,
          bust: 90.0,
          waist: 74.0,
          hip: 96.0,
          shoulder: 38.0,
          thigh: 52.0,
          inseam: 72.0,
          neck: 34.0,
          sleeveLength: 56.0,
          topLength: 90.0,
          bottomLength: 95.0,
          updatedAt: new Date().toISOString().split("T")[0],
        }
      ]))
    : [];

  const handleAddNewMeasurementCard = () => {
    if (!selectedCustomerId) return;
    const currentList = customerMeasurementsList;
    const newIndex = currentList.length;

    const newDraft: MeasurementState = {
      chest: 0,
      bust: 0,
      waist: 0,
      hip: 0,
      shoulder: 0,
      thigh: 0,
      inseam: 0,
      neck: 0,
      sleeveLength: 0,
      topLength: 0,
      bottomLength: 0,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const updatedList = [...currentList, newDraft];
    const updatedHistoryMap = {
      ...customerMeasurementsListMap,
      [selectedCustomerId]: updatedList,
    };
    setCustomerMeasurementsListMap(updatedHistoryMap);

    setSelectedMeasurementIndex(newIndex);
    const newFormStrings: Record<string, string> = {};
    ["bust", "waist", "hip", "shoulder", "thigh", "inseam", "neck", "sleeveLength", "topLength", "bottomLength"].forEach((k) => {
      newFormStrings[k] = "";
    });
    setMeasurementFormStrings(newFormStrings);
    addToast(`Measurement ${newIndex + 1} profile created! Enter values below.`, "info");
  };

  const handleUnitToggle = (newUnit: "cm" | "inch") => {
    if (newUnit === displayUnit) return;
    setDisplayUnit(newUnit);
    if (selectedCustomerId) {
      const updatedStrings: Record<string, string> = {};
      Object.keys(measurementFormStrings).forEach((key) => {
        const valStr = measurementFormStrings[key];
        if (!valStr) {
          updatedStrings[key] = "";
          return;
        }
        const valNum = parseFloat(valStr) || 0;
        if (newUnit === "cm") {
          const cmVal = valNum * 2.54;
          updatedStrings[key] = String(Math.round(cmVal * 10) / 10);
        } else {
          const inchVal = valNum / 2.54;
          updatedStrings[key] = String(Math.round(inchVal * 10) / 10);
        }
      });
      setMeasurementFormStrings(updatedStrings);
    }
  };

  const handleMeasurementFieldChange = (key: string, valStr: string) => {
    if (valStr !== "" && !/^\d{0,5}(\.\d{0,3})?$/.test(valStr)) {
      return;
    }
    setMeasurementFormStrings((prev) => ({
      ...prev,
      [key]: valStr,
    }));
  };

  const handleSaveMeasurements = async () => {
    if (!selectedCustomerId) {
      addToast("Please select a customer first.", "warning");
      return;
    }

    setSaving(true);
    try {
      const parsedCmObj: Partial<MeasurementState> = {};
      const keys: (keyof Omit<MeasurementState, "updatedAt">)[] = [
        "chest", "bust", "waist", "hip", "shoulder", "thigh", "inseam", "neck", "sleeveLength", "topLength", "bottomLength"
      ];

      keys.forEach((key) => {
        const strVal = measurementFormStrings[key];
        if (strVal !== undefined && strVal !== "") {
          const valNum = parseFloat(strVal) || 0;
          if (displayUnit === "cm") {
            parsedCmObj[key] = valNum;
          } else {
            parsedCmObj[key] = valNum * 2.54;
          }
        } else {
          parsedCmObj[key] = 0;
        }
      });

      const today = new Date().toISOString().split("T")[0];
      const newMeasurement: MeasurementState = {
        chest: parsedCmObj.chest || parsedCmObj.bust || 0,
        bust: parsedCmObj.chest || parsedCmObj.bust || 0,
        waist: parsedCmObj.waist || 0,
        hip: parsedCmObj.hip || 0,
        shoulder: parsedCmObj.shoulder || 0,
        thigh: parsedCmObj.thigh || 0,
        inseam: parsedCmObj.inseam || 0,
        neck: parsedCmObj.neck || 0,
        sleeveLength: parsedCmObj.sleeveLength || 0,
        topLength: parsedCmObj.topLength || 0,
        bottomLength: parsedCmObj.bottomLength || 0,
        updatedAt: today,
      };

      const customerDbId = Number(selectedCustomerId);
      const backendPayload = mapCustomerToBackend({}, mapMeasurementToBackend(newMeasurement));
      await customerApi.update(customerDbId, backendPayload);

      const currentList = customerMeasurementsList;
      const updatedList = [...currentList];
      if (selectedMeasurementIndex >= 0 && selectedMeasurementIndex < updatedList.length) {
        updatedList[selectedMeasurementIndex] = newMeasurement;
      } else {
        updatedList.push(newMeasurement);
      }

      const updatedListMap = {
        ...customerMeasurementsListMap,
        [selectedCustomerId]: updatedList,
      };
      setCustomerMeasurementsListMap(updatedListMap);

      const updatedMap = {
        ...measurementsMap,
        [selectedCustomerId]: newMeasurement,
      };
      syncMeasurements(updatedMap);
      addToast(`Measurement ${selectedMeasurementIndex + 1} saved successfully.`, "success");
    } catch (err: any) {
      console.error("Error saving measurements:", err);
      addToast("Failed to save measurements to backend server.", "error");
    } finally {
      setSaving(false);
    }
  };

  // AI Body Scan Completion Handler
  const handleScanComplete = (scanData?: any) => {
    setPageState("ledger");
    if (!scanData) return;

    if (scanData.measurements && selectedCustomerId) {
      const today = new Date().toISOString().split("T")[0];
      const extracted: MeasurementState = {
        chest: scanData.measurements.chest || scanData.measurements.bust || 91.5,
        bust: scanData.measurements.chest || scanData.measurements.bust || 91.5,
        waist: scanData.measurements.waist || 76.0,
        hip: scanData.measurements.hip || 98.0,
        shoulder: scanData.measurements.shoulder || 37.5,
        thigh: scanData.measurements.thigh || 54.0,
        inseam: scanData.measurements.inseam || 71.0,
        neck: scanData.measurements.neck || 34.0,
        sleeveLength: scanData.measurements.sleeveLength || scanData.measurements.sleeve || 36.0,
        topLength: scanData.measurements.topLength || 95.0,
        bottomLength: scanData.measurements.bottomLength || 98.0,
        updatedAt: today,
      };

      const updatedMap = {
        ...measurementsMap,
        [selectedCustomerId]: extracted,
      };
      syncMeasurements(updatedMap);
      handleSelectCustomer(selectedCustomerId);
      addToast("AI Body Scan completed! Sizing values populated successfully.", "success");
    }
  };

  // Order Handlers
  const handleOpenAddOrder = () => {
    setEditOrder(null);
    setOrderForm({
      customerId: selectedCustomerId || (customers[0] ? customers[0].id : ""),
      garmentType: "Salwar Kameez",
      fabricDetails: "",
      totalAmount: "",
      amountPaid: "",
      deliveryDate: "",
      status: "Pending",
    });
    setOrderModalOpen(true);
  };

  const handleOpenEditOrder = (o: Order) => {
    setEditOrder(o);
    const total = o.advanceAmount + o.remainingAmount;
    setOrderForm({
      customerId: o.customerId,
      garmentType: o.garmentType,
      fabricDetails: o.fabricDetails,
      totalAmount: total ? String(total) : "",
      amountPaid: String(o.advanceAmount),
      deliveryDate: o.deliveryDate,
      status: o.status,
    });
    setOrderModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerId || !orderForm.garmentType.trim()) {
      addToast("Customer and Garment Type are required.", "warning");
      return;
    }

    setSaving(true);
    try {
      const selectedCust = customers.find((c) => c.id === orderForm.customerId);
      const customerName = selectedCust ? selectedCust.name : "Unknown Customer";
      const total = Number(orderForm.totalAmount) || 0;
      const paid = Number(orderForm.amountPaid) || 0;
      const remaining = Math.max(0, total - paid);

      const orderPayload = mapOrderToBackend({
        customerId: orderForm.customerId,
        garmentType: orderForm.garmentType,
        fabricDetails: orderForm.fabricDetails,
        advanceAmount: paid,
        remainingAmount: remaining,
        deliveryDate: orderForm.deliveryDate,
        status: orderForm.status,
      });

      if (editOrder) {
        let resData: any = null;
        if (editOrder.dbId !== undefined) {
          const res = await stitchingOrderApi.update(editOrder.dbId, orderPayload);
          resData = res.data;
        }

        const updatedOrder: Order = resData
          ? mapBackendToOrder(resData)
          : {
              ...editOrder,
              customerId: orderForm.customerId,
              customerName,
              garmentType: orderForm.garmentType,
              fabricDetails: orderForm.fabricDetails,
              advanceAmount: paid,
              remainingAmount: remaining,
              deliveryDate: orderForm.deliveryDate,
              status: orderForm.status,
            };

        const updated = orders.map((o) =>
          o.id === editOrder.id ? updatedOrder : o
        );
        syncOrders(updated);
        addToast(`Order ${editOrder.id} updated.`, "success");
      } else {
        const res = await stitchingOrderApi.create(orderPayload);
        const newOrder = mapBackendToOrder(res.data);

        syncOrders([...orders, newOrder]);
        addToast(`Stitching order created successfully.`, "success");
      }
      setOrderModalOpen(false);
    } catch (err: any) {
      console.error("Error saving order:", err);
      addToast("Failed to save stitching order to database.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrderClick = (o: Order) => {
    setConfirmDeleteConfig({ type: "order", id: o.id, name: `Order ${o.id} for ${o.customerName}` });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteConfig) return;
    const { type, id } = confirmDeleteConfig;

    try {
      if (type === "customer") {
        const customerDbId = Number(id);
        await customerApi.delete(customerDbId);

        const updated = customers.filter((c) => c.id !== id);
        syncCustomers(updated);

        const updatedMap = { ...measurementsMap };
        delete updatedMap[id];
        syncMeasurements(updatedMap);

        const updatedOrders = orders.filter((o) => o.customerId !== id);
        syncOrders(updatedOrders);

        if (selectedCustomerId === id) {
          setSelectedCustomerId(null);
        }
        addToast("Customer and associated records deleted.", "success");
      } else if (type === "order") {
        const orderObj = orders.find((o) => o.id === id);
        if (orderObj && orderObj.dbId !== undefined) {
          await stitchingOrderApi.delete(orderObj.dbId);
        }

        const updated = orders.filter((o) => o.id !== id);
        syncOrders(updated);
        addToast("Stitching order deleted successfully.", "success");
      }
    } catch (err: any) {
      console.error("Error deleting record:", err);
      addToast("Failed to delete record from database.", "error");
    }

    setConfirmDeleteConfig(null);
  };

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
    <div className="w-full relative">

        {pageState === "scan" && (
          <motion.div
            key="ai-scanning-pane"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <button
                  onClick={() => setPageState("ledger")}
                  className="flex items-center gap-1 hover:text-[#B0E4CC] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Ledger
                </button>
              </div>
              <BodyScan
                mode="direct"
                onComplete={handleScanComplete}
                onCancel={() => setPageState("ledger")}
              />
            </div>
          </motion.div>
        )}

        {pageState === "ledger" && (
          <motion.div
            key="ledger-dashboard-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Navigation Tab Bar: Measurements & Orders ONLY */}
            <div className="flex flex-wrap gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-2xl w-fit max-w-full">
              {[
                { id: "measurements", label: "Measurements", icon: Ruler },
                { id: "orders", label: "Orders", icon: ShoppingBag },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                      active
                        ? "bg-[#285A48] text-white shadow-md border border-[#B0E4CC]/20"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {/* 1. Measurements Tab */}
                {activeTab === "measurements" && (
                  <motion.div
                    key="measurements-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Customer Select dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Select Customer:
                        </label>
                        <select
                          className="input-field py-2 text-xs w-full sm:w-64 cursor-pointer"
                          value={selectedCustomerId || ""}
                          onChange={(e) => handleSelectCustomer(e.target.value)}
                        >
                          <option value="">-- Choose registered customer --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.phone})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display Unit Toggle */}
                      {selectedCustomerId && (
                        <div className="flex items-center gap-0.5 p-0.5 bg-white/5 border border-white/10 rounded-xl self-start sm:self-center">
                          <button
                            onClick={() => handleUnitToggle("inch")}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              displayUnit === "inch"
                                ? "bg-[#285A48] text-white shadow-md border border-[#B0E4CC]/20"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            inches
                          </button>
                          <button
                            onClick={() => handleUnitToggle("cm")}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              displayUnit === "cm"
                                ? "bg-[#285A48] text-white shadow-md border border-[#B0E4CC]/20"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            cm
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedCustomerId ? (
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        {/* Method 1: Manual Input Grid */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                              Manual Measurements Profile
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Select or add multiple measurement records for this customer below.
                            </p>
                          </div>

                          {/* Multiple Measurement Selection Cards */}
                          <div className="space-y-3 pb-4 border-b border-white/5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <Ruler size={14} className="text-[#B0E4CC]" />
                                <span>Recorded Measurements ({customerMeasurementsList.length})</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleAddNewMeasurementCard}
                                className="px-3 py-1.5 rounded-xl bg-[#285A48]/20 hover:bg-[#285A48]/40 border border-[#B0E4CC]/30 text-xs font-semibold text-[#B0E4CC] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Plus size={13} />
                                <span>Add Measurement</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {customerMeasurementsList.map((m, idx) => {
                                const isSelected = selectedMeasurementIndex === idx;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleSelectCustomer(selectedCustomerId, displayUnit, idx)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                      isSelected
                                        ? "bg-[#285A48]/20 border-[#B0E4CC] shadow-md shadow-[#285A48]/20 text-white"
                                        : "bg-white/[0.02] hover:bg-white/5 border-white/10 text-slate-400"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-200">
                                        Measurement {idx + 1}
                                      </span>
                                      {isSelected && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#B0E4CC] shadow-sm animate-pulse" />
                                      )}
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-500">
                                      {m.updatedAt ? `Saved: ${m.updatedAt}` : "New Entry"}
                                    </p>
                                    <div className="text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1.5 flex items-center justify-between">
                                      <span>Chest: {displayUnit === "cm" ? `${m.chest || m.bust || 0} cm` : `${Math.round((m.chest || m.bust || 0)/2.54*10)/10}"`}</span>
                                      <span>Waist: {displayUnit === "cm" ? `${m.waist || 0} cm` : `${Math.round((m.waist || 0)/2.54*10)/10}"`}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                              { key: "chest", label: "Chest" },
                              { key: "waist", label: "Waist" },
                              { key: "hip", label: "Hip" },
                              { key: "shoulder", label: "Shoulder" },
                              { key: "thigh", label: "Thigh" },
                              { key: "inseam", label: "Inseam" },
                              { key: "neck", label: "Neck" },
                              { key: "sleeveLength", label: "Sleeve Length" },
                              { key: "topLength", label: "Top Length" },
                              { key: "bottomLength", label: "Bottom Length" },
                            ].map((field) => (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">
                                  {field.label} ({displayUnit})
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.0"
                                  className="input-field text-xs text-slate-200 py-2.5 font-mono"
                                  value={measurementFormStrings[field.key] || ""}
                                  onChange={(e) =>
                                    handleMeasurementFieldChange(field.key, e.target.value)
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 border-t border-white/5 pt-4">
                            <button
                              onClick={handleSaveMeasurements}
                              className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer hover:shadow-lg active:scale-95"
                              disabled={saving}
                            >
                              {saving ? "Saving..." : `Save Measurement ${selectedMeasurementIndex + 1}`}
                            </button>
                          </div>
                        </div>

                        {/* Method 2: AI Body Scan Card (Coming Soon) */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col justify-between space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="w-10 h-10 rounded-xl bg-[#285A48]/20 border border-[#B0E4CC]/10 flex items-center justify-center text-[#B0E4CC]">
                                <Sparkles size={20} />
                              </div>
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                Coming Soon
                              </span>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                                AI Body Scan
                              </h3>
                              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                Automatically extract precise bust, waist, hip, shoulder, thigh, and inseam measurements using standard front & side silhouette photos.
                              </p>
                            </div>
                            <div className="border border-white/5 bg-black/40 rounded-xl p-3 text-[10px] text-slate-500 leading-normal flex items-start gap-2">
                              <CheckCircle2 size={13} className="text-[#B0E4CC] flex-shrink-0 mt-0.5" />
                              <span>AI 3D mesh measurement scanner under active calibration.</span>
                            </div>
                          </div>

                          <button
                            disabled
                            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 bg-white/5 border border-white/10 opacity-70 cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Sparkles size={14} className="text-slate-500" />
                            <span>Coming Soon</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card rounded-2xl p-16 text-center max-w-lg mx-auto flex flex-col items-center gap-4 border border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500">
                          <Ruler size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Customer Selected</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                            Please select a customer from the dropdown above to record, view, or update measurements.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Orders Tab */}
                {activeTab === "orders" && (
                  <motion.div
                    key="orders-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-300">
                        Active Stitching Queue ({orders.length} orders)
                      </div>
                      
                      <button
                        onClick={() => handleOpenAddOrder()}
                        className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        disabled={customers.length === 0}
                      >
                        <Plus size={14} /> Create Stitching Order
                      </button>
                    </div>

                    {/* Orders Table */}
                    <div className="glass-card rounded-2xl p-5 border border-white/5">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                              <th className="pb-3">Order ID</th>
                              <th className="pb-3">Customer</th>
                              <th className="pb-3">Garment</th>
                              <th className="pb-3">Fabric</th>
                              <th className="pb-3">Total</th>
                              <th className="pb-3">Paid</th>
                              <th className="pb-3">Balance</th>
                              <th className="pb-3">Delivery Date</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => (
                              <tr key={o.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                <td className="py-3.5 font-mono font-bold text-[#B0E4CC]">{o.id}</td>
                                <td className="py-3.5 font-semibold text-slate-100">{o.customerName}</td>
                                <td className="py-3.5 text-slate-300">{o.garmentType}</td>
                                <td className="py-3.5 text-slate-400 max-w-[120px] truncate" title={o.fabricDetails}>
                                  {o.fabricDetails || "—"}
                                </td>
                                <td className="py-3.5 text-slate-300 font-medium">₹{o.advanceAmount + o.remainingAmount}</td>
                                <td className="py-3.5 text-slate-300 font-medium">₹{o.advanceAmount}</td>
                                <td className="py-3.5 text-slate-300 font-medium">₹{o.remainingAmount}</td>
                                <td className="py-3.5 text-slate-500 font-semibold">{o.deliveryDate}</td>
                                <td className="py-3.5">
                                  <StatusBadge status={o.status} />
                                </td>
                                <td className="py-3.5 text-right space-x-2">
                                  <button
                                    onClick={() => handleOpenEditOrder(o)}
                                    className="text-slate-500 hover:text-slate-200 transition-colors inline-flex align-middle cursor-pointer"
                                    title="Edit Order"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrderClick(o)}
                                    className="text-slate-600 hover:text-rose-400 transition-colors inline-flex align-middle cursor-pointer"
                                    title="Delete Order"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {orders.length === 0 && (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                                  No stitching orders queued. Register a customer and click "Create Stitching Order" to start tracking.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

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
                inputMode="numeric"
                placeholder="e.g. 165"
                className="input-field text-xs py-2.5"
                value={customerForm.height}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d{0,3}$/.test(val)) {
                    setCustomerForm({ ...customerForm, height: val });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Weight (kg)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 60"
                className="input-field text-xs py-2.5"
                value={customerForm.weight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d{0,3}$/.test(val)) {
                    setCustomerForm({ ...customerForm, weight: val });
                  }
                }}
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
              {saving ? "Saving..." : (editCustomer ? "Save Changes" : "Register Customer")}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CUSTOMER PROFILE DETAILS */}
      <Modal
        isOpen={customerProfileOpen && selectedCustomerId !== null}
        onClose={() => setCustomerProfileOpen(false)}
        title="Customer Profile Details"
        size="lg"
      >
        {selectedCustomerId && (
          (() => {
            const customer = customers.find((c) => c.id === selectedCustomerId);
            const measurements = measurementsMap[selectedCustomerId];
            const customerOrders = orders.filter((o) => o.customerId === selectedCustomerId);

            if (!customer) return <p className="text-slate-500 text-xs">Customer profile not found.</p>;

            return (
              <div className="space-y-6 text-slate-200 text-xs">
                {/* Basic profile data grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Personal details */}
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
                      <div className="text-slate-500 font-semibold">Stature:</div>
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

                  {/* Right Column: Measurements details summary */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                      <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
                        <Ruler size={13} className="text-[#B0E4CC]" />
                        Stitching Specs
                      </div>
                      {measurements && (
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          Last scan: {measurements.updatedAt}
                        </span>
                      )}
                    </div>

                    {measurements ? (
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                        {[
                          { label: "Chest", val: measurements.chest || measurements.bust },
                          { label: "Waist", val: measurements.waist },
                          { label: "Hip", val: measurements.hip },
                          { label: "Shoulder", val: measurements.shoulder },
                          { label: "Thigh", val: measurements.thigh },
                          { label: "Inseam", val: measurements.inseam },
                          { label: "Neck", val: measurements.neck },
                          { label: "Sleeve Length", val: measurements.sleeveLength },
                          { label: "Top Length", val: measurements.topLength },
                          { label: "Bottom Length", val: measurements.bottomLength },
                        ].map((m) => (
                          <div key={m.label} className="flex justify-between border-b border-white/[0.02] pb-1">
                            <span className="text-slate-500 font-semibold">{m.label}:</span>
                            <span className="text-slate-200 font-mono">
                              {m.val ? (displayUnit === "cm" ? `${m.val} cm` : `${(m.val / 2.54).toFixed(1)}"`) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                        <p className="text-slate-500">No sizing measurements recorded yet.</p>
                        <button
                          onClick={() => {
                            handleSelectCustomer(customer.id);
                            setCustomerProfileOpen(false);
                            setActiveTab("measurements");
                          }}
                          className="text-xs font-bold text-[#B0E4CC] hover:underline cursor-pointer"
                        >
                          Record Measurements
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* stitching orders section */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 pb-2 mb-1">
                    <ShoppingBag size={13} className="text-[#B0E4CC]" />
                    Orders History ({customerOrders.length})
                  </div>
                  {customerOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[550px] text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 border-b border-white/5 font-bold uppercase text-[9px] tracking-wider">
                            <th className="pb-2">Order ID</th>
                            <th className="pb-2">Garment Type</th>
                            <th className="pb-2">Balance</th>
                            <th className="pb-2">Delivery Date</th>
                            <th className="pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.map((o) => (
                            <tr key={o.id} className="border-b border-white/[0.01]">
                              <td className="py-2.5 font-mono font-semibold text-[#B0E4CC]">{o.id}</td>
                              <td className="py-2.5 text-slate-300 font-bold">{o.garmentType}</td>
                              <td className="py-2.5 text-slate-300">₹{o.remainingAmount}</td>
                              <td className="py-2.5 text-slate-500">{o.deliveryDate}</td>
                              <td className="py-2.5 text-right">
                                <StatusBadge status={o.status} />
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
          })()
        )}
      </Modal>

      {/* MODAL: CREATE / EDIT STITCHING ORDER */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={editOrder ? `Edit Order ${editOrder.id}` : "Create New Stitching Order"}
        size="md"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div className="space-y-1">
            <label className="label-text">Select Customer</label>
            <select
              className="input-field text-xs py-2.5 cursor-pointer"
              value={orderForm.customerId}
              onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-text">Garment Type</label>
              <input
                type="text"
                placeholder="e.g. Salwar Kameez, Suit"
                className="input-field text-xs py-2.5"
                value={orderForm.garmentType}
                onChange={(e) => setOrderForm({ ...orderForm, garmentType: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Order Status</label>
              <select
                className="input-field text-xs py-2.5 cursor-pointer"
                value={orderForm.status}
                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as Order["status"] })}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Trial">Ready for Trial</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-text">Fabric & Pattern Details</label>
            <textarea
              placeholder="Chanderi Silk, Silk Blend, Blue floral print..."
              className="input-field text-xs py-2.5 min-h-[60px]"
              value={orderForm.fabricDetails}
              onChange={(e) => setOrderForm({ ...orderForm, fabricDetails: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="label-text">Total Price (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="2500"
                className="input-field text-xs py-2.5"
                value={orderForm.totalAmount}
                onChange={(e) => setOrderForm({ ...orderForm, totalAmount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Advance Paid (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1000"
                className="input-field text-xs py-2.5"
                value={orderForm.amountPaid}
                onChange={(e) => setOrderForm({ ...orderForm, amountPaid: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Delivery Date</label>
              <input
                type="date"
                className="input-field text-xs py-2.5 cursor-pointer"
                value={orderForm.deliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOrderModalOpen(false)}
              className="btn-ghost flex-1 py-2 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-2 text-xs font-semibold cursor-pointer"
              disabled={saving}
            >
              {saving ? "Saving..." : (editOrder ? "Save Changes" : "Create Order")}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmDeleteConfig !== null}
        onClose={() => setConfirmDeleteConfig(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Record Confirmation"
        message={`Are you sure you want to delete ${confirmDeleteConfig?.name}? This action cannot be undone.`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  let colorClass = "bg-[#285A48]/30 text-[#B0E4CC] border-[#B0E4CC]/30";
  if (status === "Pending") colorClass = "bg-amber-950/40 text-amber-300 border-amber-500/20";
  if (status === "Ready for Trial") colorClass = "bg-[#32715b]/40 text-emerald-200 border-[#B0E4CC]/40";
  if (status === "Delivered") colorClass = "bg-slate-800/40 text-slate-400 border-slate-700/20";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${colorClass}`}
    >
      {status}
    </span>
  );
}
