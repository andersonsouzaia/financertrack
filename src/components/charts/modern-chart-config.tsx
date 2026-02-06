import { CartesianGridProps, XAxisProps, YAxisProps, TooltipProps } from "recharts";

/**
 * Configurações padrão para gráficos modernos seguindo o estilo do dashboard
 */
export const modernChartConfig = {
  // Grid
  grid: {
    vertical: false,
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border) / 0.3)",
  } as Partial<CartesianGridProps>,

  // Eixo X
  xAxis: {
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
    tickLine: false,
    axisLine: false,
  } as Partial<XAxisProps>,

  // Eixo Y
  yAxis: {
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
    tickLine: false,
    axisLine: false,
  } as Partial<YAxisProps>,

  // Tooltip
  tooltip: {
    contentStyle: {
      backgroundColor: "hsl(var(--background) / 0.95)",
      border: "1px solid hsl(var(--border) / 0.5)",
      borderRadius: "0.5rem",
      padding: "0.75rem",
    },
    cursor: { stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "5 5" },
  } as Partial<TooltipProps<any, any>>,

  // Cores para barras
  barRadius: [6, 6, 0, 0] as [number, number, number, number],

  // Stroke width para linhas
  lineStrokeWidth: 3,
};
