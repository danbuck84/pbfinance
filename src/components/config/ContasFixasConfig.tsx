import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCategorias, type Config, type ContaFixa } from '@/lib/firebase';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils-format';

interface ContasFixasConfigProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => Promise<void>;
}

export const ContasFixasConfig = ({ config, updateConfig }: ContasFixasConfigProps) => {
  const { toast } = useToast();
  const [novaConta, setNovaConta] = useState({
    descricao: '',
    valor: '',
    tipo: '' as 'entrada' | 'saida' | '',
    categoria: '',
    subcategoria: '',
    fonte: '',
    pessoa: 'Ambos',
    diaVencimento: '',
    ativa: true,
  });

  const categorias = novaConta.tipo ? getCategorias(novaConta.tipo, config) : {};
  const subcategorias = novaConta.categoria ? categorias[novaConta.categoria] || [] : [];

  const fontesDisponiveis = [
    ...(config.contas || []).map(c => c.nome),
    ...(config.beneficios || []).map(b => b.nome),
    ...(config.cartoes || []).map(c => c.nome),
  ];

  const handleAddConta = async () => {
    if (!novaConta.descricao || !novaConta.valor || !novaConta.tipo || !novaConta.diaVencimento) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const contasFixas = [...(config.contasFixas || []), {
      id: Date.now().toString(),
      descricao: novaConta.descricao,
      valor: parseCurrencyInput(novaConta.valor),
      tipo: novaConta.tipo as 'entrada' | 'saida',
      categoria: novaConta.categoria,
      subcategoria: novaConta.subcategoria,
      fonte: novaConta.fonte,
      pessoa: novaConta.pessoa,
      diaVencimento: parseInt(novaConta.diaVencimento),
      ativa: novaConta.ativa,
    }];

    try {
      await updateConfig({ contasFixas });
      toast({ title: 'Conta fixa adicionada!' });
      setNovaConta({
        descricao: '',
        valor: '',
        tipo: '',
        categoria: '',
        subcategoria: '',
        fonte: '',
        pessoa: 'Ambos',
        diaVencimento: '',
        ativa: true,
      });
    } catch (error) {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const handleToggleAtiva = async (id: string, ativa: boolean) => {
    const contasFixas = (config.contasFixas || []).map(c =>
      c.id === id ? { ...c, ativa } : c
    );
    await updateConfig({ contasFixas });
  };

  const handleRemoveConta = async (id: string) => {
    if (confirm('Remover conta fixa?')) {
      await updateConfig({ contasFixas: config.contasFixas?.filter(c => c.id !== id) || [] });
      toast({ title: 'Conta fixa removida!' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Adicionar Conta Fixa/Recorrente</h3>
        <div className="grid gap-3">
          <Input
            placeholder="Descrição"
            value={novaConta.descricao}
            onChange={(e) => setNovaConta({ ...novaConta, descricao: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="text"
              placeholder="0,00"
              value={novaConta.valor}
              onChange={(e) => setNovaConta({ ...novaConta, valor: formatCurrencyInput(e.target.value) })}
            />
            <Input
              type="number"
              min="1"
              max="31"
              placeholder="Dia Vencimento"
              value={novaConta.diaVencimento}
              onChange={(e) => setNovaConta({ ...novaConta, diaVencimento: e.target.value })}
            />
          </div>
          <Select value={novaConta.tipo} onValueChange={(value: any) => setNovaConta({ ...novaConta, tipo: value })}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="saida">Saída</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
            </SelectContent>
          </Select>
          {novaConta.tipo && (
            <>
              <Select value={novaConta.fonte} onValueChange={(value) => setNovaConta({ ...novaConta, fonte: value })}>
                <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
                <SelectContent>
                  {fontesDisponiveis.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Select value={novaConta.categoria} onValueChange={(value) => setNovaConta({ ...novaConta, categoria: value, subcategoria: '' })}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(categorias).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={novaConta.subcategoria} onValueChange={(value) => setNovaConta({ ...novaConta, subcategoria: value })}>
                  <SelectTrigger><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                  <SelectContent>
                    {subcategorias.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <Button onClick={handleAddConta}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Contas Fixas Cadastradas</h3>
        {(config.contasFixas || []).length === 0 ? (
          <p className="text-muted-foreground">Nenhuma conta fixa cadastrada</p>
        ) : (
          <div className="space-y-2">
            {config.contasFixas?.map((conta) => (
              <Card key={conta.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{conta.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {conta.valor.toFixed(2)} | Dia {conta.diaVencimento} | {conta.categoria}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={conta.ativa}
                      onCheckedChange={(checked) => handleToggleAtiva(conta.id, checked)}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveConta(conta.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
