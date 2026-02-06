import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { ChartTooltipContent } from "./ChartTooltip";
import { modernChartConfig } from "./modern-chart-config";
import { getChartColor } from "./chart-colors";
import { cn } from "@/lib/utils";

interface PieChartData {
  name: string;
  value: number;
  icon?: string;
  color?: string;
}

interface ModernPieChartProps {
  data: PieChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (entry: PieChartData, percent: number) => string;
  valueFormatter?: (value: number) => string;
  className?: string;
  legendPosition?: "bottom" | "right";
  maxItems?: number;
}

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
}: any) => {
  // Só mostra label se for maior que 8%
  if (percent < 0.08) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      {/* Background circle para legibilidade */}
      <circle
        cx={x}
        cy={y}
        r={percent > 0.15 ? 24 : 20}
        fill="hsl(var(--background) / 0.95)"
        stroke="hsl(var(--border) / 0.3)"
        strokeWidth={1}
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      />
      {/* Texto principal */}
      <text
        x={x}
        y={y - 4}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      {/* Nome da categoria (só se tiver espaço) */}
      {percent > 0.15 && (
        <text
          x={x}
          y={y + 10}
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] font-medium"
        >
          {name.length > 12 ? `${name.substring(0, 10)}...` : name}
        </text>
      )}
    </g>
  );
};

export function ModernPieChart({
  data,
  height = 420,
  innerRadius = 90,
  outerRadius = 140,
  showLegend = true,
  showLabels = true,
  labelFormatter,
  valueFormatter,
  className,
  legendPosition = "bottom",
  maxItems,
}: ModernPieChartProps) {
  const displayData = useMemo(() => {
    if (maxItems && data.length > maxItems) {
      const sorted = [...data].sort((a, b) => b.value - a.value);
      const top = sorted.slice(0, maxItems - 1);
      const others = sorted.slice(maxItems - 1).reduce(
        (acc, item) => ({
          name: "Outros",
          value: acc.value + item.value,
          icon: "📦",
        }),
        { name: "Outros", value: 0, icon: "📦" }
      );
      return [...top, others];
    }
    return data;
  }, [data, maxItems]);

  const total = useMemo(
    () => displayData.reduce((sum, item) => sum + item.value, 0),
    [displayData]
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={
                showLabels
                  ? labelFormatter
                    ? ({ name, value, ...rest }) => {
                        const percent = (value / total) * 100;
                        return labelFormatter(
                          { name, value },
                          percent
                        );
                      }
                    : renderCustomLabel
                  : false
              }
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              startAngle={90}
              endAngle={-270}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || getChartColor(index)}
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                  style={{
                    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              {...modernChartConfig.tooltip}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) => {
                    const percent = ((value / total) * 100).toFixed(1);
                    const formattedValue = valueFormatter
                      ? valueFormatter(value)
                      : value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                    return `${formattedValue} (${percent}%)`;
                  }}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Informação central no donut (opcional, só se houver espaço) */}
        {innerRadius > 60 && displayData.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {displayData.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {displayData.length === 1 ? "categoria" : "categorias"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legenda customizada moderna */}
      {showLegend && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Detalhamento
            </h3>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {valueFormatter
                  ? valueFormatter(total)
                  : total.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "grid gap-3",
              legendPosition === "right"
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {displayData.map((item, index) => {
              const percent = ((item.value / total) * 100).toFixed(1);
              const color = item.color || getChartColor(index);
              const isLarge = Number(percent) > 20;
              
              return (
                <div
                  key={item.name}
                  className="group relative overflow-hidden rounded-lg border border-border/50 bg-background/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
                >
                  {/* Gradient overlay no hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Barra de progresso visual */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="relative mt-0.5">
                        <div
                          className="h-5 w-5 shrink-0 rounded-full ring-2 ring-background transition-all duration-300 group-hover:scale-125 group-hover:ring-primary/40"
                          style={{ backgroundColor: color }}
                        />
                        {isLarge && (
                          <div
                            className="absolute inset-0 rounded-full animate-ping opacity-20"
                            style={{ backgroundColor: color }}
                          />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.icon && (
                            <span className="text-base shrink-0">{item.icon}</span>
                          )}
                          <span className="text-sm font-semibold text-foreground truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary tabular-nums">
                            {percent}%
                          </span>
                          <span className="text-xs text-muted-foreground">do total</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-foreground tabular-nums leading-tight">
                        {valueFormatter
                          ? valueFormatter(item.value)
                          : typeof item.value === "number"
                          ? item.value.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : item.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
