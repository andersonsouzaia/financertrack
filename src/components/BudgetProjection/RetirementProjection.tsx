import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Umbrella } from 'lucide-react';
import { AposentadoriaProjection } from './ProjectionTypes';

interface RetirementProjectionProps {
    data: AposentadoriaProjection;
    onChange: (data: AposentadoriaProjection) => void;
}

export function RetirementProjection({ data, onChange }: RetirementProjectionProps) {
    const handleChange = (field: keyof AposentadoriaProjection, value: number) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Umbrella className="h-5 w-5 text-primary" />
                    Planejamento de Aposentadoria
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Idade Atual</Label>
                        <Input
                            type="number"
                            value={data.idadeAtual}
                            onChange={(e) => handleChange('idadeAtual', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label>Idade Aposentadoria</Label>
                        <Input
                            type="number"
                            value={data.idadeAposentadoria}
                            onChange={(e) => handleChange('idadeAposentadoria', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Patrimônio Atual (R$)</Label>
                        <Input
                            type="number"
                            value={data.patrimonioAtual}
                            onChange={(e) => handleChange('patrimonioAtual', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label>Contribuição Mensal (R$)</Label>
                        <Input
                            type="number"
                            value={data.contribuicaoMensal}
                            onChange={(e) => handleChange('contribuicaoMensal', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Taxa Retorno Anual (%)</Label>
                        <Input
                            type="number"
                            value={data.taxaRetornoAnual}
                            onChange={(e) => handleChange('taxaRetornoAnual', parseFloat(e.target.value) || 0)}
                            step={0.1}
                        />
                    </div>
                    <div>
                        <Label>Gasto Mensal Desejado (R$)</Label>
                        <Input
                            type="number"
                            value={data.gastoMensalAposentadoria}
                            onChange={(e) => handleChange('gastoMensalAposentadoria', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
