import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RunwayCalculatorProps {
    currentCost: number;
    currentGoal: number;
    currentBalance: number;
    onUpdateSettings: (newCost: number, newGoal: number) => Promise<void>;
}

export function RunwayCalculator({ currentCost, currentGoal, currentBalance, onUpdateSettings }: RunwayCalculatorProps) {
    const { toast } = useToast();
    const [monthlyCost, setMonthlyCost] = useState(currentCost || 0);
    const [targetMonths, setTargetMonths] = useState(currentCost > 0 ? Math.round(currentGoal / currentCost) : 6);
    const [monthlyContribution, setMonthlyContribution] = useState(500); // Default simulation value
    const [manualGoal, setManualGoal] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentCost) setMonthlyCost(currentCost);
        if (currentCost > 0 && currentGoal > 0) {
            setTargetMonths(Math.round(currentGoal / currentCost));
        }
    }, [currentCost, currentGoal]);

    const targetGoal = manualGoal !== null ? manualGoal : (monthlyCost * targetMonths);
    const remainingAmount = Math.max(0, targetGoal - currentBalance);
    const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : 0;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateSettings(monthlyCost, targetGoal);
            toast({
                title: "Planejamento Salvo",
                description: "Sua meta de reserva foi atualizada com sucesso.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível atualizar seu planejamento.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calculadora de Planejamento
                </CardTitle>
                <CardDescription>
                    Defina quanto você precisa para se sentir seguro.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="monthlyCost">Custo de Vida Mensal</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input
                                id="monthlyCost"
                                type="number"
                                className="pl-9"
                                value={monthlyCost}
                                onChange={(e) => {
                                    const cost = Number(e.target.value);
                                    setMonthlyCost(cost);
                                    setManualGoal(null); // Reset manual override
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Meta Total (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input
                                id="targetGoal"
                                type="number"
                                className="pl-9 font-bold text-primary"
                                value={manualGoal !== null ? manualGoal : (monthlyCost * targetMonths)}
                                onChange={(e) => {
                                    setManualGoal(Number(e.target.value));
                                    // Reverse calculate months for UI feedback (approx)
                                    if (monthlyCost > 0) {
                                        setTargetMonths(Math.round(Number(e.target.value) / monthlyCost));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Meses de Segurança (Sugestão)</Label>
                    <div className="flex gap-2">
                        {[3, 6, 12].map((m) => (
                            <Button
                                key={m}
                                variant={targetMonths === m && manualGoal === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setTargetMonths(m);
                                    setManualGoal(null); // Reset manual override
                                }}
                                className="flex-1"
                            >
                                {m} Meses
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Simulador de Aporte Mensal</Label>
                        <span className="font-bold text-primary">R$ {monthlyContribution.toLocaleString('pt-BR')}</span>
                    </div>
                    <Slider
                        value={[monthlyContribution]}
                        onValueChange={(vals) => setMonthlyContribution(vals[0])}
                        max={5000}
                        step={50}
                        className="py-4"
                    />

                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Com aportes de R$ {monthlyContribution}, você atinge sua meta em:</p>
                        <p className="text-2xl font-bold text-primary">
                            {monthsToGoal > 0 ? `${monthsToGoal} meses` : "Já atingida!"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Meta Total: R$ {targetGoal.toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar Planejamento"}
                </Button>
            </CardFooter>
        </Card>
    );
}
