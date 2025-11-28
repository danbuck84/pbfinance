import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Transacao } from '@/lib/firebase';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b', '#64748b', '#ef4444', '#3b82f6'];

export const GraficosCategorias = ({ transacoes }: { transacoes: Transacao[] }) => {
  const data = useMemo(() => {
    const gastos = transacoes.filter(t => 
      t.tipo === 'saida' && 
      t.subcategoria !== 'Pagar Fatura' && 
      t.subcategoria !== 'Ajuste'
    );
    const categorias: Record<string, number> = {};
    
    gastos.forEach(g => {
      if (!categorias[g.categoria]) {
        categorias[g.categoria] = 0;
      }
      categorias[g.categoria] += g.valor;
    });

    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transacoes]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum gasto registrado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
