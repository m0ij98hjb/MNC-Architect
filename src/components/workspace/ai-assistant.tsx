"use client";

import { useRef, useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function AiAssistant({ brief, report }: { brief: ProjectBrief; report?: ArchitectReport }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = ["قلّل التكلفة", "زد عدد الشقق", "اجعل التصميم أفخم", "غيّر الطراز إلى نيوكلاسيك", "أعد حساب العائد"];

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, brief, report }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "—" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "تعذّر الاتصال بالمساعد." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <div className="mnc-card flex h-[560px] flex-col p-0">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-4" />
        </span>
        <h3 className="text-sm font-semibold">{t.workspace.assistant}</h3>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              اطلب أي تعديل على الدراسة وسيُعيد المساعد الحساب مع الحفاظ على بيانات المشروع:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
            <span
              className={cn(
                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary",
              )}
            >
              {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {t.workspace.generating}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={t.workspace.askPlaceholder}
            className="max-h-28 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label={t.workspace.send}
          >
            <Send className="size-4 flip-on-rtl" />
          </button>
        </div>
      </div>
    </div>
  );
}
