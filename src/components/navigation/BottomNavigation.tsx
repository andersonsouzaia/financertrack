import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Table, CreditCard, Target, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

const MAIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Transações', path: '/transactions', icon: Table },
  { label: 'Cartões', path: '/cards', icon: CreditCard },
  { label: 'Metas', path: '/monthly-goals', icon: Target },
];

const MORE_MENU_ITEMS = [
  { label: 'Importar Extrato', path: '/import-statement' },
  { label: 'Metas Financeiras', path: '/financial-goals' },
  { label: 'Projeções', path: '/budget-projection' },
  { label: 'Patrimônios', path: '/assets' },
  { label: 'Resumo Mensal', path: '/monthly-summary' },
  { label: 'Resumo Anual', path: '/annual-summary' },
  { label: 'Chat IA', path: '/chat' },
  { label: 'Configurações', path: '/settings' },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={cn(
                'flex h-auto flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              onClick={() => handleNavigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Button>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex h-auto flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-200',
                MORE_MENU_ITEMS.some((item) => location.pathname.startsWith(item.path))
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-2 w-56">
            {MORE_MENU_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  location.pathname.startsWith(item.path) && 'bg-accent font-semibold'
                )}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
