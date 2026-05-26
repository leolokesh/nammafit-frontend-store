"use client";

import { useState, FormEvent } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BASE_URL } from "@/lib/axios";
import Footer from "@/components/layout/Footer";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError("");
    setIsLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; non_field_errors?: string[] } };
        request?: unknown;
        message?: string;
      };

      let msg = "Invalid credentials. Please try again.";

      if (axiosErr.response) {
        msg =
          axiosErr.response.data?.detail ||
          axiosErr.response.data?.non_field_errors?.[0] ||
          msg;
      } else if (axiosErr.request) {
        const displayUrl = BASE_URL.replace(/\/api$/, "");
        msg = `Cannot reach the server. Make sure the API is running on ${displayUrl}`;
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-background">
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
        {/* Mesh grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(64,138,113,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,138,113,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Card wrapper */}
      <div className="flex-1 flex items-center justify-center py-12 relative z-10">
        <div className="relative w-full max-w-md mx-4 animate-slide-up">
          <div className="glass-card rounded-3xl p-8 shadow-2xl shadow-indigo-900/50">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-950/50 flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nammafit-login-logo.png"
                alt="NammaFit Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-sm text-slate-400 mt-3">Adaptive fit intelligence</p>
          </div>

          <h2 className="text-lg font-semibold text-slate-100 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in to your workspace</p>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-slide-up">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label-text">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="input-field"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label-text">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 h-11 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>

    <Footer className="relative z-10" />
  </div>
  );
}
