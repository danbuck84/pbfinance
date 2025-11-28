import { useState } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { LancamentoForm } from '@/components/lancamentos/LancamentoForm';
import { LancamentosList } from '@/components/lancamentos/LancamentosList';
import { Card } from '@/components/ui/card';

export default function Lancamentos() {
  const { transacoes, config, addTransacao, addTransacaoParcelada, updateTransacao, deleteTransacao } = useFirestore();

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Lançar Nova Transação</h2>
        <LancamentoForm
          config={config}
          onAddTransacao={addTransacao}
          onAddTransacaoParcelada={addTransacaoParcelada}
        />
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Lançamentos</h2>
        <LancamentosList
          transacoes={transacoes}
          onUpdateTransacao={updateTransacao}
          onDeleteTransacao={deleteTransacao}
          config={config}
        />
      </Card>
    </div>
  );
}
