import { ReactNode, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Table,
  TrendingUp,
  Upload,
  Wallet,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", path: "/transactions", icon: Table },
  { label: "Importar extrato", path: "/import-statement", icon: Upload },
  { label: "Projeções", path: "/budget-projection", icon: TrendingUp },
  { label: "Patrimônios", path: "/assets", icon: PiggyBank },
  { label: "Configurações", path: "/settings", icon: Settings },
  { label: "Chat IA", path: "/chat", icon: MessageSquarePlus },
];

function SidebarNavigation({
  currentPath,
  onNavigate,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center gap-3 border-b border-border px-4", collapsed && "justify-center px-0")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">FinanceTrack</p>
            <p className="text-lg font-semibold text-foreground">Painel</p>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1 py-5", collapsed ? "px-2" : "px-3")}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                onNavigate(item.path);
                onClose?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                "hover:bg-primary/10 hover:text-primary",
                collapsed && "justify-center px-2",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full gap-2", collapsed ? "justify-center" : "justify-start")}
          onClick={onToggleCollapse}
        >
          <CollapseIcon className="h-4 w-4" />
          {!collapsed && <span>Recolher menu</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full gap-2", collapsed ? "justify-center" : "justify-start")}
          onClick={() => {
            onClose?.();
            onNavigate("/__logout");
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({
  title,
  description,
  actions,
  children,
  contentClassName,
}: AppLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigate = async (path: string) => {
    if (path === "/__logout") {
      await signOut();
      navigate("/login", { replace: true });
      return;
    }

    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const sidebar = useMemo(
    () => (
      <SidebarNavigation
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        onClose={() => setMobileSidebarOpen(false)}
        collapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
    ),
    [location.pathname, isCollapsed]
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card lg:flex lg:flex-col transition-[width] duration-200",
          isCollapsed ? "w-[64px]" : "w-52"
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative h-full w-64 border-r border-border bg-background shadow-lg">
            <SidebarNavigation
              currentPath={location.pathname}
              onNavigate={handleNavigate}
              onClose={() => setMobileSidebarOpen(false)}
              collapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-3 py-3 backdrop-blur lg:px-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-foreground md:text-xl">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            <ThemeToggle />
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto px-3 py-6 lg:px-5", "space-y-6", contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}

