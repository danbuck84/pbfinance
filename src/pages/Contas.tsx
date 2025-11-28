import { useFirestore } from '@/hooks/useFirestore';
import { ContasConfig } from '@/components/config/ContasConfig';

export default function Contas() {
  const { config, updateConfig, transacoes } = useFirestore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Contas</h1>
        <p className="text-muted-foreground">
          Adicione, edite ou remova suas contas bancárias
        </p>
      </div>
      
      <ContasConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
    </div>
  );
}
