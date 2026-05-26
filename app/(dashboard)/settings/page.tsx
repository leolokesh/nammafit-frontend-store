"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { BASE_URL } from "@/lib/axios";

const settingGroups: Array<{
  title: string;
  items: Array<{
    icon: React.ElementType;
    label: string;
    description: string;
    href: string;
    external: boolean;
    disabled?: boolean;
  }>;
}> = [
  {
    title: "Account",
    items: [
      {
        icon: User,
        label: "Profile & Account",
        description: "Update your name, company info, and contact details",
        href: "/dashboard",
        external: false,
        disabled: false,
      },
      {
        icon: Shield,
        label: "Security",
        description: "Change password and manage authentication settings",
        href: "/dashboard",
        external: false,
        disabled: false,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: Palette,
        label: "Appearance",
        description: "Dark mode is always active — NammaFit looks best in the dark",
        href: "#",
        external: false,
        disabled: true,
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Manage email and in-app notification preferences",
        href: "#",
        external: false,
        disabled: true,
      },
      {
        icon: Globe,
        label: "Locale & Units",
        description: "Set default measurement units and language",
        href: "#",
        external: false,
        disabled: true,
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="page-container py-8 space-y-8">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your account, preferences, and platform configuration
        </p>
      </div>

      {/* API info card */}
      <div className="glass-card rounded-2xl p-5 flex items-start gap-4 border-indigo-500/20">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
          <Globe size={20} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 mb-0.5">API Endpoint</p>
          <p className="text-xs text-slate-500 font-mono">
            {BASE_URL}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Axios interceptors handle JWT refresh automatically.
          </p>
        </div>
      </div>

      {/* Settings groups */}
      <div className="space-y-6">
        {settingGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              {group.title}
            </h2>
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
              {group.items.map(({ icon: Icon, label, description, href, external, disabled }) => {
                const content = (
                  <div
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                      disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-white/3 cursor-pointer"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                    </div>
                    {!disabled && (
                      external ? (
                        <ExternalLink size={15} className="text-slate-600" />
                      ) : (
                        <ChevronRight size={15} className="text-slate-600" />
                      )
                    )}
                    {disabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-600 border border-white/5">
                        Soon
                      </span>
                    )}
                  </div>
                );

                return disabled ? (
                  <div key={label}>{content}</div>
                ) : (
                  <Link key={label} href={href}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-700 pt-4">
        NammaFit Platform v1.0 · © {new Date().getFullYear()}
      </p>
    </div>
  );
}
