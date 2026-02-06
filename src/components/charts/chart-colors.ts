export const CHART_COLORS = [
  "#047857", // emerald-700 (primary dark)
  "#059669", // emerald-600 (primary medium)
  "#10b981", // emerald-500 (primary light)
  "#34d399", // emerald-400 (light)
  "#6ee7b7", // emerald-300 (lighter)
  "#a7f3d0", // emerald-200 (very light)
  "#d1fae5", // emerald-100 (pale)
  "#065f46", // emerald-800 (darkest)
];

export function getChartColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

