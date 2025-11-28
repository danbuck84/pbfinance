import { useParams, useNavigate } from 'react-router-dom';
import { useFirestore } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { LancamentosList } from '@/components/lancamentos/LancamentosList';
import { calcularSaldoConta, formatBRL } from '@/lib/utils-finance';

export default function BeneficioDetalhes() {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { config, updateConfig, transacoes, updateTransacao, deleteTransacao } = useFirestore();
  const { toast } = useToast();
  
  const beneficio = config.beneficios?.find(b => b.nome === decodeURIComponent(nome || ''));
  
  const [nomeEditado, setNomeEditado] = useState('');

  useEffect(() => {
    if (beneficio) {
      setNomeEditado(beneficio.nome || '');
    }
  }, [beneficio]);

  const transacoesBeneficio = useMemo(() => {
    return transacoes.filter(t => t.fonte === beneficio?.nome);
  }, [transacoes, beneficio?.nome]);

  const saldoAtual = useMemo(() => {
    if (!beneficio) return 0;
    return calcularSaldoConta(transacoes, beneficio.nome);
  }, [transacoes, beneficio]);

  if (!beneficio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/beneficios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Benefício não encontrado</h1>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!nomeEditado.trim()) {
      toast({ title: 'Nome do benefício é obrigatório', variant: 'destructive' });
      return;
    }

    const beneficios = config.beneficios?.map(b =>
      b.nome === beneficio.nome
        ? { ...b, nome: nomeEditado }
        : b
    ) || [];

    try {
      await updateConfig({ beneficios });
      toast({ title: 'Benefício atualizado!' });
      navigate('/beneficios');
    } catch (error) {
      toast({ title: 'Erro ao atualizar benefício', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remover benefício "${beneficio.nome}"?`)) {
      try {
        await updateConfig({ beneficios: config.beneficios?.filter(b => b.nome !== beneficio.nome) || [] });
        toast({ title: 'Benefício removido!' });
        navigate('/beneficios');
      } catch (error) {
        toast({ title: 'Erro ao remover benefício', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/beneficios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Benefício</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Nome do Benefício</Label>
            <Input
              value={nomeEditado}
              onChange={(e) => setNomeEditado(e.target.value)}
              placeholder="Nome do benefício"
            />
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Atual</p>
            <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {formatBRL(saldoAtual)}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Movimentações</h2>
        <LancamentosList
          transacoes={transacoesBeneficio}
          onUpdateTransacao={updateTransacao}
          onDeleteTransacao={deleteTransacao}
          config={config}
        />
      </Card>
    </div>
  );
}
