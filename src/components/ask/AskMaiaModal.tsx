"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  X,
  ArrowUp,
  Loader2,
  Zap,
  Database,
  FlaskConical,
} from "lucide-react";
import { createPortal } from "react-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "claude" | "demo";
  ts: number;
}

const SUGGESTED: { icon: string; label: string; question: string }[] = [
  { icon: "🩺", label: "Who's at risk of calling in sick tomorrow?", question: "Who's at risk of calling in sick tomorrow?" },
  { icon: "⚡", label: "What's the Martinez situation?", question: "What's the Martinez situation? Give me the fatigue story and what MAIA proposed." },
  { icon: "💵", label: "How's our OT spend vs peers?", question: "How does our overtime spend compare to peers in aviation?" },
  { icon: "📅", label: "Sunday 06:00 coverage — options?", question: "We have uncovered Sunday 06:00 shifts in Ground Ops. What options do I have?" },
  { icon: "🛡️", label: "Walk me through current compliance risks", question: "Walk me through our current compliance risks across all jurisdictions." },
  { icon: "🤖", label: "What are my MAIA agents doing right now?", question: "Summarize what my MAIA agents are currently doing and what's pending." },
];

export function AskMaiaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    // Focus input on open
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open]);

  // Scroll to bottom when new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ask-maia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        const asstMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer ?? data.error ?? "No response.",
          source: data.source,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, asstMsg]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `Couldn't reach the assistant. (${(e as Error).message})`,
            source: "demo",
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[8vh] pb-4"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(37,99,235,0.08) 0%, rgba(15,23,42,0.35) 45%, rgba(15,23,42,0.7) 100%)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[720px] max-h-[82vh] flex flex-col overflow-hidden animate-fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(37,99,235,0.18)",
          borderRadius: "18px",
          boxShadow:
            "0 30px 80px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 0 40px rgba(37,99,235,0.08)",
        }}
      >
        {/* Header */}
        <div className="relative px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] font-bold text-slate-900 tracking-tight">
                Ask MAIA
              </h2>
              <span className="badge badge-blue text-[9px]">BETA</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Your intelligence layer. Ask anything about your workforce.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg grid place-items-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(37,99,235,0.03) 0%, transparent 70%)",
          }}
        >
          {messages.length === 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Try asking
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => send(s.question)}
                    className="text-left px-3 py-2.5 rounded-xl transition-all group"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(124,58,237,0.03) 100%)",
                      border: "1px solid rgba(37,99,235,0.1)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[15px] shrink-0">{s.icon}</span>
                      <span className="text-[12.5px] text-slate-700 font-medium leading-snug group-hover:text-blue-700 transition-colors">
                        {s.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.14)" }}>
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 uppercase tracking-[0.14em] mb-1">
                  <Database className="w-3 h-3" /> Live context
                </div>
                <div className="text-[11.5px] text-slate-600 leading-relaxed">
                  MAIA reads from your live Supabase: agent decisions, staff fatigue scores, pending approvals, cost ledger, and labour-law state. Every answer cites the numbers it's seeing right now.
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}

          {loading && (
            <div className="flex gap-3 items-start">
              <div
                className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                }}
              >
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div
                className="px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-[12.5px] text-slate-600"
                style={{
                  background: "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.12)",
                  borderTopLeftRadius: 6,
                }}
              >
                <span className="font-medium">Scanning live data</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "400ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white">
          <div
            className="flex items-end gap-2 rounded-2xl px-3.5 py-2.5 transition-colors focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
            style={{
              background: "#FAFBFC",
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-2" />
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask anything about your workforce…"
              className="flex-1 bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-all"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)"
                  : "rgba(15,23,42,0.06)",
                color: input.trim() ? "#FFFFFF" : "#94A3B8",
                boxShadow: input.trim()
                  ? "0 2px 8px rgba(37,99,235,0.3)"
                  : undefined,
                cursor: input.trim() && !loading ? "pointer" : "default",
              }}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                Enter
              </kbd>
              <span>send</span>
              <span className="text-slate-300">·</span>
              <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                Esc
              </kbd>
              <span>close</span>
              <span className="text-slate-300">·</span>
              <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                Shift+Enter
              </kbd>
              <span>new line</span>
            </div>
            <div className="text-[9.5px] text-slate-400 font-medium">
              Reasoning with live Supabase + labour-law engine
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Message({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="w-7 h-7 rounded-lg grid place-items-center shrink-0 text-[10px] font-bold"
        style={
          isUser
            ? {
                background: "#FFFFFF",
                color: "#475569",
                border: "1px solid rgba(15,23,42,0.08)",
              }
            : {
                background:
                  "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                color: "#FFFFFF",
              }
        }
      >
        {isUser ? "YOU" : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      <div className="max-w-[540px]">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
            isUser ? "text-white" : "text-slate-800"
          }`}
          style={
            isUser
              ? {
                  background:
                    "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                  borderTopRightRadius: 6,
                }
              : {
                  background: "#FFFFFF",
                  border: "1px solid rgba(37,99,235,0.12)",
                  borderTopLeftRadius: 6,
                  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                }
          }
        >
          {msg.content.split("\n\n").map((p, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {p.split("\n").map((line, li) => (
                <span key={li}>
                  {line}
                  {li < p.split("\n").length - 1 && <br />}
                </span>
              ))}
            </p>
          ))}
        </div>

        {!isUser && msg.source && (
          <div className="mt-1 flex items-center gap-1.5 px-1">
            {msg.source === "claude" ? (
              <>
                <Zap className="w-2.5 h-2.5 text-emerald-600" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Claude · live reasoning
                </span>
              </>
            ) : (
              <>
                <FlaskConical className="w-2.5 h-2.5 text-slate-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Demo mode · add ANTHROPIC_API_KEY for live Claude
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
