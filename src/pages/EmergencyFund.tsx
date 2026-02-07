import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SafetyThermometer } from "@/components/Emergency/SafetyThermometer";
import { RunwayCalculator } from "@/components/Emergency/RunwayCalculator";
import { PanicButton } from "@/components/Emergency/PanicButton";
import { AporteDialog } from "@/components/Emergency/AporteDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EmergencyFund() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reserva, setReserva] = useState<any>(null);
    const [historico, setHistorico] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            // Load Reserva
            let { data: reservaData, error: reservaError } = await supabase
                .from("reserva_emergencia")
                .select("*")
                .eq("user_id", user?.id)
                .maybeSingle();

            if (reservaError) throw reservaError;

            // Create if not exists
            if (!reservaData) {
                const { data: newData, error: createError } = await supabase
                    .from("reserva_emergencia")
                    .insert([{ user_id: user?.id }])
                    .select()
                    .single();

                if (createError) throw createError;
                reservaData = newData;
            }

            setReserva(reservaData);

            // Load History
            if (reservaData?.id) {
                const { data: histData, error: histError } = await supabase
                    .from("historico_reserva")
                    .select("*")
                    .eq("reserva_id", reservaData.id)
                    .order("data", { ascending: false });

                if (histError) throw histError;
                setHistorico(histData || []);
            }
        } catch (error) {
            console.error("Error loading emergency fund:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar",
                description: "Não foi possível carregar seus dados de reserva.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (custoFixo: number, metaTotal: number) => {
        if (!reserva?.id) return;
        const { error } = await supabase
            .from("reserva_emergencia")
            .update({ custo_fixo_mensal: custoFixo, meta_total: metaTotal })
            .eq("id", reserva.id);

        if (error) throw error;
        await loadData();
    };

    const handleTransaction = async (type: 'aporte' | 'resgate', amount: number, category: string | null, description: string | null) => {
        if (!reserva?.id) return;

        // 1. Insert History
        const { error: histError } = await supabase
            .from("historico_reserva")
            .insert([{
                reserva_id: reserva.id,
                tipo: type,
                valor: amount,
                categoria: category,
                descricao: description,
                data: new Date().toISOString()
            }]);

        if (histError) throw histError;

        // 2. Update Balance
        const newBalance = type === 'aporte'
            ? (reserva.saldo_atual || 0) + amount
            : (reserva.saldo_atual || 0) - amount;

        const { error: balanceError } = await supabase
            .from("reserva_emergencia")
            .update({ saldo_atual: newBalance })
            .eq("id", reserva.id);

        if (balanceError) throw balanceError;

        toast({
            title: type === 'aporte' ? "Aporte Registrado" : "Emergência Registrada",
            description: type === 'aporte'
                ? "Sua reserva aumentou! Continue assim."
                : "Registro salvo. A reserva serve para isso!",
            variant: type === 'aporte' ? "default" : "destructive" // Green/Red handled by default/destructive
        });

        await loadData();
    };

    if (loading) {
        return (
            <AppLayout title="Reserva de Emergência" description="Carregando...">
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Reserva de Emergência"
            description="Sua paz de espírito financeira."
            actions={
                <div className="flex gap-2">
                    <PanicButton onRegisterEmergency={(amt, cat, desc) => handleTransaction('resgate', amt, cat, desc)} />
                    <AporteDialog onRegisterAporte={(amt, cat) => handleTransaction('aporte', amt, cat, cat)} />
                </div>
            }
        >
            <div className="w-full space-y-8 max-w-5xl mx-auto">

                {/* Topo: Termômetro */}
                {/* Topo: Termômetro ou Setup */}
                {(reserva?.meta_total || 0) > 0 ? (
                    <SafetyThermometer
                        saldoAtual={reserva?.saldo_atual || 0}
                        metaTotal={reserva?.meta_total || 20000}
                        custoFixoMensal={reserva?.custo_fixo_mensal || 0}
                    />
                ) : (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-primary flex items-center gap-2">
                                <ArrowUpCircle className="h-6 w-6" />
                                Vamos começar sua Reserva?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Você ainda não definiu uma meta. Use a calculadora abaixo para descobrir quanto precisa guardar para ter tranquilidade financeira.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Meio: Calculadora */}
                <RunwayCalculator
                    currentCost={reserva?.custo_fixo_mensal || 0}
                    currentGoal={reserva?.meta_total || 0}
                    currentBalance={reserva?.saldo_atual || 0}
                    onUpdateSettings={handleUpdateSettings}
                />

                {/* Base: Histórico */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Histórico de Movimentações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {historico.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                Nenhuma movimentação registrada ainda.
                                <br />
                                Faça seu primeiro aporte para começar!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {historico.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            {item.tipo === 'aporte' ? (
                                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                                    <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                                                    <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {item.tipo === 'aporte' ? 'Aporte' : item.categoria || 'Resgate'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.descricao && <span className="mr-1">{item.descricao} •</span>}
                                                    {format(new Date(item.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${item.tipo === 'aporte' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {item.tipo === 'aporte' ? '+' : '-'} R$ {Number(item.valor).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
