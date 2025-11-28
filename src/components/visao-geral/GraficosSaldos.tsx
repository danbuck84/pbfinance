import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcularSaldoConta } from '@/lib/utils-finance';
import type { Config, Transacao } from '@/lib/firebase';

export const GraficosSaldos = ({ config, transacoes }: { config: Config; transacoes: Transacao[] }) => {
  const data = useMemo(() => {
    const contas = (config.contas || []).map(c => ({
      nome: c.nome,
      saldo: calcularSaldoConta(transacoes, c.nome),
    }));
    
    const beneficios = (config.beneficios || []).map(b => ({
      nome: b.nome,
      saldo: calcularSaldoConta(transacoes, b.nome),
    }));

    return [...contas, ...beneficios];
  }, [config.contas, config.beneficios, transacoes]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhuma conta ou benefício configurado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="nome" type="category" width={120} />
        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
        <Bar dataKey="saldo" name="Saldo Atual">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.saldo >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
