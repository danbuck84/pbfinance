import { useFirestore } from '@/hooks/useFirestore';
import { BeneficiosConfig } from '@/components/config/BeneficiosConfig';

export default function Beneficios() {
  const { config, updateConfig, transacoes } = useFirestore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Benefícios</h1>
        <p className="text-muted-foreground">
          Adicione, edite ou remova seus cartões de benefícios (vale alimentação, refeição, etc.)
        </p>
      </div>
      
      <BeneficiosConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
    </div>
  );
}
