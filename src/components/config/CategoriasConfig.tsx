import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCategorias, type Config } from '@/lib/firebase';

interface CategoriasConfigProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => Promise<void>;
}

export const CategoriasConfig = ({ config, updateConfig }: CategoriasConfigProps) => {
  const { toast } = useToast();
  const [tipoCategoria, setTipoCategoria] = useState<'entrada' | 'saida'>('saida');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categoriaParaSubcategoria, setCategoriaParaSubcategoria] = useState('');
  const [novaSubcategoria, setNovaSubcategoria] = useState('');

  const categorias = getCategorias(tipoCategoria, config);

  const handleAddCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast({ title: 'Nome da categoria é obrigatório', variant: 'destructive' });
      return;
    }

    if (categorias[novaCategoria]) {
      toast({ title: 'Categoria já existe', variant: 'destructive' });
      return;
    }

    const categoriasCustomizadas = {
      entrada: config.categoriasCustomizadas?.entrada || {},
      saida: config.categoriasCustomizadas?.saida || {},
    };

    categoriasCustomizadas[tipoCategoria] = {
      ...categoriasCustomizadas[tipoCategoria],
      [novaCategoria]: [],
    };

    try {
      await updateConfig({ categoriasCustomizadas });
      toast({ title: 'Categoria adicionada!' });
      setNovaCategoria('');
    } catch (error) {
      toast({ title: 'Erro ao adicionar categoria', variant: 'destructive' });
    }
  };

  const handleAddSubcategoria = async () => {
    if (!categoriaParaSubcategoria || !novaSubcategoria.trim()) {
      toast({ title: 'Selecione uma categoria e preencha a subcategoria', variant: 'destructive' });
      return;
    }

    const categoriasCustomizadas = {
      entrada: config.categoriasCustomizadas?.entrada || {},
      saida: config.categoriasCustomizadas?.saida || {},
    };

    const subcategoriasAtuais = categorias[categoriaParaSubcategoria] || [];
    
    if (subcategoriasAtuais.includes(novaSubcategoria)) {
      toast({ title: 'Subcategoria já existe', variant: 'destructive' });
      return;
    }

    // Se a categoria não existe nas customizadas, cria ela com as subcategorias originais + nova
    const subcategoriasBase = categorias[categoriaParaSubcategoria] || [];
    categoriasCustomizadas[tipoCategoria] = {
      ...categoriasCustomizadas[tipoCategoria],
      [categoriaParaSubcategoria]: [...subcategoriasBase, novaSubcategoria],
    };

    try {
      await updateConfig({ categoriasCustomizadas });
      toast({ title: 'Subcategoria adicionada!' });
      setNovaSubcategoria('');
    } catch (error) {
      toast({ title: 'Erro ao adicionar subcategoria', variant: 'destructive' });
    }
  };

  const handleRemoveCategoria = async (categoria: string) => {
    if (!confirm(`Remover categoria "${categoria}" e todas as suas subcategorias?`)) return;

    const categoriasCustomizadas = {
      entrada: config.categoriasCustomizadas?.entrada || {},
      saida: config.categoriasCustomizadas?.saida || {},
    };

    // Marca categoria para remoção (inclui as padrões)
    categoriasCustomizadas[tipoCategoria] = {
      ...categoriasCustomizadas[tipoCategoria],
      [categoria]: null as any, // null indica remoção
    };

    try {
      await updateConfig({ categoriasCustomizadas });
      toast({ title: 'Categoria removida!' });
    } catch (error) {
      toast({ title: 'Erro ao remover categoria', variant: 'destructive' });
    }
  };

  const handleRemoveSubcategoria = async (categoria: string, subcategoria: string) => {
    if (!confirm(`Remover subcategoria "${subcategoria}"?`)) return;

    const categoriasCustomizadas = {
      entrada: config.categoriasCustomizadas?.entrada || {},
      saida: config.categoriasCustomizadas?.saida || {},
    };

    const subcategorias = categorias[categoria].filter(s => s !== subcategoria);
    categoriasCustomizadas[tipoCategoria] = {
      ...categoriasCustomizadas[tipoCategoria],
      [categoria]: subcategorias,
    };

    try {
      await updateConfig({ categoriasCustomizadas });
      toast({ title: 'Subcategoria removida!' });
    } catch (error) {
      toast({ title: 'Erro ao remover subcategoria', variant: 'destructive' });
    }
  };

  const canEditCategoria = () => {
    // Permite editar todas as categorias agora
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Tipo de Transação:</Label>
        <Tabs value={tipoCategoria} onValueChange={(v) => setTipoCategoria(v as any)} className="w-full">
          <TabsList className="w-full h-auto">
            <TabsTrigger value="saida" className="flex-1">Saídas (Gastos)</TabsTrigger>
            <TabsTrigger value="entrada" className="flex-1">Entradas (Rendas)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Adicionar Nova Categoria</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Nome da categoria"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
          />
          <Button onClick={handleAddCategoria}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Adicionar Subcategoria</h3>
        <div className="space-y-2">
          <Select value={categoriaParaSubcategoria} onValueChange={setCategoriaParaSubcategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(categorias).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da subcategoria"
              value={novaSubcategoria}
              onChange={(e) => setNovaSubcategoria(e.target.value)}
            />
            <Button onClick={handleAddSubcategoria}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Categorias Atuais</h3>
        <div className="space-y-4">
          {Object.entries(categorias).map(([categoria, subcategorias]) => (
            <div key={categoria} className="border-l-4 border-primary pl-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{categoria}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCategoria(categoria)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subcategorias.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm group"
                  >
                    {sub}
                    <button
                      onClick={() => handleRemoveSubcategoria(categoria, sub)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>💡 Dica:</strong> Você pode adicionar, editar e remover categorias e subcategorias. 
          As alterações serão salvas no Firebase e estarão disponíveis em todos os lançamentos.
        </p>
      </div>
    </div>
  );
};
