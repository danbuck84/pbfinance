import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Config, Transacao } from '@/lib/firebase';
import { calcularSaldoConta, formatBRL } from '@/lib/utils-finance';

const TIPOS_CONTA = ['Corrente', 'Poupança', 'Financiamento', 'Investimento'];

interface ContasConfigProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => Promise<void>;
  transacoes: Transacao[];
}

export const ContasConfig = ({ config, updateConfig, transacoes }: ContasConfigProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaConta, setNovaConta] = useState({
    nome: '',
    tipo: '',
    agencia: '',
    numeroConta: '',
    digito: '',
  });

  const handleAddConta = async () => {
    if (!novaConta.nome.trim()) {
      toast({ title: 'Nome da conta é obrigatório', variant: 'destructive' });
      return;
    }

    const contas = [...(config.contas || []), {
      nome: novaConta.nome,
      disponivelPara: ['Ambos'],
      tipo: novaConta.tipo,
      agencia: novaConta.agencia,
      numeroConta: novaConta.numeroConta,
      digito: novaConta.digito,
    }];

    try {
      await updateConfig({ contas });
      toast({ title: 'Conta adicionada!' });
      setNovaConta({ nome: '', tipo: '', agencia: '', numeroConta: '', digito: '' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao adicionar conta', variant: 'destructive' });
    }
  };

  const contasOrdenadas = [...(config.contas || [])].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Conta
        </Button>
      </div>

      <div className="space-y-2">
        {contasOrdenadas.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma conta cadastrada
          </Card>
        ) : (
          <div className="grid gap-3">
            {contasOrdenadas.map((conta) => {
              const saldo = calcularSaldoConta(transacoes, conta.nome);
              return (
                <Card
                  key={conta.nome}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/contas/${encodeURIComponent(conta.nome)}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conta.nome}</p>
                      {conta.tipo && (
                        <p className="text-sm text-muted-foreground">
                          {conta.tipo}
                          {conta.agencia && conta.numeroConta && 
                            ` • Ag ${conta.agencia} • Conta ${conta.numeroConta}${conta.digito ? `-${conta.digito}` : ''}`
                          }
                        </p>
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {formatBRL(saldo)}
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
            <DialogTitle>Adicionar Nova Conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Conta</Label>
              <Input
                value={novaConta.nome}
                onChange={(e) => setNovaConta({ ...novaConta, nome: e.target.value })}
                placeholder="Nome da conta"
              />
            </div>

            <div>
              <Label>Tipo da Conta</Label>
              <Select value={novaConta.tipo} onValueChange={(value) => setNovaConta({ ...novaConta, tipo: value })}>
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

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Agência</Label>
                <Input
                  value={novaConta.agencia}
                  onChange={(e) => setNovaConta({ ...novaConta, agencia: e.target.value })}
                  placeholder="0000"
                />
              </div>
              <div>
                <Label>Número da Conta</Label>
                <Input
                  value={novaConta.numeroConta}
                  onChange={(e) => setNovaConta({ ...novaConta, numeroConta: e.target.value })}
                  placeholder="00000000"
                />
              </div>
              <div>
                <Label>Dígito</Label>
                <Input
                  value={novaConta.digito}
                  onChange={(e) => setNovaConta({ ...novaConta, digito: e.target.value })}
                  placeholder="0"
                  maxLength={1}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddConta} className="flex-1">Adicionar</Button>
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
