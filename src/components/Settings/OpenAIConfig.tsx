import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface OpenAIConfigProps {
    user: any;
}

export function OpenAIConfig({ user }: OpenAIConfigProps) {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('openai_api_key')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data && data.openai_api_key) {
                setApiKey(data.openai_api_key);
                setIsSaved(true);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Upsert logic
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    openai_api_key: apiKey
                }, { onConflict: 'user_id' });

            if (error) throw error;

            setIsSaved(true);
            toast({
                title: "Sucesso",
                description: "Chave da API salva com sucesso.",
            });
        } catch (error) {
            console.error('Erro ao salvar chave:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível salvar a chave da API.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configuração de IA</h3>
                <p className="text-sm text-muted-foreground">
                    Configure sua integração com a OpenAI para ativar recursos avançados de assistente.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Chave da API OpenAI
                    </CardTitle>
                    <CardDescription>
                        Sua chave é armazenada de forma segura e usada apenas para suas solicitações.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">Chave da API (sk-...)</Label>
                        <div className="flex gap-2 relative">
                            <Input
                                id="apiKey"
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setIsSaved(false);
                                }}
                                placeholder="sk-..."
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Você pode gerar uma chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={handleSave} disabled={loading || !apiKey}>
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Configuração
                                </>
                            )}
                        </Button>
                    </div>

                    {isSaved && (
                        <div className="rounded-md bg-emerald-50 p-3 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 mt-4 flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Configuração Ativa</p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    Sua chave está salva. O assistente de IA agora utilizará sua conta OpenAI para respostas mais inteligentes.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
