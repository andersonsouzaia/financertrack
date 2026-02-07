
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sparkles, MessageSquare } from 'lucide-react';
import { ChatIA } from '@/components/Dashboard/ChatIA';
import { useLocation } from 'react-router-dom';

export function AIAssistantButton() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    const getPageContext = (pathname: string) => {
        switch (pathname) {
            case '/dashboard':
                return 'dashboard';
            case '/transactions':
                return 'transacoes';
            case '/cards':
                return 'cartoes';
            case '/budget-projection':
                return 'projecao';
            case '/assets':
                return 'atividades';
            case '/monthly-summary':
                return 'resumo_mensal';
            case '/annual-summary':
                return 'resumo_anual';
            default:
                return 'geral';
        }
    };

    const context = getPageContext(location.pathname);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0 hover:scale-105 transition-transform"
                    size="icon"
                >
                    <Sparkles className="h-6 w-6" />
                    <span className="sr-only">Abrir Assistente IA</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                <div className="flex-1 h-full overflow-hidden">
                    {/* @ts-ignore - ChatIA might not be fully typed yet */}
                    <ChatIA
                        embedded={false}
                        context={context}
                        onClose={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
