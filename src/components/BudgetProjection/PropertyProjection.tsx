import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { ImovelProjection } from './ProjectionTypes';

interface PropertyProjectionProps {
    data: ImovelProjection;
    onChange: (data: ImovelProjection) => void;
}

export function PropertyProjection({ data, onChange }: PropertyProjectionProps) {
    const handleChange = (field: keyof ImovelProjection, value: any) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    // Cálculo simples de parcela (Sistema SAC ou Price simplificado)
    const calcularParcelaEstimada = () => {
        const valorFinanciado = data.valorImovel - data.entrada;
        if (valorFinanciado <= 0) return 0;

        // Convertendo taxa anual para mensal
        const taxaMensal = (data.taxaJurosAnual / 100) / 12;
        const meses = data.prazoAnos * 12;

        // Fórmula Price
        if (taxaMensal === 0) return valorFinanciado / meses;

        const parcela = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, meses)) / (Math.pow(1 + taxaMensal, meses) - 1);
        return parcela;
    };

    const parcelaEstimada = calcularParcelaEstimada();

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-primary" />
                    Aquisição de Imóvel
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Descrição</Label>
                    <Input
                        value={data.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        placeholder="Ex: Apartamento Centro"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Valor do Imóvel (R$)</Label>
                        <Input
                            type="number"
                            value={data.valorImovel}
                            onChange={(e) => handleChange('valorImovel', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label>Entrada (R$)</Label>
                        <Input
                            type="number"
                            value={data.entrada}
                            onChange={(e) => handleChange('entrada', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Juros Anuais (%)</Label>
                        <Input
                            type="number"
                            value={data.taxaJurosAnual}
                            onChange={(e) => handleChange('taxaJurosAnual', parseFloat(e.target.value) || 0)}
                            step={0.1}
                        />
                    </div>
                    <div>
                        <Label>Prazo (Anos)</Label>
                        <Input
                            type="number"
                            value={data.prazoAnos}
                            onChange={(e) => handleChange('prazoAnos', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    <p className="font-semibold mb-1">Financiamento Estimado:</p>
                    <p className="text-muted-foreground">
                        Parcela Mensal: <span className="text-foreground font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcelaEstimada)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        *Cálculo estimativo (Tabela Price), não inclui taxas/seguros.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
