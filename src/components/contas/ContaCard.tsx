import { Card } from '@/components/ui/card';
import { calcularSaldoConta, formatBRL } from '@/lib/utils-finance';
import type { Conta, Transacao } from '@/lib/firebase';

interface ContaCardProps {
  conta: Conta;
  transacoes: Transacao[];
}

export const ContaCard = ({ conta, transacoes }: ContaCardProps) => {
  const saldo = calcularSaldoConta(transacoes, conta.nome);

  return (
    <Card className="p-6">
      <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{conta.nome}</h3>
        <p className="text-sm text-muted-foreground">
          Disponível para: {conta.disponivelPara?.join(', ') || 'Todos'}
        </p>
      </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
          <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
            R$ {formatBRL(saldo)}
          </p>
        </div>
      </div>
    </Card>
  );
};
