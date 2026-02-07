import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface Insight {
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface InsightsProps {
    type: 'monthly' | 'annual';
    data: {
        receitas: number;
        despesas: number;
        saldo: number;
        previousReceitas?: number;
        previousDespesas?: number;
        transactions?: any[];
    };
}

export function Insights({ type, data }: InsightsProps) {
    const generateInsights = (): Insight[] => {
        const insights: Insight[] = [];
        const { receitas, despesas, saldo, previousReceitas, previousDespesas, transactions } = data;

        // 1. Savings Rate Analysis
        const savingsRate = receitas > 0 ? (saldo / receitas) * 100 : 0;
        if (savingsRate >= 20) {
            insights.push({
                type: 'positive',
                title: 'Alta Taxa de Poupança',
                description: `Você economizou ${savingsRate.toFixed(1)}% da sua renda. Ótimo trabalho!`,
                icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
            });
        } else if (savingsRate > 0 && savingsRate < 10) {
            insights.push({
                type: 'warning',
                title: 'Baixa Taxa de Poupança',
                description: `Sua economia foi de apenas ${savingsRate.toFixed(1)}%. Tente reduzir gastos supérfluos.`,
                icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
            });
        } else if (saldo < 0) {
            insights.push({
                type: 'negative',
                title: 'Gastos Excederam a Renda',
                description: 'Você gastou mais do que ganhou neste período. Revise seu orçamento.',
                icon: <TrendingDown className="h-5 w-5 text-red-600" />,
            });
        }

        // 2. Spending Trend Analysis (if previous data exists)
        if (previousDespesas && previousDespesas > 0) {
            const increase = ((despesas - previousDespesas) / previousDespesas) * 100;
            if (increase > 15) {
                insights.push({
                    type: 'negative',
                    title: 'Aumento nos Gastos',
                    description: `Seus gastos aumentaram ${increase.toFixed(1)}% em comparação ao período anterior.`,
                    icon: <TrendingDown className="h-5 w-5 text-red-600" />,
                });
            } else if (increase < -10) {
                insights.push({
                    type: 'positive',
                    title: 'Redução de Custos',
                    description: `Você reduziu seus gastos em ${Math.abs(increase).toFixed(1)}%. Parabéns!`,
                    icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
                });
            }
        }

        // 3. Category/Transaction Analysis
        if (transactions && transactions.length > 0) {
            // Find largest transaction
            const largestTx = transactions.reduce((max, t) =>
                (Number(t.valor_original) > Number(max.valor_original) && t.tipo !== 'entrada') ? t : max, transactions[0]
            );

            if (largestTx && largestTx.tipo !== 'entrada' && Number(largestTx.valor_original) > despesas * 0.2) {
                insights.push({
                    type: 'neutral',
                    title: 'Gasto Concentrado',
                    description: `Uma única transação ("${largestTx.descricao}") representou mais de 20% das suas despesas.`,
                    icon: <Lightbulb className="h-5 w-5 text-blue-600" />,
                });
            }
        }

        // Fallback if no specific insights
        if (insights.length === 0) {
            insights.push({
                type: 'neutral',
                title: 'Estabilidade Financeira',
                description: 'Suas finanças parecem estáveis. Continue monitorando seus gastos.',
                icon: <Lightbulb className="h-5 w-5 text-blue-600" />,
            });
        }

        return insights;
    };

    const insights = generateInsights();

    return (
        <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Insights Financeiros
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`flex flex-col gap-2 rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${insight.type === 'positive' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20' :
                                insight.type === 'negative' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20' :
                                    insight.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20' :
                                        'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {insight.icon}
                            <h4 className="font-semibold">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
