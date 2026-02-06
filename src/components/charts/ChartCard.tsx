import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  actions?: ReactNode;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  titleClassName,
  actions,
}: ChartCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden border-border/50",
      "bg-background/50 backdrop-blur-sm",
      "transition-all duration-300",
      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
      className
    )}>
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="relative flex flex-row items-start justify-between gap-3 pb-4 border-b border-border/50">
        <div className="flex-1 min-w-0">
          <CardTitle className={cn("text-lg font-bold tracking-tight text-foreground", titleClassName)}>
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground mt-1.5">
              {description}
            </CardDescription>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </CardHeader>
      <CardContent className="relative pt-6">{children}</CardContent>
    </Card>
  );
}

