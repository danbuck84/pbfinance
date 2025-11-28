import { formatBRL, formatDate } from '@/lib/utils-finance';
import type { Transacao } from '@/lib/firebase';

interface LancamentoItemProps {
  transacao: Transacao;
  onClick: () => void;
}

export const LancamentoItem = ({ transacao, onClick }: LancamentoItemProps) => {
  const isEntrada = transacao.tipo === 'entrada';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{transacao.descricao}</p>
        <p className="text-sm text-muted-foreground truncate">
          {formatDate(transacao.data)} | {transacao.categoria} / {transacao.subcategoria} ({transacao.fonte}) | {transacao.pessoa}
          {transacao.parcela && ` | ${transacao.parcela}`}
        </p>
      </div>
      <p className={`font-semibold text-lg ml-4 flex-shrink-0 ${isEntrada ? 'text-success' : 'text-destructive'}`}>
        {isEntrada ? '+' : '-'} R$ {formatBRL(transacao.valor)}
      </p>
    </div>
  );
};
