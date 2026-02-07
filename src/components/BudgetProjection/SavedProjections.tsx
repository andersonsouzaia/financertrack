import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2, PlayCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SavedProjectionsProps {
    onLoadProjection: (data: any) => void;
    currentProjectionData?: any; // Data to save
    refreshTrigger: number;
}

export function SavedProjections({ onLoadProjection, currentProjectionData, refreshTrigger }: SavedProjectionsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [projections, setProjections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newProjectionName, setNewProjectionName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProjections();
        }
    }, [user, refreshTrigger]);

    const fetchProjections = async () => {
        try {
            const { data, error } = await supabase
                .from('projecoes_orcamento') // Using 'any' cast below due to possible type generation delay
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjections(data || []);
        } catch (error) {
            console.error('Erro ao buscar projeções:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('projecoes_orcamento')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Projeção removida",
                description: "A projeção foi excluída com sucesso.",
            });

            fetchProjections();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível excluir a projeção.",
            });
        }
    };

    const handleSave = async () => {
        if (!newProjectionName.trim()) {
            toast({
                variant: "destructive",
                title: "Nome obrigatório",
                description: "Por favor, dê um nome para sua projeção.",
            });
            return;
        }

        if (!currentProjectionData) {
            toast({
                variant: "destructive",
                title: "Sem dados",
                description: "Não há dados de projeção para salvar.",
            });
            return;
        }

        setSaving(true);
        try {
            // Determine type based on active tab or data structure
            // For now, we'll save the whole 'simulacoes' object and use a generic type or infer from data
            // Ideally, the parent component should tell us the active type, but we can store all active simulations

            const { error } = await supabase
                .from('projecoes_orcamento')
                .insert({
                    user_id: user?.id,
                    nome: newProjectionName,
                    tipo: 'completo', // Saving the complete state of simulations
                    dados: currentProjectionData
                });

            if (error) throw error;

            toast({
                title: "Projeção salva",
                description: "Sua projeção foi salva com sucesso.",
            });

            setSaveDialogOpen(false);
            setNewProjectionName('');
            fetchProjections();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível salvar a projeção.",
            });
        } finally {
            setSaving(false);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'viagem': return '✈️';
            case 'apartamento': return '🏠';
            case 'negocio': return '💼';
            case 'aposentadoria': return '🏖️';
            case 'imovel': return '🏢';
            case 'educacao': return '🎓';
            default: return '📊';
        }
    };

    return (
        <Card className="h-full border-border/50 flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Projeções Salvas</CardTitle>
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                                <Save className="h-4 w-4" />
                                Salvar Atual
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Salvar Projeção</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Projeção</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Planejamento 2026"
                                        value={newProjectionName}
                                        onChange={(e) => setNewProjectionName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] px-6 pb-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : projections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <p className="mb-2 text-sm">Nenhuma projeção salva</p>
                            <p className="text-xs">Salve suas simulações para acessá-las aqui</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {projections.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-accent/50 hover:border-accent"
                                    onClick={() => onLoadProjection(proj.dados)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{getIconForType(proj.tipo)}</span>
                                            <div>
                                                <p className="font-medium leading-none">{proj.nome}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(proj.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                onClick={(e) => handleDelete(proj.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Try to show some badges based on data presence */}
                                        {proj.dados?.viagem?.dias > 0 && <Badge variant="secondary" className="text-[10px] h-5">Viagem</Badge>}
                                        {proj.dados?.apartamento?.valor > 0 && <Badge variant="secondary" className="text-[10px] h-5">Apto</Badge>}
                                        {proj.dados?.negocio?.investimentoInicial > 0 && <Badge variant="secondary" className="text-[10px] h-5">Negócio</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
