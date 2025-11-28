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
import { calcularSaldoConta, formatBRL } from '@/lib/utils-finance';

interface BeneficiosConfigProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => Promise<void>;
  transacoes: Transacao[];
}

export const BeneficiosConfig = ({ config, updateConfig, transacoes }: BeneficiosConfigProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoBeneficio, setNovoBeneficio] = useState({ nome: '' });

  const handleAddBeneficio = async () => {
    if (!novoBeneficio.nome.trim()) {
      toast({ title: 'Nome do benefício é obrigatório', variant: 'destructive' });
      return;
    }

    const beneficios = [...(config.beneficios || []), {
      nome: novoBeneficio.nome,
      disponivelPara: ['Ambos']
    }];

    try {
      await updateConfig({ beneficios });
      toast({ title: 'Benefício adicionado!' });
      setNovoBeneficio({ nome: '' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao adicionar benefício', variant: 'destructive' });
    }
  };

  const beneficiosOrdenados = [...(config.beneficios || [])].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Benefício
        </Button>
      </div>

      <div className="space-y-2">
        {beneficiosOrdenados.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhum benefício cadastrado
          </Card>
        ) : (
          <div className="grid gap-3">
            {beneficiosOrdenados.map((beneficio) => {
              const saldo = calcularSaldoConta(transacoes, beneficio.nome);
              return (
                <Card
                  key={beneficio.nome}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/beneficios/${encodeURIComponent(beneficio.nome)}`)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{beneficio.nome}</p>
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
            <DialogTitle>Adicionar Novo Benefício</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Benefício</Label>
              <Input
                value={novoBeneficio.nome}
                onChange={(e) => setNovoBeneficio({ nome: e.target.value })}
                placeholder="Ex: Vale Alimentação, Flash"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Benefícios são cartões de vale alimentação, refeição, etc.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddBeneficio} className="flex-1">Adicionar</Button>
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
