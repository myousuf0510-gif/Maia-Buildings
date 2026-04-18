"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "purple" | "green" | "amber" | "red" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  blue:    "bg-primary-50 text-primary-700",
  purple:  "bg-accent-50 text-accent-700",
  green:   "bg-green-50 text-green-700",
  amber:   "bg-amber-50 text-amber-700",
  red:     "bg-red-50 text-red-700",
  neutral: "bg-surface-100 text-surface-600",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      variantMap[variant],
      className
    )}>
      {children}
    </span>
  );
}
