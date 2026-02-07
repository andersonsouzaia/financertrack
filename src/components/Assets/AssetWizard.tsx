import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AssetTypeGuide } from "./AssetTypeGuide";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AssetWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (asset: any) => Promise<void>;
}

export function AssetWizard({ open, onOpenChange, onSave }: AssetWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const initialFormState = {
        nome: '',
        tipo: 'investimento',
        valor_inicial: 0,
        valor_atual: 0,
        taxa_rendimento: 0,
        descricao: '',
        status_financiamento: 'quitado',
        percentual_pago: 100,
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleNext = () => setStep((prev) => prev + 1);
    const handlePrev = () => setStep((prev) => prev - 1);

    const handleSave = async () => {
        if (!formData.nome) {
            toast({
                title: "Nome obrigatório",
                description: "Por favor, informe um nome para o ativo.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            setFormData(initialFormState);
            setStep(1);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 && "Qual o tipo do ativo?"}
                        {step === 2 && "Detalhes do Ativo"}
                        {step === 3 && "Valores"}
                        {step === 4 && "Situação"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {['investimento', 'imovel', 'veiculo', 'outro'].map((type) => (
                                    <div
                                        key={type}
                                        onClick={() => updateField('tipo', type)}
                                        className={`cursor-pointer rounded-lg border-2 p-4 text-center hover:border-primary transition-all ${formData.tipo === type ? 'border-primary bg-primary/5' : 'border-muted'
                                            }`}
                                    >
                                        <span className="capitalize font-medium">{type}</span>
                                    </div>
                                ))}
                            </div>
                            <AssetTypeGuide type={formData.tipo} />
                        </div>
                    )}

                    {/* Step 2: Basic Details */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="nome">Nome do Ativo</Label>
                                <Input
                                    id="nome"
                                    value={formData.nome}
                                    onChange={(e) => updateField('nome', e.target.value)}
                                    placeholder="Ex: Apartamento Centro, Ações VALE3"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                                <Input
                                    id="descricao"
                                    value={formData.descricao}
                                    onChange={(e) => updateField('descricao', e.target.value)}
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Values */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="valor_inicial">Valor Investido (R$)</Label>
                                <Input
                                    id="valor_inicial"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor_inicial}
                                    onChange={(e) => updateField('valor_inicial', parseFloat(e.target.value) || 0)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Quanto você pagou originalmente.</p>
                            </div>
                            <div>
                                <Label htmlFor="valor_atual">Valor Atual (R$)</Label>
                                <Input
                                    id="valor_atual"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor_atual}
                                    onChange={(e) => updateField('valor_atual', parseFloat(e.target.value) || 0)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Quanto vale hoje.</p>
                            </div>

                            {formData.tipo === 'investimento' && (
                                <div>
                                    <Label htmlFor="taxa">Taxa de Rendimento (% a.a.)</Label>
                                    <Input
                                        id="taxa"
                                        type="number"
                                        step="0.01"
                                        value={formData.taxa_rendimento}
                                        onChange={(e) => updateField('taxa_rendimento', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Status */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <Label>Situação do Ativo</Label>
                                <Select
                                    value={formData.status_financiamento}
                                    onValueChange={(val) => {
                                        updateField('status_financiamento', val);
                                        if (val === 'quitado') updateField('percentual_pago', 100);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quitado">Quitado / Totalmente Meu</SelectItem>
                                        <SelectItem value="financiando">Financiado / Em Pagamento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.status_financiamento === 'financiando' && (
                                <div>
                                    <Label>Percentual Pago (%)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.percentual_pago}
                                            onChange={(e) => updateField('percentual_pago', Number(e.target.value))}
                                        />
                                        <span className="text-sm font-medium w-12 text-right">{formData.percentual_pago}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handlePrev}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>
                    ) : <div></div>}

                    {step < 4 ? (
                        <Button onClick={handleNext}>
                            Próximo <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={loading}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? 'Salvando...' : 'Salvar Ativo'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
