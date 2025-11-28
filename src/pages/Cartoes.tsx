import { useFirestore } from '@/hooks/useFirestore';
import { CartoesConfig } from '@/components/config/CartoesConfig';
import { useEffect, useRef } from 'react';

export default function Cartoes() {
  const { config, updateConfig, transacoes } = useFirestore();
  const ajusteAplicado = useRef(false);

  useEffect(() => {
    // Aplicar ajuste uma única vez
    if (!ajusteAplicado.current && config.cartoes && config.cartoes.length > 0) {
      const precisaAjuste = config.cartoes.some(c => 
        (c.nome === 'Bradesco Black' && !c.ajusteDisponivel) ||
        (c.nome === 'Nu Crédito' && !c.ajusteDisponivel)
      );

      if (precisaAjuste) {
        const cartoesAtualizados = config.cartoes.map(cartao => {
          if (cartao.nome === 'Bradesco Black') {
            return { ...cartao, ajusteDisponivel: 1789.78 };
          }
          if (cartao.nome === 'Nu Crédito') {
            return { ...cartao, ajusteDisponivel: -5514.54 };
          }
          return cartao;
        });

        updateConfig({ cartoes: cartoesAtualizados });
        ajusteAplicado.current = true;
      }
    }
  }, [config.cartoes, updateConfig]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Cartões de Crédito</h1>
        <p className="text-muted-foreground">
          Adicione, edite ou remova seus cartões de crédito
        </p>
      </div>
      
      <CartoesConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
    </div>
  );
}
