import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/assets/logo-navbar.png"
        alt="MNC Architect AI"
        width={160}
        height={48}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  );
}
