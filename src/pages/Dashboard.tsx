import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Settings, LogOut, Plus, Upload } from "lucide-react";
import { BalanceCard } from "@/components/Dashboard/BalanceCard";
import { ExpensesCard } from "@/components/Dashboard/ExpensesCard";
import { MonthStatusCard } from "@/components/Dashboard/MonthStatusCard";
import { EmergencyFundCard } from "@/components/Dashboard/EmergencyFundCard";
import { TransactionsSpreadsheet } from "@/components/Dashboard/TransactionsSpreadsheet";
import { ChatIA } from "@/components/Dashboard/ChatIA";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-heading font-bold">FinanceTrack</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Olá, {user.email?.split('@')[0]}!
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/import-statement')} className="hidden md:flex">
                <Upload className="w-4 h-4 mr-2" />
                Importar Extrato
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/transactions')} className="hidden sm:flex">
                📊 Tabela Completa
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/add-transaction')} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Gasto
              </Button>
              <Button variant="default" size="icon" onClick={() => navigate('/add-transaction')} className="sm:hidden">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Cards de Resumo */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <BalanceCard />
          <ExpensesCard />
          <EmergencyFundCard />
          <MonthStatusCard />
        </div>

        {/* Tabela de Transações Excel-Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold mb-4">Planilha de Transações</h2>
          <TransactionsSpreadsheet />
        </div>

        {/* Chat IA */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold mb-4">Chat IA</h2>
          <ChatIA />
        </div>
      </main>
    </div>
  );
}
