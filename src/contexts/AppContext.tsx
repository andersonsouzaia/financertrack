import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AppContextType {
  // Clipboard detection
  clipboardContent: string | null;
  hasBarcodeInClipboard: boolean;
  checkClipboard: () => Promise<void>;
  
  // Contextual actions
  showContextualAction: boolean;
  contextualActionType: 'barcode' | 'invoice' | null;
  dismissContextualAction: () => void;
  
  // Deep linking
  pendingDeepLink: string | null;
  setPendingDeepLink: (link: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [showContextualAction, setShowContextualAction] = useState(false);
  const [contextualActionType, setContextualActionType] = useState<'barcode' | 'invoice' | null>(null);
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);

  // Função para verificar se o conteúdo do clipboard é um código de barras
  const isBarcode = (text: string): boolean => {
    // Padrões comuns de código de barras brasileiros (boleto, PIX, etc.)
    // Código de barras de boleto: 44 dígitos numéricos
    const boletoPattern = /^\d{44}$/;
    // Linha digitável: formato com pontos e traços
    const linhaDigitavelPattern = /^\d{5}\.\d{5}\s\d{5}\.\d{6}\s\d{5}\.\d{6}\s\d{1}\s\d{14}$/;
    // PIX: pode ter vários formatos, mas geralmente tem caracteres alfanuméricos
    const pixPattern = /^[A-Z0-9]{25,35}$/i;
    
    const cleanText = text.trim().replace(/\s/g, '');
    
    return (
      boletoPattern.test(cleanText) ||
      linhaDigitavelPattern.test(text) ||
      pixPattern.test(cleanText) ||
      (cleanText.length >= 20 && cleanText.length <= 50 && /^[0-9]+$/.test(cleanText))
    );
  };

  const checkClipboard = async () => {
    try {
      // Verificar se a API de clipboard está disponível
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        return;
      }

      const text = await navigator.clipboard.readText();
      
      if (text && text.trim()) {
        setClipboardContent(text);
        
        // Verificar se é um código de barras
        if (isBarcode(text)) {
          setContextualActionType('barcode');
          setShowContextualAction(true);
        }
      }
    } catch (error) {
      // Erro ao ler clipboard (pode ser por permissões ou quando não há conteúdo)
      // Não fazer nada, é esperado em alguns casos
      console.debug('Erro ao ler clipboard:', error);
    }
  };

  const dismissContextualAction = () => {
    setShowContextualAction(false);
    setContextualActionType(null);
  };

  // Verificar clipboard periodicamente quando o usuário está logado
  useEffect(() => {
    if (!user) {
      setClipboardContent(null);
      setShowContextualAction(false);
      return;
    }

    // Verificar clipboard inicialmente
    checkClipboard();

    // Verificar clipboard a cada 2 segundos
    const interval = setInterval(() => {
      checkClipboard();
    }, 2000);

    // Também verificar quando a janela recebe foco
    const handleFocus = () => {
      checkClipboard();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Detectar notificações de fatura fechada (simulado por enquanto)
  // Em produção, isso viria de um sistema de notificações push ou websocket
  useEffect(() => {
    if (!user) return;

    // Exemplo: escutar eventos customizados de notificações
    const handleNotification = (event: CustomEvent) => {
      if (event.detail.type === 'invoice_closed') {
        setContextualActionType('invoice');
        setShowContextualAction(true);
        setPendingDeepLink(`/cards/${event.detail.cardId}/faturas/${event.detail.faturaId}/pagar`);
      }
    };

    window.addEventListener('invoice-closed' as any, handleNotification as EventListener);

    return () => {
      window.removeEventListener('invoice-closed' as any, handleNotification as EventListener);
    };
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        clipboardContent,
        hasBarcodeInClipboard: contextualActionType === 'barcode',
        checkClipboard,
        showContextualAction,
        contextualActionType,
        dismissContextualAction,
        pendingDeepLink,
        setPendingDeepLink,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
