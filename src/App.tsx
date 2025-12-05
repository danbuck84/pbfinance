import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import Lancamentos from "./pages/Lancamentos";
import Contas from "./pages/Contas";
import ContaDetalhes from "./pages/ContaDetalhes";
import Beneficios from "./pages/Beneficios";
import BeneficioDetalhes from "./pages/BeneficioDetalhes";
import Cartoes from "./pages/Cartoes";
import CartaoDetalhes from "./pages/CartaoDetalhes";
import VisaoGeral from "./pages/VisaoGeral";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login

const queryClient = new QueryClient();

// Componente para proteger rotas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Lancamentos />} />
                    <Route path="/contas" element={<Contas />} />
                    <Route path="/contas/:nome" element={<ContaDetalhes />} />
                    <Route path="/beneficios" element={<Beneficios />} />
                    <Route path="/beneficios/:nome" element={<BeneficioDetalhes />} />
                    <Route path="/cartoes" element={<Cartoes />} />
                    <Route path="/cartoes/:nome" element={<CartaoDetalhes />} />
                    <Route path="/visao-geral" element={<VisaoGeral />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
