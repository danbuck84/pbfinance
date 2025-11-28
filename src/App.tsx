import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/components/Layout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
