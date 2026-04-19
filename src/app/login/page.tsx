"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus,  setPassFocus]  = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/overview");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "#F4F5F7" }}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #D4D6DA 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md mx-6 animate-scale-in">
        <div
          className="rounded-3xl p-8"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.10)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6 pt-5">
            <Image
              src="/maia-logo.jpg"
              alt="MAIA Intelligence"
              width={320}
              height={96}
              priority
              className="h-auto w-auto max-w-[272px] opacity-[0.98]"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] tracking-wider uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="reemyousuf1012@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200"
                style={{
                  background: emailFocus ? "#EFF6FF" : "#F4F5F7",
                  border: `1px solid ${emailFocus ? "#2563EB" : error ? "rgba(239,68,68,0.5)" : "rgba(0,0,0,0.08)"}`,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] tracking-wider uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200"
                  style={{
                    background: passFocus ? "#EFF6FF" : "#F4F5F7",
                    border: `1px solid ${passFocus ? "#2563EB" : error ? "rgba(239,68,68,0.5)" : "rgba(0,0,0,0.08)"}`,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#DC2626",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Secured with enterprise-grade encryption</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2"
              style={{
                background: loading
                  ? "rgba(31,41,55,0.55)"
                  : "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
                boxShadow: loading ? "none" : "0 6px 18px rgba(15,23,42,0.22)",
                letterSpacing: "0.06em",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to MAIA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Badges */}
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "AI-Powered", color: "#2563EB" },
              { label: "Enterprise Grade", color: "#7C3AED" },
              { label: "Real-Time Intelligence", color: "#0891B2" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px] font-semibold tracking-wide" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="mt-5 pt-4 flex flex-col items-center gap-2"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="text-xs text-[#6B7280] text-center">
              Request access to get your credentials
            </p>
            <button className="text-xs font-medium text-[#94A3B8] hover:text-[#2563EB] transition-colors">
              Request Access →
            </button>
            <p className="text-[9px] font-medium text-[#94A3B8] text-center tracking-wide uppercase">
              MAIA Intelligence Platform v3.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
