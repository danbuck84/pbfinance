import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calcularFaturaCartao } from '@/lib/utils-finance';
import type { Config, Transacao } from '@/lib/firebase';

export const GraficosLimites = ({ config, transacoes }: { config: Config; transacoes: Transacao[] }) => {
  const data = useMemo(() => {
    return (config.cartoes || [])
      .filter(c => c.limite > 0)
      .map(cartao => ({
        nome: cartao.nome,
        fatura: calcularFaturaCartao(transacoes, cartao.nome),
        limite: cartao.limite,
      }));
  }, [config.cartoes, transacoes]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum cartão configurado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis />
        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
        <Legend />
        <Bar dataKey="fatura" fill="#ef4444" name="Fatura Atual" />
        <Bar dataKey="limite" fill="#64748b" name="Limite Total" />
      </BarChart>
    </ResponsiveContainer>
  );
};
