import { useAppContext } from '@/hooks/useAppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, CreditCard, FileText } from 'lucide-react';
import { CONTEXTUAL, BUTTONS } from '@/lib/microcopy';
import { cn } from '@/lib/utils';

export function ContextualActions() {
  const {
    showContextualAction,
    contextualActionType,
    clipboardContent,
    dismissContextualAction,
    pendingDeepLink,
    setPendingDeepLink,
  } = useAppContext();
  const navigate = useNavigate();

  if (!showContextualAction || !contextualActionType) {
    return null;
  }

  const handleAction = () => {
    if (contextualActionType === 'barcode') {
      // Navegar para página de pagamento com o código de barras
      navigate('/transactions/new?type=barcode&code=' + encodeURIComponent(clipboardContent || ''));
      dismissContextualAction();
    } else if (contextualActionType === 'invoice' && pendingDeepLink) {
      // Navegar para deep link da fatura
      navigate(pendingDeepLink);
      setPendingDeepLink(null);
      dismissContextualAction();
    }
  };

  const getIcon = () => {
    switch (contextualActionType) {
      case 'barcode':
        return <FileText className="h-5 w-5" />;
      case 'invoice':
        return <CreditCard className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (contextualActionType) {
      case 'barcode':
        return CONTEXTUAL.barcodeDetected;
      case 'invoice':
        return CONTEXTUAL.invoiceClosed;
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (contextualActionType) {
      case 'barcode':
        return 'Detectamos um código de barras no seu clipboard. Deseja pagar agora?';
      case 'invoice':
        return CONTEXTUAL.invoiceClosedMessage;
      default:
        return '';
    }
  };

  const getActionLabel = () => {
    switch (contextualActionType) {
      case 'barcode':
        return CONTEXTUAL.payBarcode;
      case 'invoice':
        return CONTEXTUAL.goToPayment;
      default:
        return BUTTONS.continue;
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5 duration-300">
      <Card className="border-primary/50 bg-background shadow-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 text-primary">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{getTitle()}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {getDescription()}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAction}
                  className="flex-1"
                >
                  {getActionLabel()}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={dismissContextualAction}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
