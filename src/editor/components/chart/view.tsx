import { barY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";

export interface ChartRow {
  label: string;
  value: number;
}

export const DEMO_DATA: ChartRow[] = [
  { label: "一月", value: 32 },
  { label: "二月", value: 56 },
  { label: "三月", value: 41 },
  { label: "四月", value: 78 },
  { label: "五月", value: 63 },
  { label: "六月", value: 92 },
];

function parseData(raw: any): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch {
      // 非法 JSON 时退回示例数据
    }
  }

  return DEMO_DATA;
}

interface ChartViewProps {
  chartType?: string;
  data?: any;
  xKey?: string;
  yKey?: string;
  height?: number;
}

export function ChartView({
  chartType = "bar",
  data,
  xKey = "label",
  yKey = "value",
  height = 260,
}: ChartViewProps) {
  const rows = useMemo(() => {
    return parseData(data).map((item, index) => ({
      label: String(item?.[xKey] ?? index + 1),
      value: Number(item?.[yKey] ?? 0),
    }));
  }, [data, xKey, yKey]);

  const definition = useMemo(() => {
    return defineChart({
      marks:
        chartType === "line"
          ? [lineY(rows, { x: "label", y: "value" })]
          : [barY(rows, { x: "label", y: "value" })],
      scales: {
        x: {
          scale: () => scaleBand().padding(0.2),
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
        },
      },
      svgAnimation: true,
    });
  }, [rows, chartType]);

  return <Chart definition={definition} height={height} ariaLabel="数据图表" />;
}
