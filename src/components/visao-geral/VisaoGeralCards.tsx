import { Card } from '@/components/ui/card';
import { calcularSaldoConta, calcularFaturaCartao, formatBRL } from '@/lib/utils-finance';
import type { Config, Transacao } from '@/lib/firebase';

export const VisaoGeralCards = ({ config, transacoes }: { config: Config; transacoes: Transacao[] }) => {
  const saldoContas = (config.contas || []).reduce((acc, c) => acc + calcularSaldoConta(transacoes, c.nome), 0);
  const saldoBeneficios = (config.beneficios || []).reduce((acc, b) => acc + calcularSaldoConta(transacoes, b.nome), 0);
  const faturas = (config.cartoes || []).reduce((acc, c) => acc + calcularFaturaCartao(transacoes, c.nome), 0);
  const limiteTotal = (config.cartoes || []).reduce((acc, c) => acc + c.limite, 0);
  const total = saldoContas + saldoBeneficios + limiteTotal - faturas;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4"><h3 className="text-sm font-medium text-muted-foreground">Saldo Contas</h3><p className="text-2xl font-bold text-primary">R$ {formatBRL(saldoContas)}</p></Card>
      <Card className="p-4"><h3 className="text-sm font-medium text-muted-foreground">Saldo Benefícios</h3><p className="text-2xl font-bold text-success">R$ {formatBRL(saldoBeneficios)}</p></Card>
      <Card className="p-4"><h3 className="text-sm font-medium text-muted-foreground">Faturas</h3><p className="text-2xl font-bold text-destructive">R$ {formatBRL(faturas)}</p></Card>
      <Card className="p-4"><h3 className="text-sm font-medium text-muted-foreground">Total Disponível</h3><p className="text-2xl font-bold text-success">R$ {formatBRL(total)}</p></Card>
    </div>
  );
};
