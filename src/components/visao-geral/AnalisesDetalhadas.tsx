import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart } from 'lucide-react';
import { formatBRL } from '@/lib/utils-finance';
import type { Transacao } from '@/lib/firebase';

export const AnalisesDetalhadas = ({ transacoes }: { transacoes: Transacao[] }) => {
  const analises = useMemo(() => {
    const hoje = new Date();

    const entradas = transacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);

    const saidas = transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);

    const saldo = entradas - saidas;

    const diasPeriodo = transacoes.length > 0 ? Math.max(
      1,
      Math.ceil(
        (Math.max(...transacoes.map(t => new Date(t.data + 'T00:00:00').getTime())) -
         Math.min(...transacoes.map(t => new Date(t.data + 'T00:00:00').getTime()))) /
        (1000 * 60 * 60 * 24)
      ) + 1
    ) : 1;

    const mediaGastoDiario = saidas / diasPeriodo;

    const categoriasMaisGastas = transacoes
      .filter(t => 
        t.tipo === 'saida' && 
        t.subcategoria !== 'Pagar Fatura' && 
        t.subcategoria !== 'Ajuste'
      )
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    const topCategoria = Object.entries(categoriasMaisGastas)
      .sort(([, a], [, b]) => b - a)[0];

    const totalTransacoes = transacoes.length;

    const gastoPorPessoa = transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => {
        acc[t.pessoa] = (acc[t.pessoa] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    return {
      entradas,
      saidas,
      saldo,
      mediaGastoDiario,
      topCategoria: topCategoria ? { nome: topCategoria[0], valor: topCategoria[1] } : null,
      totalTransacoes,
      gastoPorPessoa,
    };
  }, [transacoes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-success" />
          <h3 className="font-semibold">Entradas do Período</h3>
        </div>
        <p className="text-2xl font-bold text-success">R$ {formatBRL(analises.entradas)}</p>
        <p className="text-xs text-muted-foreground mt-1">Total de receitas</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">Saídas do Período</h3>
        </div>
        <p className="text-2xl font-bold text-destructive">R$ {formatBRL(analises.saidas)}</p>
        <p className="text-xs text-muted-foreground mt-1">Total de gastos</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className={`h-5 w-5 ${analises.saldo >= 0 ? 'text-success' : 'text-destructive'}`} />
          <h3 className="font-semibold">Saldo do Período</h3>
        </div>
        <p className={`text-2xl font-bold ${analises.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
          R$ {formatBRL(analises.saldo)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Entradas - Saídas</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Média Diária</h3>
        </div>
        <p className="text-2xl font-bold text-primary">R$ {formatBRL(analises.mediaGastoDiario)}</p>
        <p className="text-xs text-muted-foreground mt-1">Gasto médio por dia</p>
      </Card>

      {analises.topCategoria && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Categoria Top</h3>
          </div>
          <p className="text-lg font-bold text-accent">{analises.topCategoria.nome}</p>
          <p className="text-sm text-muted-foreground">R$ {formatBRL(analises.topCategoria.valor)}</p>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Total de Transações</h3>
        </div>
        <p className="text-2xl font-bold">{analises.totalTransacoes}</p>
        <p className="text-xs text-muted-foreground mt-1">Movimentações no mês</p>
      </Card>

      {Object.entries(analises.gastoPorPessoa).map(([pessoa, valor]) => (
        <Card key={pessoa} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Gastos - {pessoa}</h3>
          </div>
          <p className="text-xl font-bold">R$ {formatBRL(valor)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total no mês</p>
        </Card>
      ))}
    </div>
  );
};
