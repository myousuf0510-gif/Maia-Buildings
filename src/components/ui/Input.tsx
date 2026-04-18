"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm",
              "placeholder:text-surface-400 text-surface-900",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-50",
              error && "border-red-400 focus:ring-red-500 focus:border-red-500",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
