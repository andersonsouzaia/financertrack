export const CHART_COLORS = [
  "#2563eb", // primary blue
  "#14b8a6", // teal
  "#f97316", // orange
  "#8b5cf6", // purple
  "#f43f5e", // rose
  "#22c55e", // green
  "#0ea5e9", // sky
  "#a855f7", // violet
];

export function getChartColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

