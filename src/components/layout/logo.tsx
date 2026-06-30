import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="mnc-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E2C879" />
            <stop offset="0.5" stopColor="#C9A24B" />
            <stop offset="1" stopColor="#9C7A30" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="37" height="37" rx="9" className="fill-secondary" />
        <rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="none" stroke="url(#mnc-gold)" strokeWidth="1.2" />
        {/* stylized M + tower */}
        <path d="M11 28V14l4.5 5 4.5-5v14" fill="none" stroke="url(#mnc-gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M25 28V16h5v12" fill="none" stroke="url(#mnc-gold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="27.5" y1="20" x2="27.5" y2="20.01" stroke="url(#mnc-gold)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {withText && (
        <div className="leading-none">
          <div className="text-gold-gradient font-display text-[17px] font-bold tracking-wide">MNC</div>
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground">ARCHITECT AI</div>
        </div>
      )}
    </div>
  );
}
