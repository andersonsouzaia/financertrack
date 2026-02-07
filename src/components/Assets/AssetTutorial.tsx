import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { PieChart, TrendingUp, PlusCircle, CheckCircle2 } from "lucide-react";

interface AssetTutorialProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssetTutorial({ open, onOpenChange }: AssetTutorialProps) {
    const [step, setStep] = useState(0);

    // Reset step when dialog opens
    useEffect(() => {
        if (open) setStep(0);
    }, [open]);

    const steps = [
        {
            title: "Bem-vindo aos Seus Ativos",
            description: "Aqui você gerencia todo o seu patrimônio: investimentos, imóveis, veículos e muito mais. Tenha uma visão clara da sua riqueza.",
            icon: <TrendingUp className="h-12 w-12 text-primary mb-4" />,
        },
        {
            title: "Adicione seus Bens",
            description: "Comece clicando em 'Adicionar Ativo'. Você pode registrar o valor investido (quanto pagou) e o valor atual (quanto vale hoje).",
            icon: <PlusCircle className="h-12 w-12 text-blue-500 mb-4" />,
        },
        {
            title: "Acompanhe a Evolução",
            description: "Calculamos automaticamente sua rentabilidade e mostramos gráficos de distribuição da sua carteira.",
            icon: <PieChart className="h-12 w-12 text-purple-500 mb-4" />,
        },
        {
            title: "Tudo Pronto!",
            description: "Você está pronto para começar. Lembre-se de atualizar os valores mensalmente para um controle preciso.",
            icon: <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />,
        },
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onOpenChange(false);
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const currentStep = steps[step];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex flex-col items-center text-center pt-4">
                        {currentStep.icon}
                        <DialogTitle className="text-xl mb-2">{currentStep.title}</DialogTitle>
                        <DialogDescription className="text-center">
                            {currentStep.description}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex justify-center gap-1 py-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-muted'}`}
                        />
                    ))}
                </div>

                <DialogFooter className="flex sm:justify-between gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="sm:mr-auto">
                        Pular
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
                            Anterior
                        </Button>
                        <Button onClick={handleNext}>
                            {step === steps.length - 1 ? "Começar" : "Próximo"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
