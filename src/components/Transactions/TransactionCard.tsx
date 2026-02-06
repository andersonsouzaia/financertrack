import { useState } from "react";
import { Edit2, Trash2, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface TransactionCardProps {
  transaction: any;
  onEdit?: (transaction: any) => void;
  onDelete?: (transactionId: string) => void;
  showDay?: boolean;
  compact?: boolean;
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  showDay = false,
  compact = false,
}: TransactionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isEntrada = transaction.tipo === "entrada";
  const valor = Number(transaction.valor_original) || 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm",
        "transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        compact ? "p-3" : "p-4"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
            compact ? "h-10 w-10" : "h-12 w-12",
            isEntrada
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg"
              : "bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg"
          )}
        >
          {isEntrada ? (
            <TrendingUp className={compact ? "h-5 w-5" : "h-6 w-6"} />
          ) : (
            <TrendingDown className={compact ? "h-5 w-5" : "h-6 w-6"} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {transaction.categoria?.icone && (
                  <span className="text-base shrink-0">
                    {transaction.categoria.icone}
                  </span>
                )}
                <h4
                  className={cn(
                    "font-semibold text-foreground truncate",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {transaction.descricao}
                </h4>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {showDay && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Dia {transaction.dia}</span>
                  </div>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                  {transaction.categoria?.nome || "Sem categoria"}
                </span>
                {transaction.cartao?.nome && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {transaction.cartao.nome}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {transaction.tipo === "entrada"
                    ? "Entrada"
                    : transaction.tipo === "saida_fixa"
                    ? "Saída Fixa"
                    : "Gasto Diário"}
                </span>
              </div>
            </div>

            {/* Value and Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p
                  className={cn(
                    "font-bold tabular-nums",
                    compact ? "text-base" : "text-lg",
                    isEntrada
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {isEntrada ? "+" : "-"} R${" "}
                  {valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Actions Menu */}
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 shrink-0 transition-opacity duration-200",
                        isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(transaction)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(transaction.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Observation */}
          {transaction.observacao && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {Array.isArray(transaction.observacao) 
                  ? transaction.observacao[0]?.observacao 
                  : transaction.observacao}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
