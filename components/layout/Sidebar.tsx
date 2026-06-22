"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Ruler,
  Layers,
  LogOut,
  Scan,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/sizing", icon: Ruler, label: "Sizing" },
  { href: "/fabrics", icon: Layers, label: "Fabrics" },
  { href: "/digital-ledger", icon: Scan, label: "Digital Ledger" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  useEffect(() => {
    closeMobile();
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-25 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-[100dvh] z-30 flex flex-col border-r border-[#B0E4CC]/10 bg-[#091413] transition-all duration-300 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } w-64 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* ── Logo ─────────────────────────────────────────────────────────────── */}
        <div className={`py-5 border-b border-white/10 flex ${isCollapsed ? "md:justify-center md:px-3" : "px-5"} px-5`}>
          {isCollapsed ? (
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-lg shadow-black/40 flex-shrink-0 overflow-hidden p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nammafit-mark-white.png"
                alt="NammaFit"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center h-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nammafit-logo-white.png"
                alt="NammaFit"
                className="h-8 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? "md:justify-center md:p-2.5" : "gap-3 px-3 py-2.5"
                } gap-3 px-3 py-2.5 ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
                title={label}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive
                      ? "text-[#B0E4CC]"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span className={isCollapsed ? "md:hidden block" : "block"}>{label}</span>
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B0E4CC]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────────────────────────────── */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className={`${isCollapsed ? "md:hidden block" : "block"}`}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">
                  {user?.username ?? "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {isCollapsed && (
            <div className="hidden md:flex flex-col items-center gap-4">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71] flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                title={user?.username ?? "User"}
              >
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
