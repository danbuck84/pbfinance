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
import { calcularFaturaCartao, formatBRL, calcularMelhorDiaCompra } from '@/lib/utils-finance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CartaoDetalhes() {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { config, updateConfig, transacoes, updateTransacao, deleteTransacao } = useFirestore();
  const { toast } = useToast();
  
  const cartao = config.cartoes?.find(c => c.nome === decodeURIComponent(nome || ''));
  
  const [formData, setFormData] = useState({
    nome: '',
    limite: '',
    diaFechamento: '',
    diaVencimento: '',
  });

  useEffect(() => {
    if (cartao) {
      setFormData({
        nome: cartao.nome,
        limite: cartao.limite?.toString() || '0',
        diaFechamento: cartao.diaFechamento?.toString() || '1',
        diaVencimento: cartao.diaVencimento?.toString() || '10',
      });
    }
  }, [cartao]);

  const transacoesCartao = useMemo(() => {
    return transacoes.filter(t => t.fonte === cartao?.nome);
  }, [transacoes, cartao?.nome]);

  const faturaAtual = useMemo(() => {
    if (!cartao) return 0;
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    return transacoes
      .filter(t => {
        if (t.fonte !== cartao.nome) return false;
        const dataTransacao = new Date(t.data + 'T00:00:00');
        return dataTransacao.getMonth() === mesAtual && dataTransacao.getFullYear() === anoAtual;
      })
      .reduce((acc, t) => {
        return acc + (t.tipo === 'saida' ? t.valor : -t.valor);
      }, 0);
  }, [transacoes, cartao]);

  const faturaTotal = useMemo(() => {
    return calcularFaturaCartao(transacoes, cartao?.nome || '');
  }, [transacoes, cartao?.nome]);

  const melhorDiaCompra = useMemo(() => {
    if (!cartao) return '';
    const fechamento = parseInt(formData.diaFechamento) || cartao.diaFechamento;
    const vencimento = parseInt(formData.diaVencimento) || cartao.diaVencimento;
    if (!fechamento || !vencimento) return 'Configure fechamento e vencimento';
    return calcularMelhorDiaCompra(fechamento, vencimento);
  }, [cartao, formData.diaFechamento, formData.diaVencimento]);

  if (!cartao) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/cartoes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Cartão não encontrado</h1>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.limite || !formData.diaVencimento) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const cartoes = config.cartoes?.map(c =>
      c.nome === cartao.nome
        ? {
            ...c,
            nome: formData.nome,
            limite: parseFloat(formData.limite),
            diaFechamento: parseInt(formData.diaFechamento) || 1,
            diaVencimento: parseInt(formData.diaVencimento),
          }
        : c
    ) || [];

    try {
      await updateConfig({ cartoes });
      toast({ title: 'Cartão atualizado!' });
      navigate('/cartoes');
    } catch (error) {
      toast({ title: 'Erro ao atualizar cartão', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remover cartão "${cartao.nome}"?`)) {
      try {
        await updateConfig({ cartoes: config.cartoes?.filter(c => c.nome !== cartao.nome) || [] });
        toast({ title: 'Cartão removido!' });
        navigate('/cartoes');
      } catch (error) {
        toast({ title: 'Erro ao remover cartão', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/cartoes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Cartão</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Nome do Cartão</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do cartão"
            />
          </div>

          <div>
            <Label>Limite (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.limite}
              onChange={(e) => setFormData({ ...formData, limite: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dia Fechamento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.diaFechamento}
                onChange={(e) => setFormData({ ...formData, diaFechamento: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Dia Vencimento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.diaVencimento}
                onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          {melhorDiaCompra && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm font-medium text-primary mb-1">💡 Melhor dia para comprar:</p>
              <p className="text-sm text-muted-foreground">{melhorDiaCompra}</p>
            </div>
          )}

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
        <Tabs defaultValue="atual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="atual">Fatura Atual</TabsTrigger>
            <TabsTrigger value="total">Fatura Total</TabsTrigger>
          </TabsList>
          <TabsContent value="atual" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fatura do Mês Atual</h2>
              <p className={`text-2xl font-bold ${faturaAtual < 0 ? 'text-green-600' : 'text-destructive'}`}>
                R$ {formatBRL(Math.abs(faturaAtual))}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {faturaAtual < 0 
                ? 'Você tem crédito para o próximo mês!' 
                : 'Lançamentos realizados neste mês'}
            </p>
          </TabsContent>
          <TabsContent value="total" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fatura Total</h2>
              <p className="text-2xl font-bold text-destructive">
                R$ {formatBRL(faturaTotal)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Todos os lançamentos, incluindo parcelamentos futuros
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Movimentações</h2>
        <LancamentosList
          transacoes={transacoesCartao}
          onUpdateTransacao={updateTransacao}
          onDeleteTransacao={deleteTransacao}
          config={config}
        />
      </Card>
    </div>
  );
}
