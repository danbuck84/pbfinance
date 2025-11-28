import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils-finance';
import { LancamentoItem } from './LancamentoItem';
import { LancamentoEditDialog } from './LancamentoEditDialog';
import type { Transacao, Config } from '@/lib/firebase';

interface LancamentosListProps {
  transacoes: Transacao[];
  onUpdateTransacao: (id: string, data: Partial<Transacao>) => Promise<void>;
  onDeleteTransacao: (id: string) => Promise<void>;
  config: Config;
}

type SortField = 'createdAt' | 'data' | 'valor' | 'descricao';
type SortDirection = 'asc' | 'desc';

export const LancamentosList = ({ transacoes, onUpdateTransacao, onDeleteTransacao, config }: LancamentosListProps) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPessoa, setFiltroPessoa] = useState('todos');
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);

  const sortedAndFiltered = useMemo(() => {
    let filtered = [...transacoes];

    if (filtroTipo !== 'todos') {
      filtered = filtered.filter(t => t.tipo === filtroTipo);
    }

    if (filtroPessoa !== 'todos') {
      filtered = filtered.filter(t => t.pessoa === filtroPessoa);
    }

    filtered.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'createdAt') {
        valA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        valB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      } else if (sortField === 'data') {
        valA = new Date(valA + 'T00:00:00').getTime();
        valB = new Date(valB + 'T00:00:00').getTime();
      } else if (sortField === 'descricao') {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA > valB) return sortDirection === 'desc' ? -1 : 1;
      if (valA < valB) return sortDirection === 'desc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transacoes, sortField, sortDirection, filtroTipo, filtroPessoa]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Ordenar:</span>
        <Button
          variant={sortField === 'createdAt' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('createdAt')}
        >
          Inserção <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
        <Button
          variant={sortField === 'data' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('data')}
        >
          Data <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
        <Button
          variant={sortField === 'valor' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('valor')}
        >
          Valor <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
        <Button
          variant={sortField === 'descricao' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('descricao')}
        >
          Nome <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>

        <div className="ml-auto flex gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroPessoa} onValueChange={setFiltroPessoa}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ambos">Ambos</SelectItem>
              <SelectItem value="Carol">Carol</SelectItem>
              <SelectItem value="Dan">Dan</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {sortedAndFiltered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
        ) : (
          sortedAndFiltered.map((transacao) => (
            <LancamentoItem
              key={transacao.id}
              transacao={transacao}
              onClick={() => setEditingTransacao(transacao)}
            />
          ))
        )}
      </div>

      {editingTransacao && (
        <LancamentoEditDialog
          transacao={editingTransacao}
          open={!!editingTransacao}
          onOpenChange={(open) => !open && setEditingTransacao(null)}
          onUpdate={onUpdateTransacao}
          onDelete={onDeleteTransacao}
          config={config}
        />
      )}
    </div>
  );
};
