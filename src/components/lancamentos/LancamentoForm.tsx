import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getCategorias, type Config, type Transacao } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils-format';

interface LancamentoFormProps {
  config: Config;
  onAddTransacao: (transacao: Omit<Transacao, 'id' | 'createdAt'>) => Promise<void>;
  onAddTransacaoParcelada: (transacao: Omit<Transacao, 'id' | 'createdAt'>, numParcelas: number) => Promise<void>;
}

export const LancamentoForm = ({ config, onAddTransacao, onAddTransacaoParcelada }: LancamentoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    tipo: '' as 'entrada' | 'saida' | 'pagamento_fatura' | 'movimentacao_contas' | '',
    fonte: '',
    categoria: '',
    subcategoria: '',
    pessoa: '',
  });
  const [isParcelado, setIsParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState('');
  const [cartaoPagamento, setCartaoPagamento] = useState('');
  const [fontePagamento, setFontePagamento] = useState('');
  const [contaOrigem, setContaOrigem] = useState('');
  const [contaDestino, setContaDestino] = useState('');

  const categorias = (formData.tipo === 'entrada' || formData.tipo === 'saida') ? getCategorias(formData.tipo, config) : {};
  const subcategorias = formData.categoria ? categorias[formData.categoria] || [] : [];

  const fontesDisponiveis = [
    ...(config.contas || []).map(c => c.nome),
    ...(config.beneficios || []).map(b => b.nome),
    ...(config.cartoes || []).map(c => c.nome),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Se for movimentação entre contas, criar dois lançamentos
      if (formData.tipo === 'movimentacao_contas') {
        if (!contaOrigem || !contaDestino) {
          toast({ title: 'Selecione a conta de origem e destino', variant: 'destructive' });
          return;
        }

        if (contaOrigem === contaDestino) {
          toast({ title: 'Conta de origem e destino não podem ser iguais', variant: 'destructive' });
          return;
        }

        const valor = parseCurrencyInput(formData.valor);
        const descricao = formData.descricao || `Transferência ${contaOrigem} → ${contaDestino}`;

        // Lançamento de SAÍDA na conta origem
        await onAddTransacao({
          descricao: descricao,
          valor: valor,
          data: formData.data,
          tipo: 'saida',
          fonte: contaOrigem,
          categoria: 'Transferência',
          subcategoria: 'Entre Contas',
          pessoa: formData.pessoa,
        });

        // Lançamento de ENTRADA na conta destino
        await onAddTransacao({
          descricao: descricao,
          valor: valor,
          data: formData.data,
          tipo: 'entrada',
          fonte: contaDestino,
          categoria: 'Transferência',
          subcategoria: 'Entre Contas',
          pessoa: formData.pessoa,
        });

        toast({ title: 'Movimentação entre contas registrada com sucesso!' });
      } else if (formData.tipo === 'pagamento_fatura') {
        if (!cartaoPagamento || !fontePagamento) {
          toast({ title: 'Selecione o cartão e a fonte de pagamento', variant: 'destructive' });
          return;
        }

        const valor = parseCurrencyInput(formData.valor);
        const descricao = formData.descricao || `Pagamento Fatura ${cartaoPagamento}`;

        // Lançamento de ENTRADA no cartão (reduz a fatura)
        await onAddTransacao({
          descricao: descricao,
          valor: valor,
          data: formData.data,
          tipo: 'entrada',
          fonte: cartaoPagamento,
          categoria: 'Pagamento de Fatura',
          subcategoria: 'Pagamento',
          pessoa: formData.pessoa,
        });

        // Lançamento de SAÍDA na fonte de pagamento
        await onAddTransacao({
          descricao: descricao,
          valor: valor,
          data: formData.data,
          tipo: 'saida',
          fonte: fontePagamento,
          categoria: 'Pagamento de Fatura',
          subcategoria: 'Pagamento',
          pessoa: formData.pessoa,
        });

        toast({ title: 'Pagamento de fatura registrado com sucesso!' });
      } else {
        // Lançamento normal
        const transacao: Omit<Transacao, 'id' | 'createdAt'> = {
          descricao: formData.descricao,
          valor: parseCurrencyInput(formData.valor),
          data: formData.data,
          tipo: formData.tipo as 'entrada' | 'saida',
          fonte: formData.fonte,
          categoria: formData.categoria,
          subcategoria: formData.subcategoria,
          pessoa: formData.pessoa,
        };

        if (isParcelado && numParcelas) {
          await onAddTransacaoParcelada(transacao, parseInt(numParcelas));
          toast({ title: `Transação parcelada em ${numParcelas}x adicionada!` });
        } else {
          await onAddTransacao(transacao);
          toast({ title: 'Transação adicionada!' });
        }
      }

      // Reset form
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        tipo: '',
        fonte: '',
        categoria: '',
        subcategoria: '',
        pessoa: '',
      });
      setIsParcelado(false);
      setNumParcelas('');
      setCartaoPagamento('');
      setFontePagamento('');
      setContaOrigem('');
      setContaDestino('');
    } catch (error) {
      toast({ title: 'Erro ao adicionar transação', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (formData.tipo) {
      setFormData(prev => ({ ...prev, categoria: '', subcategoria: '' }));
    }
  }, [formData.tipo]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="text"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: formatCurrencyInput(e.target.value) })}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saida">Saída (Gasto)</SelectItem>
            <SelectItem value="entrada">Entrada (Renda)</SelectItem>
            <SelectItem value="pagamento_fatura">Pagamento de Fatura</SelectItem>
            <SelectItem value="movimentacao_contas">Movimentação entre Contas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.tipo === 'movimentacao_contas' && (
        <>
          <div>
            <Label htmlFor="contaOrigem">Saindo de</Label>
            <Select value={contaOrigem} onValueChange={setContaOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {fontesDisponiveis.map((fonte) => (
                  <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contaDestino">Entrando em</Label>
            <Select value={contaDestino} onValueChange={setContaDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {fontesDisponiveis.map((fonte) => (
                  <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pessoa">Quem Lançou?</Label>
            <Select value={formData.pessoa} onValueChange={(value) => setFormData({ ...formData, pessoa: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambos">Ambos</SelectItem>
                <SelectItem value="Carol">Carol</SelectItem>
                <SelectItem value="Dan">Dan</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {formData.tipo === 'pagamento_fatura' && (
        <>
          <div>
            <Label htmlFor="cartao">Cartão a ser Pago</Label>
            <Select value={cartaoPagamento} onValueChange={setCartaoPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent>
                {config.cartoes?.map((cartao) => (
                  <SelectItem key={cartao.nome} value={cartao.nome}>{cartao.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fontePagamento">Pagar com</Label>
            <Select value={fontePagamento} onValueChange={setFontePagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fonte de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {fontesDisponiveis.map((fonte) => (
                  <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pessoa">Quem Lançou?</Label>
            <Select value={formData.pessoa} onValueChange={(value) => setFormData({ ...formData, pessoa: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambos">Ambos</SelectItem>
                <SelectItem value="Carol">Carol</SelectItem>
                <SelectItem value="Dan">Dan</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {formData.tipo && formData.tipo !== 'pagamento_fatura' && (
        <>
          <div>
            <Label htmlFor="fonte">Fonte/Destino</Label>
            <Select value={formData.fonte} onValueChange={(value) => setFormData({ ...formData, fonte: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fonte" />
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
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value, subcategoria: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categorias).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Select value={formData.subcategoria} onValueChange={(value) => setFormData({ ...formData, subcategoria: value })} disabled={!formData.categoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Subcategoria" />
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
            <Label htmlFor="pessoa">Quem Lançou?</Label>
            <Select value={formData.pessoa} onValueChange={(value) => setFormData({ ...formData, pessoa: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambos">Ambos</SelectItem>
                <SelectItem value="Carol">Carol</SelectItem>
                <SelectItem value="Dan">Dan</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tipo === 'saida' && config.cartoes?.some(c => c.nome === formData.fonte) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="parcelado" checked={isParcelado} onCheckedChange={setIsParcelado} />
                <Label htmlFor="parcelado">Compra parcelada?</Label>
              </div>
              {isParcelado && (
                <div>
                  <Label htmlFor="numParcelas">Número de Parcelas</Label>
                  <Input
                    id="numParcelas"
                    type="number"
                    min="2"
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full">Adicionar</Button>
    </form>
  );
};
