import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategorias, type Transacao, type Config } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils-format';

interface LancamentoEditDialogProps {
  transacao: Transacao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Transacao>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  config: Config;
}

export const LancamentoEditDialog = ({
  transacao,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  config
}: LancamentoEditDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    descricao: transacao.descricao,
    valor: formatCurrencyInput(transacao.valor.toString()),
    data: transacao.data,
    tipo: transacao.tipo,
    fonte: transacao.fonte,
    categoria: transacao.categoria,
    subcategoria: transacao.subcategoria,
    pessoa: transacao.pessoa,
  });

  const categorias = getCategorias(formData.tipo, config);
  const subcategorias = formData.categoria ? categorias[formData.categoria] || [] : [];

  const fontesDisponiveis = [
    ...(config.contas || []).map(c => c.nome),
    ...(config.beneficios || []).map(b => b.nome),
    ...(config.cartoes || []).map(c => c.nome),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(transacao.id, {
        descricao: formData.descricao,
        valor: parseCurrencyInput(formData.valor),
        data: formData.data,
        tipo: formData.tipo,
        fonte: formData.fonte,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        pessoa: formData.pessoa,
      });
      toast({ title: 'Transação atualizada!' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (confirm('Deseja realmente excluir esta transação?')) {
      try {
        await onDelete(transacao.id);
        toast({ title: 'Transação excluída!' });
        onOpenChange(false);
      } catch (error) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Input
              id="edit-descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-valor">Valor (R$)</Label>
              <Input
                id="edit-valor"
                type="text"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: formatCurrencyInput(e.target.value) })}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-data">Data</Label>
              <Input
                id="edit-data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-fonte">Fonte/Destino</Label>
            <Select value={formData.fonte} onValueChange={(value) => setFormData({ ...formData, fonte: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontesDisponiveis.map((fonte) => (
                  <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value, subcategoria: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categorias).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-subcategoria">Subcategoria</Label>
              <Select value={formData.subcategoria} onValueChange={(value) => setFormData({ ...formData, subcategoria: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-pessoa">Pessoa</Label>
            <Select value={formData.pessoa} onValueChange={(value) => setFormData({ ...formData, pessoa: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambos">Ambos</SelectItem>
                <SelectItem value="Carol">Carol</SelectItem>
                <SelectItem value="Dan">Dan</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
