
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SaveSimulationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    simulationData: {
        valorInicial: number;
        aporteMensal: number;
        taxaMensal: number;
        meses: number;
    };
    onSuccess: () => void;
}

export function SaveSimulationDialog({
    open,
    onOpenChange,
    simulationData,
    onSuccess,
}: SaveSimulationDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) {
            toast({
                variant: "destructive",
                title: "Nome obrigatório",
                description: "Por favor, dê um nome para sua simulação.",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from("simulacoes_juros_compostos").insert({
                user_id: user.id,
                nome: name,
                valor_inicial: simulationData.valorInicial,
                aporte_mensal: simulationData.aporteMensal,
                taxa_mensal: simulationData.taxaMensal,
                periodo_meses: simulationData.meses,
            });

            if (error) throw error;

            toast({
                title: "Simulação salva!",
                description: "Sua simulação foi salva com sucesso.",
            });

            setName("");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar simulação:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível salvar a simulação. Tente novamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Salvar Simulação</DialogTitle>
                    <DialogDescription>
                        Dê um nome para esta simulação para acessá-la futuramente.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: Aposentadoria, Carro Novo"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
