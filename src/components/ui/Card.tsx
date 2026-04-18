"use client";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

export function Card({ className, style, children, hover = false, padding = "md" }: CardProps) {
  return (
    <div style={style} className={cn(
      "bg-white rounded-xl border border-surface-200 shadow-card",
      hover && "transition-shadow duration-200 hover:shadow-card-hover cursor-pointer",
      paddingMap[padding],
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn("text-sm font-semibold text-surface-700", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
