import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { NegocioProjection } from './ProjectionTypes';

interface BusinessProjectionProps {
    data: NegocioProjection;
    onChange: (data: NegocioProjection) => void;
}

export function BusinessProjection({ data, onChange }: BusinessProjectionProps) {
    const handleChange = (field: keyof NegocioProjection, value: string | number) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const calcularResultadoSimples = () => {
        // Estimativa simples de lucro/prejuízo no primeiro ano
        const custoAnual = data.investimentoInicial + (data.custoMensal * 12);
        const receitaAnual = data.receitaEstimada * 12; // Assumindo receita imediata (simplificado)
        return receitaAnual - custoAnual;
    };

    const resultado = calcularResultadoSimples();

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Investimento em Negócio
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="biz-name">Nome do Negócio</Label>
                    <Input
                        id="biz-name"
                        value={data.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        placeholder="Ex: Cafeteria, E-commerce..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="biz-investimento">Investimento Inicial (R$)</Label>
                        <Input
                            id="biz-investimento"
                            type="number"
                            value={data.investimentoInicial}
                            onChange={(e) => handleChange('investimentoInicial', parseFloat(e.target.value) || 0)}
                            min={0}
                        />
                    </div>
                    <div>
                        <Label htmlFor="biz-custo">Custo Operacional Mensal (R$)</Label>
                        <Input
                            id="biz-custo"
                            type="number"
                            value={data.custoMensal}
                            onChange={(e) => handleChange('custoMensal', parseFloat(e.target.value) || 0)}
                            min={0}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="biz-receita">Receita Estimada Mensal (R$)</Label>
                        <Input
                            id="biz-receita"
                            type="number"
                            value={data.receitaEstimada}
                            onChange={(e) => handleChange('receitaEstimada', parseFloat(e.target.value) || 0)}
                            min={0}
                        />
                    </div>
                    <div>
                        <Label htmlFor="biz-breakeven">Meses até Break-even (Estimado)</Label>
                        <Input
                            id="biz-breakeven"
                            type="number"
                            value={data.mesesAteBreakEven}
                            onChange={(e) => handleChange('mesesAteBreakEven', parseFloat(e.target.value) || 0)}
                            min={1}
                        />
                    </div>
                </div>

                <div className={`rounded p-3 text-sm ${resultado >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p className="font-semibold mb-1">Impacto 1º Ano:</p>
                    <p>
                        Investimento Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.investimentoInicial + (data.custoMensal * 12))}
                    </p>
                    <p>
                        Resultado Estimado: <span className={resultado >= 0 ? "text-green-600" : "text-red-600"}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado)}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
