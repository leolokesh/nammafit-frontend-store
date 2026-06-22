"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, User, Lock, LogOut, Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useToastContext } from "@/contexts/ToastContext";
import { userApi } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";
import Modal from "@/components/ui/Modal";

const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Product Catalog",
  "/sizing": "Sizing Matrix",
  "/fabrics": "Fabric Library",
  "/fits": "Fit Settings",
  "/digital-ledger": "Digital Ledger",
};

export default function TopBar() {
  const pathname = usePathname();
  const { user, setUser, logout } = useAuth();
  const { toggleSidebar, toggleMobile } = useSidebar();
  const { addToast } = useToastContext();

  const label = pageLabels[pathname] ?? "NammaFit";

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Edit profile state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    company_name: "",
    website: "",
    phone_number: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Change password state
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [pwLoading, setPwLoading] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleMobile();
    } else {
      toggleSidebar();
    }
  };

  const handleOpenDrawer = () => {
    setEditForm({
      email: user?.email ?? "",
      company_name: user?.company_name ?? "",
      website: user?.website ?? "",
      phone_number: user?.phone_number ?? "",
    });
    setDrawerOpen(true);
    setDropdownOpen(false);
  };

  const handleOpenPasswordModal = () => {
    setPwForm({
      old_password: "",
      new_password: "",
      new_password_confirm: "",
    });
    setPwModalOpen(true);
    setDropdownOpen(false);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { data } = await userApi.updateMe(editForm);
      setUser(data);
      localStorage.setItem("nf_user", JSON.stringify(data));
      addToast("Profile updated successfully!", "success");
      setDrawerOpen(false);
    } catch {
      addToast("Failed to update profile. Please try again.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      addToast("New passwords do not match.", "error");
      return;
    }
    setPwLoading(true);
    try {
      await userApi.changePassword(pwForm);
      addToast("Password changed successfully!", "success");
      setPwModalOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      addToast(e.response?.data?.detail ?? "Failed to change password.", "error");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[#B0E4CC]/10 bg-[#091413] relative">
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar Button */}
        <button
          onClick={handleToggle}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-100">{label}</h1>
          <p className="text-xs text-slate-500 -mt-0.5">
            {user?.company_name ? `${user.company_name}` : "NammaFit Platform"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-50" ref={dropdownRef}>
        {/* User Profile Trigger Button */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          title="Profile Options"
        >
          {user?.username?.charAt(0).toUpperCase() ?? "U"}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            className="absolute right-0 top-11 w-48 rounded-xl border border-[#B0E4CC]/15 shadow-xl py-1.5 z-50 animate-fade-in text-left bg-[#0c1a18] opacity-100"
            style={{ backgroundColor: "#0c1a18", opacity: 1 }}
          >
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-xs text-slate-400 font-semibold truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            
            <button
              onClick={handleOpenDrawer}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Pencil size={13} className="text-slate-500" />
              <span>Edit Profile</span>
            </button>
            
            <button
              onClick={handleOpenPasswordModal}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Lock size={13} className="text-slate-500" />
              <span>Change Password</span>
            </button>
            
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border-t border-white/5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <label className="label-text">Email Address</label>
            <input
              className="input-field"
              type="email"
              placeholder="rajeshvarancr@gmail.com"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-text">Company Name</label>
            <input
              className="input-field"
              placeholder="Acme Fashion Co."
              value={editForm.company_name}
              onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Website</label>
            <input
              className="input-field"
              type="url"
              placeholder="https://yourbrand.com"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Phone Number</label>
            <input
              className="input-field"
              type="tel"
              placeholder="+91 98765 43210"
              value={editForm.phone_number}
              onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
            />
          </div>

          <p className="text-xs text-[#B0E4CC]/85 bg-[#285A48]/10 border border-[#B0E4CC]/15 rounded-xl px-3 py-2.5">
            💡 The QR code on your profile will auto-update to point to your website URL once saved.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={editLoading} className="btn-primary flex-1">
              {editLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Drawer>

      {/* ── Change Password Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        title="Change Password"
        size="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label-text">Current Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={pwForm.old_password}
              onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-text">New Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-text">Confirm New Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={pwForm.new_password_confirm}
              onChange={(e) => setPwForm({ ...pwForm, new_password_confirm: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPwModalOpen(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={pwLoading} className="btn-primary flex-1">
              {pwLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
