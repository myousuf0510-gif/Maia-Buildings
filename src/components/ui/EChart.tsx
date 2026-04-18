"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function EChart({
  option,
  style,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: Record<string, any>;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <ReactECharts
      option={option}
      style={style ?? { height: "100%", width: "100%" }}
      className={className}
      theme="dark"
      notMerge
      lazyUpdate
    />
  );
}
