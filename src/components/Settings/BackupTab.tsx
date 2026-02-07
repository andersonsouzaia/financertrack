import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface BackupTabProps {
    user: any;
}

export function BackupTab({ user }: BackupTabProps) {
    const { toast } = useToast();
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            // Fetch all user data
            // This is a simplified example. In production, consider memory limits for large datasets.

            const tables = ['transacoes', 'investimentos', 'metas_financeiras', 'meses_financeiros'];
            const exportData: any = {};

            for (const table of tables) {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .eq('user_id', user.id);

                if (error) throw error;
                exportData[table] = data;
            }

            // Create blob and download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financertrack_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Exportação concluída",
                description: "Seus dados foram baixados com sucesso.",
            });

        } catch (error) {
            console.error("Export error:", error);
            toast({
                variant: "destructive",
                title: "Erro na exportação",
                description: "Ocorreu um erro ao exportar seus dados. Tente novamente.",
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Backup e Dados</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie seus dados, faça backups ou exclua sua conta.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Exportar Dados
                    </CardTitle>
                    <CardDescription>
                        Baixe uma cópia de todos os seus dados (Transações, Investimentos, Metas) em formato JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExportData} disabled={exporting}>
                        {exporting ? "Exportando..." : "Exportar Meus Dados"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        O arquivo JSON contém informações sensíveis. Guarde-o em local seguro.
                    </p>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription>
                        Ações irreversíveis relacionadas à sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">
                        Deletar Minha Conta
                    </Button>
                    <p className="text-xs text-red-600/80 mt-2">
                        Isso excluirá permanentemente todos os seus dados e não poderá ser desfeito.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
