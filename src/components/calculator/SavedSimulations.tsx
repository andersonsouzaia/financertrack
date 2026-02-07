
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Trash2, PlayCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface SavedSimulation {
    id: string;
    nome: string;
    valor_inicial: number;
    aporte_mensal: number;
    taxa_mensal: number;
    periodo_meses: number;
    created_at: string;
}

interface SavedSimulationsProps {
    onLoadSimulation: (data: {
        valorInicial: number;
        aporteMensal: number;
        taxaMensal: number;
        meses: number;
    }) => void;
    refreshTrigger: number;
}

export function SavedSimulations({ onLoadSimulation, refreshTrigger }: SavedSimulationsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSimulations = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from("simulacoes_juros_compostos")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setSimulations(data || []);
            } catch (error) {
                console.error("Erro ao carregar simulações:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSimulations();
    }, [user, refreshTrigger]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from("simulacoes_juros_compostos")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            setSimulations((prev) => prev.filter((sim) => sim.id !== id));
            toast({
                title: "Simulação removida",
                description: "A simulação foi excluída com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao deletar simulação:", error);
            toast({
                variant: "destructive",
                title: "Erro ao remover",
                description: "Não foi possível remover a simulação.",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleLoad = (sim: SavedSimulation) => {
        onLoadSimulation({
            valorInicial: Number(sim.valor_inicial),
            aporteMensal: Number(sim.aporte_mensal),
            taxaMensal: Number(sim.taxa_mensal),
            meses: Number(sim.periodo_meses),
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (simulations.length === 0) {
        return (
            <Card className="border-border/50 bg-muted/20">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Nenhuma simulação salva.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">Simulações Salvas</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] px-6 pb-6">
                    <div className="space-y-3">
                        {simulations.map((sim) => (
                            <div
                                key={sim.id}
                                className="group flex flex-col gap-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                                role="button"
                                onClick={() => handleLoad(sim)}
                            >
                                <div className="flex items-start justify-between">
                                    <span className="font-medium line-clamp-1">{sim.nome}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDelete(sim.id, e)}
                                        disabled={deletingId === sim.id}
                                    >
                                        {deletingId === sim.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                    <div>Inicial: R$ {Number(sim.valor_inicial).toLocaleString()}</div>
                                    <div>Meses: {sim.periodo_meses}</div>
                                    <div>Mensal: R$ {Number(sim.aporte_mensal).toLocaleString()}</div>
                                    <div>Taxa: {sim.taxa_mensal}%</div>
                                </div>

                                <div className="mt-1 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="h-3 w-3" />
                                    Carregar simulação
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
