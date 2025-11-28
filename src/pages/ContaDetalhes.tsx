import { useParams, useNavigate } from 'react-router-dom';
import { useFirestore } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { LancamentosList } from '@/components/lancamentos/LancamentosList';
import { calcularSaldoConta, formatBRL } from '@/lib/utils-finance';

const TIPOS_CONTA = ['Corrente', 'Poupança', 'Financiamento', 'Investimento'];

export default function ContaDetalhes() {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { config, updateConfig, transacoes, updateTransacao, deleteTransacao } = useFirestore();
  const { toast } = useToast();
  
  const conta = config.contas?.find(c => c.nome === decodeURIComponent(nome || ''));
  
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    agencia: '',
    numeroConta: '',
    digito: '',
  });

  useEffect(() => {
    if (conta) {
      setFormData({
        nome: conta.nome || '',
        tipo: conta.tipo || '',
        agencia: conta.agencia || '',
        numeroConta: conta.numeroConta || '',
        digito: conta.digito || '',
      });
    }
  }, [conta]);

  const transacoesConta = useMemo(() => {
    return transacoes.filter(t => t.fonte === conta?.nome);
  }, [transacoes, conta?.nome]);

  const saldo = useMemo(() => {
    return calcularSaldoConta(transacoes, conta?.nome || '');
  }, [transacoes, conta?.nome]);

  if (!conta) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/contas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Conta não encontrada</h1>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({ title: 'Nome da conta é obrigatório', variant: 'destructive' });
      return;
    }

    const contas = config.contas?.map(c =>
      c.nome === conta.nome
        ? {
            ...c,
            nome: formData.nome,
            tipo: formData.tipo,
            agencia: formData.agencia,
            numeroConta: formData.numeroConta,
            digito: formData.digito,
          }
        : c
    ) || [];

    try {
      await updateConfig({ contas });
      toast({ title: 'Conta atualizada!' });
      navigate('/contas');
    } catch (error) {
      toast({ title: 'Erro ao atualizar conta', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remover conta "${conta.nome}"?`)) {
      try {
        await updateConfig({ contas: config.contas?.filter(c => c.nome !== conta.nome) || [] });
        toast({ title: 'Conta removida!' });
        navigate('/contas');
      } catch (error) {
        toast({ title: 'Erro ao remover conta', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/contas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes da Conta</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Nome da Conta</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome da conta"
            />
          </div>

          <div>
            <Label>Tipo da Conta</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CONTA.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Agência</Label>
              <Input
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="0000"
              />
            </div>
            <div>
              <Label>Número da Conta</Label>
              <Input
                value={formData.numeroConta}
                onChange={(e) => setFormData({ ...formData, numeroConta: e.target.value })}
                placeholder="00000000"
              />
            </div>
            <div>
              <Label>Dígito</Label>
              <Input
                value={formData.digito}
                onChange={(e) => setFormData({ ...formData, digito: e.target.value })}
                placeholder="0"
                maxLength={1}
              />
            </div>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Saldo Atual</h2>
            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {formatBRL(saldo)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Movimentações</h2>
        <LancamentosList
          transacoes={transacoesConta}
          onUpdateTransacao={updateTransacao}
          onDeleteTransacao={deleteTransacao}
          config={config}
        />
      </Card>
    </div>
  );
}
