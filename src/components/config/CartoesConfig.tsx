import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Config, Transacao } from '@/lib/firebase';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils-format';
import { formatBRL, calcularFaturaCartao, calcularLimiteDisponivel } from '@/lib/utils-finance';

interface CartoesConfigProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => Promise<void>;
  transacoes: Transacao[];
}

export const CartoesConfig = ({ config, updateConfig, transacoes }: CartoesConfigProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoCartao, setNovoCartao] = useState({
    nome: '',
    limite: '',
    diaFechamento: '',
    diaVencimento: '',
  });

  const handleAddCartao = async () => {
    if (!novoCartao.nome.trim() || !novoCartao.limite || !novoCartao.diaVencimento) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const cartoes = [...(config.cartoes || []), {
      nome: novoCartao.nome,
      limite: parseCurrencyInput(novoCartao.limite),
      diaFechamento: parseInt(novoCartao.diaFechamento) || 1,
      diaVencimento: parseInt(novoCartao.diaVencimento),
      disponivelPara: ['Ambos']
    }];

    try {
      await updateConfig({ cartoes });
      toast({ title: 'Cartão adicionado!' });
      setNovoCartao({ nome: '', limite: '', diaFechamento: '', diaVencimento: '' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao adicionar cartão', variant: 'destructive' });
    }
  };

  const cartoesOrdenados = [...(config.cartoes || [])].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cartão
        </Button>
      </div>

      <div className="space-y-2">
        {cartoesOrdenados.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhum cartão cadastrado
          </Card>
        ) : (
          <div className="grid gap-3">
            {cartoesOrdenados.map((cartao) => {
              const fatura = calcularFaturaCartao(transacoes, cartao.nome);
              const disponivel = calcularLimiteDisponivel(cartao, fatura);
              return (
                <Card
                  key={cartao.nome}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/cartoes/${encodeURIComponent(cartao.nome)}`)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{cartao.nome}</p>
                    <p className={`text-sm font-semibold ${disponivel >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {formatBRL(disponivel)}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Cartão</Label>
              <Input
                placeholder="Ex: Nubank"
                value={novoCartao.nome}
                onChange={(e) => setNovoCartao({ ...novoCartao, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Limite (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={novoCartao.limite}
                onChange={(e) => setNovoCartao({ ...novoCartao, limite: formatCurrencyInput(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Dia Fechamento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  value={novoCartao.diaFechamento}
                  onChange={(e) => setNovoCartao({ ...novoCartao, diaFechamento: e.target.value })}
                />
              </div>
              <div>
                <Label>Dia Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="10"
                  value={novoCartao.diaVencimento}
                  onChange={(e) => setNovoCartao({ ...novoCartao, diaVencimento: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCartao} className="flex-1">Adicionar</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
