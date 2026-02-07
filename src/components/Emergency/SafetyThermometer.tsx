import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";

interface SafetyThermometerProps {
    saldoAtual: number;
    metaTotal: number;
    custoFixoMensal: number;
}

export function SafetyThermometer({ saldoAtual, metaTotal, custoFixoMensal }: SafetyThermometerProps) {
    const percentual = Math.min(Math.round((saldoAtual / (metaTotal || 1)) * 100), 100);
    const mesesGarantidos = custoFixoMensal > 0 ? (saldoAtual / custoFixoMensal) : 0;

    let status = {
        color: "text-red-500",
        bgColor: "bg-red-500",
        message: "Nível Crítico",
        description: "Você tem menos de 1 mês de segurança.",
        icon: AlertTriangle
    };

    if (mesesGarantidos >= 6) {
        status = {
            color: "text-green-500",
            bgColor: "bg-green-500",
            message: "Segurança Total",
            description: "Parabéns! Você atingiu o patamar ideal de segurança.",
            icon: ShieldCheck
        };
    } else if (mesesGarantidos >= 3) {
        status = {
            color: "text-blue-500",
            bgColor: "bg-blue-500",
            message: "Em Construção",
            description: "Você está no caminho certo. Continue assim!",
            icon: TrendingUp
        };
    } else if (mesesGarantidos >= 1) {
        status = {
            color: "text-yellow-500",
            bgColor: "bg-yellow-500",
            message: "Atenção",
            description: "Você tem o básico, mas qualquer imprevisto maior pode ser arriscado.",
            icon: ShieldAlert
        };
    }

    const Icon = status.icon;

    return (
        <Card className="border-t-4" style={{ borderTopColor: status.color.replace('text-', '').replace('bg-', '') }}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`h-5 w-5 ${status.color}`} />
                    Termômetro de Segurança
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <span className="text-4xl font-bold block">
                            {mesesGarantidos.toFixed(1)} <span className="text-base font-normal text-muted-foreground">meses</span>
                        </span>
                        <span className="text-sm text-muted-foreground block">
                            de custo de vida garantidos
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Progresso da Meta</span>
                            <span className={`font-bold ${status.color}`}>{percentual}%</span>
                        </div>
                        <Progress value={percentual} className={`h-3`} indicatorClassName={status.bgColor} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>R$ {saldoAtual.toLocaleString('pt-BR')}</span>
                            <span>Meta: R$ {metaTotal.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-3`}>
                        <div className={`mt-1 h-2 w-2 rounded-full ${status.bgColor} shrink-0`} />
                        <div>
                            <h4 className={`font-medium text-sm ${status.color}`}>{status.message}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                {status.description}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
