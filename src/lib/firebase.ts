import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const FAMILIA_ID = "pbfamily";
export const CONFIG_PATH = `familias/${FAMILIA_ID}/config/geral`;
export const TRANSACOES_PATH = `familias/${FAMILIA_ID}/transacoes`;

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const CATEGORIAS_SAIDA = {
  'Ajustes': ['Ajuste de Saída'],
  'Alimentação': ['Açougue/Peixaria', 'Armazém dos Pães', 'Barbosa', 'Coop', 'Hortifruti', 'iFood', 'Mercadinho (Reposição)', 'Padaria', 'Padaria do Pombo', 'Rosalina', 'Shalom', 'Shibata', 'Supermercado (Compra Mês)', 'Outros (Alimentação)'],
  'Dívidas e Empréstimos': ['Empréstimo André', 'Pagar Fatura', 'Outros Empréstimos'],
  'Filhos': ['Pensão Alimentícia', 'Escola/Material', 'Roupas (Filhos)', 'Brinquedos/Presentes', 'Outros (Filhos)'],
  'Lazer e Delivery': ['Cinema/Eventos', 'Disney+', 'Google One', 'HBO Max', 'iFood/Delivery', 'Netflix', 'Parque da Cidade', 'Parque Santos Dumont', 'Parque Vicentina Aranha', 'Patinete Elétrico', 'Peixinho', 'Prime Video', 'Restaurante/Bar', 'SESC', 'Spotify', 'Streaming', 'Vaquinha Mumu', 'Viagens', 'Outros (Lazer)'],
  'Moradia': ['Aluguel/Prestação', 'Condomínio', 'Água', 'Luz', 'Claro', 'Gás', 'Manutenção', 'IPTU', 'Outros (Moradia)'],
  'Obrigações': ['DAS', 'Cooperemb', 'Impostos (Outros)', 'Outros (Obrigações)'],
  'Outros': ['Presentes (Geral)', 'Doações', 'Investimentos', 'Saque', 'Movimentações', 'Outros (Geral)'],
  'Pessoal': ['Academia', 'Cosméticos', 'Mercado Livre', 'Psicóloga Carol', 'Roupas (Casal)', 'Salão/Barbearia', 'Shein', 'Shopee', 'Outros (Pessoal)'],
  'Saúde': ['Farmácia', 'Convênio Médico', 'Consultas/Exames', 'Outros (Saúde)'],
  'Transporte': ['Combustível', 'Estacionamentos', 'Manutenção', 'Seguro/IPVA', 'SemParar', 'Transporte (App)', 'Transporte (Público)', 'Zona Azul', 'Outros (Transporte)']
};

export const CATEGORIAS_ENTRADA = {
  'Ajustes': ['Ajuste de Entrada'],
  'Renda Principal': ['Salário (Dan)', 'Salário (Carol)', 'Benefício (Caju)', 'Benefícios (Flash)'],
  'Renda Extra': ['Bônus', 'Freelance', 'Vendas', 'Outros (Renda Extra)'],
  'Outras Entradas': ['Presente', 'Reembolso', 'Investimentos', 'Outros']
};

export type TransacaoTipo = 'entrada' | 'saida';

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: TransacaoTipo;
  fonte: string;
  categoria: string;
  subcategoria: string;
  pessoa: string;
  parcela?: string;
  createdAt: Date;
}

export interface Conta {
  id: string;
  nome: string;
  disponivelPara: string[];
  tipo?: string;
  agencia?: string;
  numeroConta?: string;
  digito?: string;
}

export interface Beneficio {
  nome: string;
  disponivelPara: string[];
}

export interface Cartao {
  nome: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  disponivelPara: string[];
  ajusteDisponivel?: number;
}

export interface ContaFixa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  subcategoria: string;
  fonte: string;
  tipo: TransacaoTipo;
  pessoa: string;
  diaVencimento: number;
  ativa: boolean;
}

export interface CategoriasCustomizadas {
  entrada: Record<string, string[]>;
  saida: Record<string, string[]>;
}

export interface Config {
  contas: Conta[];
  beneficios: Beneficio[];
  cartoes: Cartao[];
  contasFixas: ContaFixa[];
  categoriasCustomizadas?: CategoriasCustomizadas;
}

// Helper para mesclar categorias padrão com customizadas
export const getCategorias = (tipo: 'entrada' | 'saida', config?: Config): Record<string, string[]> => {
  const categoriasBase = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  const categoriasCustom = config?.categoriasCustomizadas?.[tipo] || {};

  // Merge das categorias base com as customizadas
  const merged = { ...categoriasBase };

  // Aplica customizações (adiciona novas ou remove existentes)
  Object.entries(categoriasCustom).forEach(([key, value]) => {
    if (value === null) {
      // null indica remoção
      delete merged[key];
    } else {
      // adiciona ou sobrescreve
      merged[key] = value;
    }
  });

  return merged;
};
