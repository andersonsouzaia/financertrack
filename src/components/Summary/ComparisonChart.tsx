import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltipContent } from '@/components/charts/ChartTooltip';
import { modernChartConfig } from '@/components/charts/modern-chart-config';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

interface ComparisonChartProps {
    title: string;
    data: {
        label: string;
        current: number;
        previous: number;
    }[];
    currentLabel: string;
    previousLabel: string;
    formatCurrency: (value: number) => string;
}

export function ComparisonChart({ title, data, currentLabel, previousLabel, formatCurrency }: ComparisonChartProps) {
    return (
        <ChartCard title={title} description={`Comparação: ${currentLabel} vs ${previousLabel}`}>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                    <CartesianGrid {...modernChartConfig.grid} />
                    <XAxis dataKey="label" {...modernChartConfig.xAxis} />
                    <YAxis
                        {...modernChartConfig.yAxis}
                        tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                    />
                    <Tooltip
                        content={<ChartTooltipContent valueFormatter={(value) => formatCurrency(value)} />}
                        {...modernChartConfig.tooltip}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar
                        dataKey="current"
                        name={currentLabel}
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="previous"
                        name={previousLabel}
                        fill="hsl(var(--muted))"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
