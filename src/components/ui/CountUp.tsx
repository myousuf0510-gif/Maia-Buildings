"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({ end, duration = 1400, prefix = "", suffix = "", decimals = 0, className = "" }: Props) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const t0 = useRef<number | null>(null);

  useEffect(() => {
    t0.current = null;
    const tick = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * end);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [end, duration]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span className={`num-enter ${className}`}>{prefix}{display}{suffix}</span>;
}
