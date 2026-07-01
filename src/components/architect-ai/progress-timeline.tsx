"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function ProgressTimeline({ currentStep }: { currentStep: number }) {
  const { t } = useI18n();
  const steps = t.architectAi.steps;

  return (
    <div className="mx-auto max-w-lg space-y-3 py-4">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="flex items-center gap-3"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center">
              {done ? (
                <CheckCircle2 className="size-6 text-emerald-500" />
              ) : active ? (
                <Loader2 className="size-6 animate-spin text-primary" />
              ) : (
                <Circle className="size-6 text-border" />
              )}
              {i < steps.length - 1 && (
                <span
                  className="absolute start-1/2 top-full mt-0.5 h-3 w-px -translate-x-1/2"
                  style={{ background: done ? "rgb(16 185 129)" : "hsl(var(--border))" }}
                />
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                done ? "text-emerald-500" : active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
