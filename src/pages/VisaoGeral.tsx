import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisaoGeralCards } from '@/components/visao-geral/VisaoGeralCards';
import { AnalisesDetalhadas } from '@/components/visao-geral/AnalisesDetalhadas';
import { GraficosCategorias } from '@/components/visao-geral/GraficosCategorias';
import { GraficosLimites } from '@/components/visao-geral/GraficosLimites';
import { GraficosSaldos } from '@/components/visao-geral/GraficosSaldos';
import type { Transacao } from '@/lib/firebase';

type FiltroVisao = 'geral' | 'contas' | 'cartoes' | 'beneficios';

export default function VisaoGeral() {
  const { config, transacoes } = useFirestore();
  const [filtro, setFiltro] = useState<FiltroVisao>('geral');
  
  // Filtro de data - padrão: mês atual
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  
  const [dataFim, setDataFim] = useState<Date>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  });

  // Filtrar por tipo de fonte
  const transacoesPorFonte = useMemo(() => {
    if (filtro === 'geral') return transacoes;

    const contas = config.contas?.map(c => c.nome) || [];
    const cartoes = config.cartoes?.map(c => c.nome) || [];
    const beneficios = config.beneficios?.map(b => b.nome) || [];

    return transacoes.filter((t: Transacao) => {
      if (filtro === 'contas') return contas.includes(t.fonte);
      if (filtro === 'cartoes') return cartoes.includes(t.fonte);
      if (filtro === 'beneficios') return beneficios.includes(t.fonte);
      return true;
    });
  }, [transacoes, filtro, config]);

  // Filtrar por data
  const transacoesFiltradas = useMemo(() => {
    return transacoesPorFonte.filter((t: Transacao) => {
      const dataTransacao = new Date(t.data + 'T00:00:00');
      return dataTransacao >= dataInicio && dataTransacao <= dataFim;
    });
  }, [transacoesPorFonte, dataInicio, dataFim]);

  // Transações para análises (sem ajustes)
  const transacoesParaAnalise = useMemo(() => {
    return transacoesFiltradas.filter((t: Transacao) => t.subcategoria !== 'Ajuste');
  }, [transacoesFiltradas]);

  const aplicarFiltroRapido = (tipo: 'mes_atual' | 'mes_passado' | 'ultimos_30' | 'ultimos_90') => {
    const hoje = new Date();
    
    switch (tipo) {
      case 'mes_atual':
        setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
        setDataFim(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
        break;
      case 'mes_passado':
        setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
        setDataFim(new Date(hoje.getFullYear(), hoje.getMonth(), 0));
        break;
      case 'ultimos_30':
        setDataInicio(new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000));
        setDataFim(hoje);
        break;
      case 'ultimos_90':
        setDataInicio(new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000));
        setDataFim(hoje);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo financeiro e análises</p>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Período de Análise</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido('mes_atual')}>
            Mês Atual
          </Button>
          <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido('mes_passado')}>
            Mês Passado
          </Button>
          <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido('ultimos_30')}>
            Últimos 30 dias
          </Button>
          <Button size="sm" variant="outline" onClick={() => aplicarFiltroRapido('ultimos_90')}>
            Últimos 90 dias
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data Início</Label>
            <Input
              type="date"
              value={dataInicio.toISOString().split('T')[0]}
              onChange={(e) => setDataInicio(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>
          <div>
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={dataFim.toISOString().split('T')[0]}
              onChange={(e) => setDataFim(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>
        </div>
      </Card>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as FiltroVisao)} className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start md:justify-center gap-1 p-1">
          <TabsTrigger value="geral" className="flex-1 min-w-[80px] text-xs md:text-sm">Geral</TabsTrigger>
          <TabsTrigger value="contas" className="flex-1 min-w-[80px] text-xs md:text-sm">Contas</TabsTrigger>
          <TabsTrigger value="cartoes" className="flex-1 min-w-[80px] text-xs md:text-sm">Cartões</TabsTrigger>
          <TabsTrigger value="beneficios" className="flex-1 min-w-[80px] text-xs md:text-sm">Benefícios</TabsTrigger>
        </TabsList>
      </Tabs>

      <VisaoGeralCards config={config} transacoes={transacoesFiltradas} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Análises do Período</h2>
        <AnalisesDetalhadas transacoes={transacoesParaAnalise} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Gastos por Categoria</h2>
          <GraficosCategorias transacoes={transacoesParaAnalise} />
        </Card>

        <Card className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Faturas vs. Limites</h2>
          <GraficosLimites config={config} transacoes={transacoesFiltradas} />
        </Card>

        <Card className="p-4 md:p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Saldos Atuais</h2>
          <GraficosSaldos config={config} transacoes={transacoesFiltradas} />
        </Card>
      </div>
    </div>
  );
}
