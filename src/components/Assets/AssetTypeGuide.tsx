import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Info, TrendingUp, Home, Car, Coins } from "lucide-react";

interface AssetTypeGuideProps {
    type: string;
}

export function AssetTypeGuide({ type }: AssetTypeGuideProps) {
    const getGuideContent = () => {
        switch (type) {
            case "investimento":
                return {
                    title: "Investimentos",
                    description: "Renda fixa, renda variável e fundos.",
                    icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
                    tips: [
                        "Inclui CDI, CDB, Tesouro Direto, Ações e FIIs.",
                        "Lembre-se de atualizar o valor atual periodicamente para ter uma visão real do patrimônio.",
                        "O valor investido é o quanto você tirou do bolso.",
                    ],
                };
            case "imovel":
                return {
                    title: "Imóveis",
                    description: "Casas, apartamentos, terrenos.",
                    icon: <Home className="h-5 w-5 text-blue-500" />,
                    tips: [
                        "Considere o valor de mercado atual, não apenas o valor de compra.",
                        "Se estiver financiado, registre o valor total do imóvel e, separadamente, a dívida restante na área de despesas ou controle o saldo devedor aqui.",
                        "Imóveis tendem a valorizar no longo prazo.",
                    ],
                };
            case "veiculo":
                return {
                    title: "Veículos",
                    description: "Carros, motos, caminhões.",
                    icon: <Car className="h-5 w-5 text-amber-500" />,
                    tips: [
                        "Veículos sofrem depreciação anual.",
                        "Utilize a tabela FIPE como referência para o valor atual.",
                        "Gastos com manutenção e IPVA devem ir para Despesas, não afetam o valor do ativo.",
                    ],
                };
            default:
                return {
                    title: "Outros Ativos",
                    description: "Joias, obras de arte, eletrônicos caros.",
                    icon: <Coins className="h-5 w-5 text-purple-500" />,
                    tips: [
                        "Qualquer bem que possua valor de revenda significativo.",
                        "Mantenha notas fiscais e certificados de autenticidade.",
                    ],
                };
        }
    };

    const content = getGuideContent();

    return (
        <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    {content.icon}
                    <CardTitle className="text-base">{content.title}</CardTitle>
                </div>
                <CardDescription>{content.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {content.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
