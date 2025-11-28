import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calcularFaturaCartao, formatBRL } from '@/lib/utils-finance';
import { useToast } from '@/hooks/use-toast';
import type { Cartao, Conta, Transacao } from '@/lib/firebase';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils-format';

interface PagarFaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: Cartao;
  transacoes: Transacao[];
  contas: Conta[];
  onPagar: (transacao: any) => Promise<void>;
}

export const PagarFaturaDialog = ({ open, onOpenChange, cartao, transacoes, contas, onPagar }: PagarFaturaDialogProps) => {
  const { toast } = useToast();
  const faturaTotal = calcularFaturaCartao(transacoes, cartao.nome);
  const [valor, setValor] = useState(formatCurrencyInput(faturaTotal.toString()));
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [contaOrigem, setContaOrigem] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onPagar({
        descricao: `Pagamento Fatura ${cartao.nome}`,
        valor: parseCurrencyInput(valor),
        data,
        tipo: 'saida',
        fonte: contaOrigem,
        categoria: 'Dívidas e Empréstimos',
        subcategoria: 'Pagar Fatura',
        pessoa: 'Ambos',
      });
      toast({ title: 'Fatura paga com sucesso!' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Erro ao pagar fatura', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar Fatura - {cartao.nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Valor da Fatura</Label>
            <Input type="text" value={valor} onChange={(e) => setValor(formatCurrencyInput(e.target.value))} placeholder="0,00" required />
          </div>
          <div>
            <Label>Data do Pagamento</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div>
            <Label>Conta de Origem</Label>
            <Select value={contaOrigem} onValueChange={setContaOrigem}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {contas.map((conta) => (
                  <SelectItem key={conta.nome} value={conta.nome}>{conta.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">Confirmar Pagamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
