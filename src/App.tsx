import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppContextProvider } from "@/contexts/AppContext";
import { PageLoader } from "@/components/ui/page-loader";
import { CommandPalette } from "@/components/global/CommandPalette";
import { ContextualActions } from "@/components/contextual/ContextualActions";

// Lazy load de rotas públicas (carregadas imediatamente)
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load de rotas protegidas (carregadas sob demanda)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const AddTransaction = lazy(() => import("./pages/AddTransaction"));
const Transactions = lazy(() => import("./pages/Transactions"));
const ImportStatement = lazy(() => import("./pages/ImportStatement"));
const BudgetProjection = lazy(() => import("./pages/BudgetProjection"));
const Assets = lazy(() => import("./pages/Assets"));
const Chat = lazy(() => import("./pages/Chat"));
const Cards = lazy(() => import("./pages/Cards"));
const CardDetails = lazy(() => import("./pages/CardDetails"));
const MonthlyGoals = lazy(() => import("./pages/MonthlyGoals"));
const FinancialGoals = lazy(() => import("./pages/FinancialGoals"));
const CompoundInterest = lazy(() => import("./pages/CompoundInterest"));
const AnnualSummary = lazy(() => import("./pages/AnnualSummary"));
const MonthlySummary = lazy(() => import("./pages/MonthlySummary"));
const Tutorials = lazy(() => import("./pages/Tutorials"));
const Security = lazy(() => import("./pages/Security"));

const EmergencyFund = lazy(() => import("./pages/EmergencyFund"));

// Configuração otimizada do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tempo de garbage collection (antigo cacheTime)
      refetchOnWindowFocus: false, // Não refetch automático ao focar na janela
      refetchOnReconnect: true, // Refetch ao reconectar
      retry: 1, // Apenas 1 tentativa em caso de erro
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppContextProvider>
            <CommandPalette />
            <ContextualActions />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-transaction" element={<AddTransaction />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/import-statement" element={<ImportStatement />} />
                <Route path="/budget-projection" element={<BudgetProjection />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/cards/:id" element={<CardDetails />} />
                <Route path="/monthly-goals" element={<MonthlyGoals />} />
                <Route path="/financial-goals" element={<FinancialGoals />} />
                <Route path="/compound-interest" element={<CompoundInterest />} />
                <Route path="/emergency-fund" element={<EmergencyFund />} />
                <Route path="/annual-summary" element={<AnnualSummary />} />
                <Route path="/monthly-summary" element={<MonthlySummary />} />
                <Route path="/tutorials" element={<Tutorials />} />
                <Route path="/security" element={<Security />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
