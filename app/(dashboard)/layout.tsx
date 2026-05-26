"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 w-[500px] h-[400px] bg-indigo-900/8 rounded-full blur-3xl transition-all duration-300 ${
          isCollapsed ? "left-20" : "left-64"
        }`} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-900/8 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        isCollapsed ? "md:ml-20" : "md:ml-64"
      } ml-0`}>
        <TopBar />
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Loader2 size={24} className="text-white animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Loading NammaFit…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
