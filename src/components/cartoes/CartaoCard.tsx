import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calcularFaturaCartao, calcularLimiteDisponivel, calcularDiasAteVencimento, formatBRL } from '@/lib/utils-finance';
import type { Cartao, Transacao } from '@/lib/firebase';

interface CartaoCardProps {
  cartao: Cartao;
  transacoes: Transacao[];
  onPagarFatura: () => void;
}

export const CartaoCard = ({ cartao, transacoes, onPagarFatura }: CartaoCardProps) => {
  const fatura = calcularFaturaCartao(transacoes, cartao.nome);
  const limiteDisponivel = calcularLimiteDisponivel(cartao, fatura);
  const diasVencimento = calcularDiasAteVencimento(cartao.diaVencimento);

  return (
    <Card className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Fatura Atual</p>
          <p className="text-2xl font-bold text-destructive">R$ {formatBRL(fatura)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Limite Disponível</p>
          <p className="text-2xl font-bold text-success">R$ {formatBRL(limiteDisponivel)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Limite Total</p>
          <p className="text-lg font-semibold">R$ {formatBRL(cartao.limite)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vencimento</p>
          <p className="text-lg font-semibold">{diasVencimento} dias</p>
        </div>
      </div>
      <Button onClick={onPagarFatura} className="w-full">Pagar Fatura</Button>
    </Card>
  );
};
