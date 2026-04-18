"use client";

import { useId, useMemo } from "react";

export function Sparkline({
  data,
  color = "#2563EB",
  width = 110,
  height = 32,
  strokeWidth = 1.5,
  fill = true,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}) {
  const id = useId();
  const { path, area } = useMemo(() => buildPath(data, width, height), [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function buildPath(data: number[], w: number, h: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1e-6, max - min);
  const pad = 2;
  const usableH = h - pad * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * usableH;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const area = `${path} L${w.toFixed(2)},${h} L0,${h} Z`;

  return { path, area };
}
