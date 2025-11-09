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
    <Card className={cn("shadow-card-hover bg-card border-border", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
        <div>
          <CardTitle className={cn("text-base font-semibold text-foreground", titleClassName)}>
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

