"use client";

import React, { useState, useEffect } from "react";
import { BodyScan } from "@/components/scan/BodyScan";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import { customerApi, stitchingOrderApi } from "@/lib/api";
import {
  Ruler,
  Sparkles,
  RefreshCw,
  Users,
  ShoppingBag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard,
  Clock,
  User,
  Phone,
  FileText,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Customer Interface
interface Customer {
  id: string;
  name: string;
  phone: string;
  height: number; // cm
  weight: number; // kg
  notes: string;
  createdAt: string;
}

// Measurement Interface (All values in cm)
interface MeasurementState {
  bust: number;
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

type TabType = "dashboard" | "customers" | "measurements" | "orders";

// Mappers for backend integration
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
  bust: bm ? Number(bm.bust) || 0 : 0,
  waist: bm ? Number(bm.waist) || 0 : 0,
  hip: bm ? Number(bm.hip) || 0 : 0,
  shoulder: bm ? Number(bm.shoulder) || 0 : 0,
  thigh: bm ? Number(bm.thigh) || 0 : 0,
  inseam: bm ? Number(bm.inseam) || 0 : 0,
  neck: bm ? Number(bm.neck) || 0 : 0,
  sleeveLength: bm ? Number(bm.sleeve_length) || 0 : 0,
  topLength: bm ? Number(bm.top_length) || 0 : 0,
  bottomLength: bm ? Number(bm.bottom_length) || 0 : 0,
  updatedAt: bm && bm.updated_at ? bm.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
});

const mapMeasurementToBackend = (fm: Omit<MeasurementState, "updatedAt">): any => ({
  bust: fm.bust || 0,
  waist: fm.waist || 0,
  hip: fm.hip || 0,
  shoulder: fm.shoulder || 0,
  thigh: fm.thigh || 0,
  inseam: fm.inseam || 0,
  neck: fm.neck || 0,
  sleeve_length: fm.sleeveLength || 0,
  top_length: fm.topLength || 0,
  bottom_length: fm.bottomLength || 0,
});

const mapBackendToOrder = (bo: any): Order => ({
  id: bo.order_id || `ORD-${bo.id}`,
  dbId: bo.id,
  customerId: String(bo.customer),
  customerName: bo.customer_name || "Unknown Customer",
  garmentType: bo.garment_type,
  fabricDetails: bo.fabric_details || "",
  advanceAmount: Number(bo.advance_amount) || 0,
  remainingAmount: Number(bo.remaining_amount) || 0,
  deliveryDate: bo.delivery_date,
  status: bo.status,
  createdAt: bo.created_at ? bo.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
});

const mapOrderToBackend = (fo: Partial<Order> | any): any => {
  const paid = parseFloat(fo.amountPaid) || 0;
  const total = parseFloat(fo.totalAmount) || 0;
  const remaining = Math.max(0, total - paid);
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
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [pageState, setPageState] = useState<"ledger" | "scan">("ledger");
  const [displayUnit, setDisplayUnit] = useState<"cm" | "inch">("inch");

  // Core Ledger Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [measurementsMap, setMeasurementsMap] = useState<Record<string, MeasurementState>>({});
  const [orders, setOrders] = useState<Order[]>([]);

  // Search & Selection States
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial Data Loading
  const fetchLedgerData = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error("Error fetching ledger data from backend:", error);
      addToast("Failed to load digital ledger from server. Falling back to local cache.", "warning");
      
      // Fallback to local storage or mocks
      const savedCustomers = localStorage.getItem("nf_ledger_customers");
      const savedMeasurements = localStorage.getItem("nf_ledger_measurements");
      const savedOrders = localStorage.getItem("nf_ledger_orders");

      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      } else {
        const mockCustomers: Customer[] = [
          { id: "cust-1", name: "Priya Sharma", phone: "9876543210", height: 162, weight: 58, notes: "Prefers relaxed fits. Needs delivery before Diwali.", createdAt: "2026-06-15" },
          { id: "cust-2", name: "Anjali Gupta", phone: "9123456789", height: 158, weight: 64, notes: "Sleeve length must be exactly 15 inches.", createdAt: "2026-06-18" },
          { id: "cust-3", name: "Meera Nair", phone: "9988776655", height: 168, weight: 55, notes: "Wants boat neck design.", createdAt: "2026-06-20" }
        ];
        setCustomers(mockCustomers);
        localStorage.setItem("nf_ledger_customers", JSON.stringify(mockCustomers));
      }

      if (savedMeasurements) {
        setMeasurementsMap(JSON.parse(savedMeasurements));
      } else {
        const mockMeasurements: Record<string, MeasurementState> = {
          "cust-1": { bust: 91.5, waist: 76.0, hip: 98.0, shoulder: 37.5, thigh: 54.0, inseam: 71.0, neck: 34.0, sleeveLength: 36.0, topLength: 95.0, bottomLength: 98.0, updatedAt: "2026-06-15" },
          "cust-2": { bust: 96.0, waist: 82.0, hip: 104.0, shoulder: 39.0, thigh: 58.0, inseam: 68.5, neck: 36.0, sleeveLength: 38.0, topLength: 92.0, bottomLength: 94.0, updatedAt: "2026-06-18" }
        };
        setMeasurementsMap(mockMeasurements);
        localStorage.setItem("nf_ledger_measurements", JSON.stringify(mockMeasurements));
      }

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        const mockOrders: Order[] = [
          { id: "ORD-1001", dbId: 0, customerId: "cust-1", customerName: "Priya Sharma", garmentType: "Salwar Kameez", fabricDetails: "Chanderi Silk - Blue floral pattern", advanceAmount: 1000, remainingAmount: 1500, deliveryDate: "2026-06-30", status: "In Progress", createdAt: "2026-06-15" },
          { id: "ORD-1002", dbId: 0, customerId: "cust-2", customerName: "Anjali Gupta", garmentType: "Designer Blouse", fabricDetails: "Red Velvet with gold embroidery", advanceAmount: 500, remainingAmount: 800, deliveryDate: "2026-06-25", status: "Pending", createdAt: "2026-06-18" },
          { id: "ORD-1003", dbId: 0, customerId: "cust-3", customerName: "Meera Nair", garmentType: "Anarkali Suit", fabricDetails: "Georgette - Emerald green", advanceAmount: 2000, remainingAmount: 2500, deliveryDate: "2026-06-20", status: "Delivered", createdAt: "2026-06-12" }
        ];
        setOrders(mockOrders);
        localStorage.setItem("nf_ledger_orders", JSON.stringify(mockOrders));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
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

  // Customer Form Handlers
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
        
        // Sync customer name in active orders
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
      const errMsg = err.response?.data?.phone?.[0] || err.response?.data?.detail || err.message || "Failed to save customer";
      addToast(`Error: ${errMsg}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomerClick = (c: Customer) => {
    setConfirmDeleteConfig({ type: "customer", id: c.id, name: c.name });
  };

  // Measurement Tab Logic
  const handleSelectCustomer = (id: string, customUnit?: "cm" | "inch") => {
    setSelectedCustomerId(id);
    const activeUnit = customUnit || displayUnit;
    const saved = measurementsMap[id];
    const newFormStrings: Record<string, string> = {};
    const keys: (keyof Omit<MeasurementState, "updatedAt">)[] = [
      "bust", "waist", "hip", "shoulder", "thigh", "inseam", "neck", "sleeveLength", "topLength", "bottomLength"
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
    // Enforce max 5 digits before decimal and 3 digits after decimal
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

    const parsedFormCm: Omit<MeasurementState, "updatedAt"> = {
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
    };

    const keys: (keyof Omit<MeasurementState, "updatedAt">)[] = [
      "bust", "waist", "hip", "shoulder", "thigh", "inseam", "neck", "sleeveLength", "topLength", "bottomLength"
    ];

    keys.forEach((key) => {
      const valStr = measurementFormStrings[key];
      const valNum = parseFloat(valStr) || 0;
      parsedFormCm[key] = displayUnit === "inch" ? valNum * 2.54 : valNum;
    });
    
    setSaving(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (!customer) return;

      const backendMeasurements = mapMeasurementToBackend(parsedFormCm);
      const backendPayload = {
        name: customer.name,
        phone: customer.phone,
        height: customer.height,
        weight: customer.weight,
        notes: customer.notes,
        measurements: backendMeasurements,
      };

      const customerDbId = Number(selectedCustomerId);
      const res = await customerApi.update(customerDbId, backendPayload);
      const updatedCustomer = mapBackendToCustomer(res.data);

      const updatedCustomers = customers.map((c) =>
        c.id === selectedCustomerId ? updatedCustomer : c
      );
      syncCustomers(updatedCustomers);

      const updatedMap = {
        ...measurementsMap,
        [selectedCustomerId]: {
          ...parsedFormCm,
          updatedAt: new Date().toISOString().split("T")[0],
        },
      };
      syncMeasurements(updatedMap);
      addToast("Measurements saved successfully to the Digital Ledger.", "success");
    } catch (err: any) {
      console.error("Error saving measurements:", err);
      addToast("Failed to save measurements to the database.", "error");
    } finally {
      setSaving(false);
    }
  };

  // AI Scan complete callback
  const handleScanComplete = (extractedMeasurements?: any) => {
    if (extractedMeasurements && selectedCustomerId) {
      const parsedCm = {
        bust: extractedMeasurements.bust || 0,
        waist: extractedMeasurements.waist || 0,
        hip: extractedMeasurements.hip || 0,
        shoulder: extractedMeasurements.shoulder || 0,
        thigh: extractedMeasurements.thigh || 0,
        inseam: extractedMeasurements.inseam || 0,
        neck: 0,
        sleeveLength: 0,
        topLength: 0,
        bottomLength: 0,
      };
      
      const newFormStrings: Record<string, string> = { ...measurementFormStrings };
      const keys: (keyof Omit<MeasurementState, "updatedAt">)[] = [
        "bust", "waist", "hip", "shoulder", "thigh", "inseam"
      ];
      
      keys.forEach((key) => {
        const cmVal = parsedCm[key];
        if (cmVal > 0) {
          if (displayUnit === "cm") {
            newFormStrings[key] = String(Math.round(cmVal * 10) / 10);
          } else {
            newFormStrings[key] = String(Math.round((cmVal / 2.54) * 10) / 10);
          }
        }
      });
      
      setMeasurementFormStrings(newFormStrings);

      // Save predicted height & weight on customer record
      if (extractedMeasurements.height || extractedMeasurements.weight) {
        const updatedCusts = customers.map((c) => {
          if (c.id === selectedCustomerId) {
            return {
              ...c,
              height: extractedMeasurements.height ? Math.round(extractedMeasurements.height) : c.height,
              weight: extractedMeasurements.weight ? Math.round(extractedMeasurements.weight) : c.weight,
            };
          }
          return c;
        });
        syncCustomers(updatedCusts);
      }
      
      addToast("AI scan complete. Measurements auto-filled below! Please verify and save.", "success");
    } else {
      // Fallback predictions
      const fallbackStrings: Record<string, string> = { ...measurementFormStrings };
      const fallbacksCm = {
        bust: 92.7,
        waist: 73.7,
        hip: 100.3,
        shoulder: 38.1,
        thigh: 55.9,
        inseam: 72.4,
      };
      
      Object.entries(fallbacksCm).forEach(([key, cmVal]) => {
        if (displayUnit === "cm") {
          fallbackStrings[key] = String(Math.round(cmVal * 10) / 10);
        } else {
          fallbackStrings[key] = String(Math.round((cmVal / 2.54) * 10) / 10);
        }
      });
      
      setMeasurementFormStrings(fallbackStrings);
      addToast("Scan completed with fallback values. Please verify and save.", "info");
    }
    setPageState("ledger");
    setActiveTab("measurements");
  };

  // Stitching Order Handlers
  const handleOpenAddOrder = (customerId?: string) => {
    setEditOrder(null);
    setOrderForm({
      customerId: customerId || (customers[0]?.id ?? ""),
      garmentType: "",
      fabricDetails: "",
      totalAmount: "",
      amountPaid: "",
      deliveryDate: "",
      status: "Pending",
    });
    setOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: Order) => {
    setEditOrder(order);
    setOrderForm({
      customerId: order.customerId,
      garmentType: order.garmentType,
      fabricDetails: order.fabricDetails,
      totalAmount: String((order.advanceAmount || 0) + (order.remainingAmount || 0)),
      amountPaid: String(order.advanceAmount || 0),
      deliveryDate: order.deliveryDate,
      status: order.status,
    });
    setOrderModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerId || !orderForm.garmentType.trim() || !orderForm.deliveryDate) {
      addToast("Customer, Garment Type, and Delivery Date are required.", "warning");
      return;
    }

    setSaving(true);
    try {
      const matchedCustomer = customers.find((c) => c.id === orderForm.customerId);
      const customerName = matchedCustomer ? matchedCustomer.name : "Unknown Customer";

      const orderPayload = mapOrderToBackend(orderForm);

      if (editOrder && editOrder.dbId !== undefined) {
        const res = await stitchingOrderApi.update(editOrder.dbId, orderPayload);
        const updatedOrder = mapBackendToOrder(res.data);

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

  // General delete confirmation execution
  const handleConfirmDelete = async () => {
    if (!confirmDeleteConfig) return;
    const { type, id } = confirmDeleteConfig;

    try {
      if (type === "customer") {
        const customerDbId = Number(id);
        await customerApi.delete(customerDbId);

        const updated = customers.filter((c) => c.id !== id);
        syncCustomers(updated);

        // Delete associated measurements & orders
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

  // Computed stats for Dashboard summary cards
  const stats = {
    totalCustomers: customers.length,
    totalMeasurements: Object.keys(measurementsMap).length,
    ordersInProgress: orders.filter((o) => o.status !== "Delivered").length,
    ordersDelivered: orders.filter((o) => o.status === "Delivered").length,
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="ledger-loading-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"
          >
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full border-4 border-[#285A48]/20 border-t-[#B0E4CC] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#B0E4CC] uppercase tracking-wider animate-pulse">
                NF
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
              Syncing with Ledger...
            </div>
          </motion.div>
        )}

        {!loading && pageState === "scan" && (
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

        {!loading && pageState === "ledger" && (
          <motion.div
            key="ledger-dashboard-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Navigation Tab Bar */}
            <div className="flex flex-wrap gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-2xl w-fit max-w-full">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "customers", label: "Customers", icon: Users },
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
                {/* 1. Dashboard Tab */}
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard
                        label="Total Customers"
                        value={stats.totalCustomers}
                        icon={Users}
                        colorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/10"
                      />
                      <DashboardCard
                        label="Measurements"
                        value={stats.totalMeasurements}
                        icon={Ruler}
                        colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/10"
                      />
                      <DashboardCard
                        label="Active Orders"
                        value={stats.ordersInProgress}
                        icon={Clock}
                        colorClass="text-amber-400 bg-amber-500/10 border-amber-500/10"
                      />
                      <DashboardCard
                        label="Orders Delivered"
                        value={stats.ordersDelivered}
                        icon={CheckCircle2}
                        colorClass="text-purple-400 bg-purple-500/10 border-purple-500/10"
                      />
                    </div>

                    {/* Dual columns for Recents */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Customers */}
                      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-[#B0E4CC]" />
                            Recent Customers
                          </h3>
                          <button
                            onClick={() => setActiveTab("customers")}
                            className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-wider transition-colors cursor-pointer"
                          >
                            View All
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[500px] text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                <th className="pb-3">Name</th>
                                <th className="pb-3">Phone</th>
                                <th className="pb-3 text-right">Date Added</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customers.slice(-3).reverse().map((c) => (
                                <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                  <td className="py-3 font-semibold text-slate-200">{c.name}</td>
                                  <td className="py-3 text-slate-400">{c.phone}</td>
                                  <td className="py-3 text-right text-slate-500">{c.createdAt}</td>
                                </tr>
                              ))}
                              {customers.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="py-4 text-center text-slate-500">No customers registered yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingBag size={14} className="text-[#B0E4CC]" />
                            Stitching Queue
                          </h3>
                          <button
                            onClick={() => setActiveTab("orders")}
                            className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-wider transition-colors cursor-pointer"
                          >
                            View All
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px] text-left text-xs text-slate-300">
                            <thead>
                              <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                <th className="pb-3">Garment</th>
                                <th className="pb-3">Customer</th>
                                <th className="pb-3">Due Date</th>
                                <th className="pb-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(-3).reverse().map((o) => (
                                <tr key={o.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                  <td className="py-3 font-semibold text-slate-200">{o.garmentType}</td>
                                  <td className="py-3 text-slate-400">{o.customerName}</td>
                                  <td className="py-3 text-slate-500">{o.deliveryDate}</td>
                                  <td className="py-3 text-right">
                                    <StatusBadge status={o.status} />
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-4 text-center text-slate-500">No stitching orders queued.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. Customers Tab */}
                {activeTab === "customers" && (
                  <motion.div
                    key="customers-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="text"
                          placeholder="Search by customer name or phone..."
                          className="input-field pl-10 text-xs"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                      </div>
                      
                      <button
                        onClick={handleOpenAddCustomer}
                        className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Register Customer
                      </button>
                    </div>

                    {/* Customer Table */}
                    <div className="glass-card rounded-2xl p-5 border border-white/5">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                              <th className="pb-3">Name</th>
                              <th className="pb-3">Phone</th>
                              <th className="pb-3">Height</th>
                              <th className="pb-3">Weight</th>
                              <th className="pb-3">Measurements</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCustomers.map((c) => {
                              const hasMeas = !!measurementsMap[c.id];
                              return (
                                <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                  <td className="py-3.5">
                                    <button
                                      onClick={() => {
                                        setSelectedCustomerId(c.id);
                                        setCustomerProfileOpen(true);
                                      }}
                                      className="font-bold text-slate-100 hover:text-[#B0E4CC] transition-colors cursor-pointer text-left"
                                    >
                                      {c.name}
                                    </button>
                                  </td>
                                  <td className="py-3.5 text-slate-400">{c.phone}</td>
                                  <td className="py-3.5 text-slate-400">{c.height ? `${c.height} cm` : "—"}</td>
                                  <td className="py-3.5 text-slate-400">{c.weight ? `${c.weight} kg` : "—"}</td>
                                  <td className="py-3.5">
                                    {hasMeas ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/45 border border-emerald-500/20">
                                        Recorded
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/40 border border-slate-700/20">
                                        Missing
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 text-right space-x-3">
                                    <button
                                      onClick={() => {
                                        handleSelectCustomer(c.id);
                                        setActiveTab("measurements");
                                      }}
                                      className="text-[10px] uppercase font-bold text-[#B0E4CC] hover:text-white transition-colors cursor-pointer"
                                    >
                                      Measure
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditCustomer(c)}
                                      className="text-slate-500 hover:text-slate-200 transition-colors inline-flex align-middle cursor-pointer"
                                      title="Edit Info"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCustomerClick(c)}
                                      className="text-slate-600 hover:text-rose-400 transition-colors inline-flex align-middle cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredCustomers.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                                  No customers match your search criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. Measurements Tab */}
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
                              Edit manual boutique specifications directly. Final values are mapped automatically.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                              { key: "bust", label: "Bust" },
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
                              {saving ? "Saving..." : "Save Measurement"}
                            </button>
                            {measurementsMap[selectedCustomerId] && (
                              <button
                                onClick={handleSaveMeasurements}
                                className="btn-ghost py-2.5 px-6 text-xs font-semibold cursor-pointer border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 text-[#B0E4CC]"
                                disabled={saving}
                              >
                                {saving ? "Updating..." : "Update Measurement"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Method 2: AI Body Scan Card */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col justify-between space-y-6">
                          <div className="space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-[#285A48]/20 border border-[#B0E4CC]/10 flex items-center justify-center text-[#B0E4CC]">
                              <Sparkles size={20} className="animate-pulse" />
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
                              <span>Predicted measurements can be corrected manually after scan. final results save directly to the Ledger.</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setPageState("scan")}
                            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#285A48] to-[#1d4335] border border-[#B0E4CC]/20 hover:border-[#B0E4CC]/40 hover:from-[#32715b] hover:to-[#285A48] hover:shadow-lg hover:shadow-[#B0E4CC]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#285A48]/10"
                          >
                            <Sparkles size={14} className="animate-pulse text-[#B0E4CC]" />
                            <span>Scan Body with AI</span>
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

                {/* 4. Orders Tab */}
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
                      {/* Search */}
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
      </AnimatePresence>

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
                          { label: "Bust", val: measurements.bust },
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
                    <p className="text-slate-500 italic py-2">No stitching orders recorded for this customer.</p>
                  )}
                </div>

                {/* Footer Buttons inside Profile details */}
                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setCustomerProfileOpen(false);
                      handleOpenAddOrder(customer.id);
                    }}
                    className="btn-ghost text-xs px-4 py-2 hover:border-[#B0E4CC]/20 hover:text-white cursor-pointer"
                  >
                    Create Stitching Order
                  </button>
                  
                  <button
                    onClick={() => {
                      handleSelectCustomer(customer.id);
                      setCustomerProfileOpen(false);
                      setActiveTab("measurements");
                    }}
                    className="btn-primary text-xs px-4 py-2 cursor-pointer"
                  >
                    Update Sizing Specs
                  </button>
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
        title={editOrder ? `Edit Stitching Order ${editOrder.id}` : "Create Stitching Order"}
        size="md"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div className="space-y-1">
            <label className="label-text">Customer Profile</label>
            <select
              className="input-field text-xs py-2.5 cursor-pointer"
              value={orderForm.customerId}
              onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
              required
              disabled={!!editOrder} // Cannot change customer of order once created
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label-text">Garment Type</label>
            <input
              type="text"
              placeholder="e.g. Kurtis, Blouse, Anarkali Suit"
              className="input-field text-xs py-2.5"
              value={orderForm.garmentType}
              onChange={(e) => setOrderForm({ ...orderForm, garmentType: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="label-text">Fabric Details</label>
            <textarea
              placeholder="Fabric colour, designer labels, buttons structure, neck styling guidelines..."
              className="input-field text-xs py-2.5 min-h-[80px] resize-y"
              value={orderForm.fabricDetails}
              onChange={(e) => setOrderForm({ ...orderForm, fabricDetails: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-text">Total Amount (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1500"
                className="input-field text-xs py-2.5 font-mono"
                value={orderForm.totalAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d{0,7}(\.\d{0,2})?$/.test(val)) {
                    setOrderForm({ ...orderForm, totalAmount: val });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Amount Paid (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 500"
                className="input-field text-xs py-2.5 font-mono"
                value={orderForm.amountPaid}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d{0,7}(\.\d{0,2})?$/.test(val)) {
                    setOrderForm({ ...orderForm, amountPaid: val });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-text">Delivery Date</label>
              <input
                type="date"
                className="input-field text-xs py-2.5 font-mono"
                value={orderForm.deliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Stitching Status</label>
              <select
                className="input-field text-xs py-2.5 cursor-pointer"
                value={orderForm.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as Order["status"];
                  setOrderForm({ ...orderForm, status: nextStatus });
                  if (nextStatus === "Delivered") {
                    const total = parseFloat(orderForm.totalAmount) || 0;
                    const paid = parseFloat(orderForm.amountPaid) || 0;
                    if (paid < total) {
                      addToast(
                        `Customer has pending payment of ₹${(total - paid).toFixed(2)}`,
                        "warning"
                      );
                    }
                  }
                }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Trial">Ready for Trial</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {orderForm.status === "Delivered" && (parseFloat(orderForm.totalAmount) || 0) - (parseFloat(orderForm.amountPaid) || 0) > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] p-2.5 rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                Customer has pending payment of ₹{((parseFloat(orderForm.totalAmount) || 0) - (parseFloat(orderForm.amountPaid) || 0)).toFixed(2)}
              </div>
            </div>
          )}

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
              {saving ? "Saving..." : (editOrder ? "Save Changes" : "Create stitching Order")}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmModal
        isOpen={confirmDeleteConfig !== null}
        onClose={() => setConfirmDeleteConfig(null)}
        onConfirm={handleConfirmDelete}
        title={confirmDeleteConfig?.type === "customer" ? "Delete Customer Profile" : "Delete Stitching Order"}
        message={
          confirmDeleteConfig?.type === "customer"
            ? `Are you sure you want to permanently delete the profile of "${confirmDeleteConfig.name}"? This will delete all their measurements and stitching queue history. This action is irreversible.`
            : `Are you sure you want to delete ${confirmDeleteConfig?.name}? This stitching queue entry will be permanently deleted.`
        }
      />
    </div>
  );
}

// Subcomponent: Dashboard Summary Cards
function DashboardCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: any;
  colorClass: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
      <div className="space-y-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-2xl md:text-3xl font-light text-slate-100 font-mono tracking-tight block">
          {value}
        </span>
      </div>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

// Subcomponent: Stitching Order status badges
function StatusBadge({ status }: { status: Order["status"] }) {
  const badgeMap = {
    Pending: "text-slate-400 bg-slate-800/40 border border-slate-700/20",
    "In Progress": "text-amber-400 bg-amber-950/40 border border-amber-500/10",
    "Ready for Trial": "text-indigo-400 bg-indigo-950/40 border border-indigo-500/10",
    Delivered: "text-emerald-400 bg-emerald-950/40 border border-emerald-500/10",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeMap[status]}`}>
      {status}
    </span>
  );
}
