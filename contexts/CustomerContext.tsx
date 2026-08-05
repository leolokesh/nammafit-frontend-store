"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { customerApi } from "@/lib/api";
import type { Customer } from "@/types";

interface CustomerContextType {
  selectedCustomerId: string;
  selectedCustomer: Customer | null;
  selectCustomer: (id: string) => void;
  customers: Customer[];
  refreshCustomers: () => Promise<void>;
  loadingCustomers: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEY = "nammafit_selected_customer_id";

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);

  // 1. Initial Load of Customers from Database
  const refreshCustomers = async () => {
    try {
      const { data } = await customerApi.list();
      setCustomers(data);

      const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (savedId && data.some((c) => String(c.id) === savedId)) {
        setSelectedCustomerId(savedId);
        const found = data.find((c) => String(c.id) === savedId) || null;
        setSelectedCustomer(found);
      } else if (data.length > 0 && !savedId) {
        const defaultId = String(data[0].id);
        setSelectedCustomerId(defaultId);
        setSelectedCustomer(data[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, defaultId);
        }
      }
    } catch (err) {
      console.warn("Error loading customer list into CustomerContext:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  // 2. Update selected customer across all 3 AI pages
  const selectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (id) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, id);
      }
      const found = customers.find((c) => String(c.id) === id) || null;
      setSelectedCustomer(found);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setSelectedCustomer(null);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        selectedCustomerId,
        selectedCustomer,
        selectCustomer,
        customers,
        refreshCustomers,
        loadingCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomerContext() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomerContext must be used within a CustomerProvider");
  }
  return context;
}
