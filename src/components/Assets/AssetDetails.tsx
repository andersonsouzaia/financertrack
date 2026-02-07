import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Trash2 } from "lucide-react";

interface AssetDetailsProps {
    asset: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: (id: string) => void;
}

export function AssetDetails({ asset, open, onOpenChange, onDelete }: AssetDetailsProps) {
    if (!asset) return null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const lucro = (Number(asset.valor_atual) || 0) - (Number(asset.valor_inicial) || 0);
    const rentabilidade = Number(asset.valor_inicial) > 0
        ? ((lucro / Number(asset.valor_inicial)) * 100).toFixed(2)
        : '0.00';

    const meta = asset.meta || {};
    const isFinanced = meta.statusFinanciamento === 'financiando';
    const percentualPago = meta.percentualPago || 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {asset.nome}
                            <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                                {asset.tipo}
                            </span>
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                if (confirm('Tem certeza que deseja remover este ativo?')) {
                                    onDelete(asset.id);
                                    onOpenChange(false);
                                }
                            }}
                        >
                            <Trash2 size={20} />
                        </Button>
                    </div>
                    <DialogDescription>
                        {asset.descricao || "Sem descrição"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase font-semibold">Valor Atual</label>
                            <div className="text-3xl font-bold text-foreground">
                                {formatCurrency(asset.valor_atual || 0)}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase font-semibold">Valor Investido</label>
                            <div className="text-xl font-medium text-muted-foreground flex items-center gap-2">
                                {formatCurrency(asset.valor_inicial || 0)}
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Custo Original</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/30 border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Rentabilidade Total</span>
                                {Number(rentabilidade) >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${Number(rentabilidade) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {Number(rentabilidade) > 0 ? '+' : ''}{rentabilidade}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {lucro >= 0 ? 'Lucro de ' : 'Prejuízo de '}{formatCurrency(Math.abs(lucro))}
                            </div>
                        </div>

                        {isFinanced && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Status do Financiamento</span>
                                    <span className="font-medium">{percentualPago}% Pago</span>
                                </div>
                                <Progress value={percentualPago} className="h-2" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Data de Aquisição</div>
                            <div className="text-sm font-medium">
                                {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>

                    {asset.taxa_rendimento > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Taxa Contratada</div>
                                <div className="text-sm font-medium">
                                    {asset.taxa_rendimento}% a.a.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
