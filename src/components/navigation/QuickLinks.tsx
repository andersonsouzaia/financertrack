import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Target,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickLink {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const CONTEXTUAL_LINKS: Record<string, QuickLink[]> = {
  "/transactions": [
    {
      label: "Cartões",
      path: "/cards",
      icon: CreditCard,
      description: "Ver gastos por cartão",
    },
    {
      label: "Metas Mensais",
      path: "/monthly-goals",
      icon: Target,
      description: "Acompanhar metas do mês",
    },
    {
      label: "Resumo Mensal",
      path: "/monthly-summary",
      icon: FileText,
      description: "Ver análise completa do mês",
    },
  ],
  "/dashboard": [
    {
      label: "Transações",
      path: "/transactions",
      icon: FileText,
      description: "Ver todas as transações",
    },
    {
      label: "Cartões",
      path: "/cards",
      icon: CreditCard,
      description: "Gerenciar cartões",
    },
    {
      label: "Projeções",
      path: "/budget-projection",
      icon: TrendingUp,
      description: "Ver projeções futuras",
    },
  ],
  "/cards": [
    {
      label: "Transações",
      path: "/transactions",
      icon: FileText,
      description: "Ver transações por cartão",
    },
    {
      label: "Metas",
      path: "/monthly-goals",
      icon: Target,
      description: "Acompanhar metas",
    },
  ],
};

interface QuickLinksProps {
  links?: QuickLink[];
  className?: string;
}

export function QuickLinks({ links, className }: QuickLinksProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const contextualLinks = links || CONTEXTUAL_LINKS[location.pathname] || [];

  if (contextualLinks.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Links Rápidos
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {contextualLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button
              key={link.path}
              variant="outline"
              size="sm"
              onClick={() => navigate(link.path)}
              className="gap-2 h-9"
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
              <ArrowRight className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
