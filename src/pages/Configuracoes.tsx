import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useFirestore } from '@/hooks/useFirestore';
import { ContasConfig } from '@/components/config/ContasConfig';
import { BeneficiosConfig } from '@/components/config/BeneficiosConfig';
import { CartoesConfig } from '@/components/config/CartoesConfig';
import { ContasFixasConfig } from '@/components/config/ContasFixasConfig';
import { CategoriasConfig } from '@/components/config/CategoriasConfig';

export default function Configuracoes() {
  const { config, updateConfig, transacoes } = useFirestore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas contas, cartões e configurações</p>
      </div>

      <Tabs defaultValue="contas" className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start md:justify-center gap-1 p-1">
          <TabsTrigger value="contas" className="flex-1 min-w-[100px] text-xs md:text-sm">Contas</TabsTrigger>
          <TabsTrigger value="beneficios" className="flex-1 min-w-[100px] text-xs md:text-sm">Benefícios</TabsTrigger>
          <TabsTrigger value="cartoes" className="flex-1 min-w-[100px] text-xs md:text-sm">Cartões</TabsTrigger>
          <TabsTrigger value="fixas" className="flex-1 min-w-[100px] text-xs md:text-sm">C. Fixas</TabsTrigger>
          <TabsTrigger value="categorias" className="flex-1 min-w-[100px] text-xs md:text-sm">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="space-y-4">
          <Card className="p-4 md:p-6">
            <ContasConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
          </Card>
        </TabsContent>

        <TabsContent value="beneficios" className="space-y-4">
          <Card className="p-4 md:p-6">
            <BeneficiosConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
          </Card>
        </TabsContent>

        <TabsContent value="cartoes" className="space-y-4">
          <Card className="p-4 md:p-6">
            <CartoesConfig config={config} updateConfig={updateConfig} transacoes={transacoes} />
          </Card>
        </TabsContent>

        <TabsContent value="fixas" className="space-y-4">
          <Card className="p-4 md:p-6">
            <ContasFixasConfig config={config} updateConfig={updateConfig} />
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card className="p-4 md:p-6">
            <CategoriasConfig config={config} updateConfig={updateConfig} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
