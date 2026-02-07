import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transações",
  "/cards": "Cartões",
  "/monthly-goals": "Metas Mensais",
  "/financial-goals": "Metas Financeiras",
  "/budget-projection": "Projeções",
  "/compound-interest": "Calculadora de Juros",
  "/monthly-summary": "Resumo Mensal",
  "/annual-summary": "Resumo Anual",
  "/assets": "Patrimônios",
  "/chat": "Chat IA",
  "/import-statement": "Importar Extrato",
  "/settings": "Configurações",
  "/tutorials": "Tutoriais",
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => {
    if (items) return items;

    const paths = location.pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    // Se não estiver no dashboard, adicionar dashboard como primeiro item
    if (location.pathname !== "/dashboard") {
      crumbs.push({ label: "Dashboard", path: "/dashboard" });
    }

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = ROUTE_LABELS[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
      // Evitar duplicatas
      if (!crumbs.some((c) => c.path === currentPath)) {
        crumbs.push({
          label,
          path: currentPath,
        });
      }
    });

    return crumbs;
  }, [location.pathname, items]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className={cn("flex items-center gap-2 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.path || index} className="flex items-center gap-2">
              {index === 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => crumb.path && navigate(crumb.path)}
                  className={cn(
                    "h-7 px-2 gap-1.5",
                    isLast && "text-foreground font-semibold"
                  )}
                >
                  <Home className="h-3.5 w-3.5" />
                  {crumb.label}
                </Button>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  {isLast ? (
                    <span className="text-foreground font-semibold">{crumb.label}</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => crumb.path && navigate(crumb.path)}
                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {crumb.label}
                    </Button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
