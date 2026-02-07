import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { EducacaoProjection } from './ProjectionTypes';

interface EducationProjectionProps {
    data: EducacaoProjection;
    onChange: (data: EducacaoProjection) => void;
}

export function EducationProjection({ data, onChange }: EducationProjectionProps) {
    const handleChange = (field: keyof EducacaoProjection, value: any) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const custoTotal = (data.mensalidade * data.duracaoMeses) + (data.materialAnual * (data.duracaoMeses / 12));

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Educação
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Descrição</Label>
                    <Input
                        value={data.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        placeholder="Ex: Faculdade de Medicina"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Mensalidade (R$)</Label>
                        <Input
                            type="number"
                            value={data.mensalidade}
                            onChange={(e) => handleChange('mensalidade', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label>Duração (Meses)</Label>
                        <Input
                            type="number"
                            value={data.duracaoMeses}
                            onChange={(e) => handleChange('duracaoMeses', parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Material Anual (R$)</Label>
                        <Input
                            type="number"
                            value={data.materialAnual}
                            onChange={(e) => handleChange('materialAnual', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label>Inflação Educação (%)</Label>
                        <Input
                            type="number"
                            value={data.inflacaoEducacaoStats}
                            onChange={(e) => handleChange('inflacaoEducacaoStats', parseFloat(e.target.value) || 0)}
                            step={0.1}
                        />
                    </div>
                </div>

                <div className="rounded bg-indigo-50 p-3 text-sm dark:bg-indigo-900/20">
                    <p className="font-semibold mb-1">Custo Estimado:</p>
                    <p>
                        Total do Curso: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
