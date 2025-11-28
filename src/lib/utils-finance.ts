import { Transacao, Cartao } from './firebase';

export const formatBRL = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatDate = (date: string): string => {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
};

export const calcularSaldoConta = (transacoes: Transacao[], nomeConta: string): number => {
  return transacoes
    .filter(t => t.fonte === nomeConta)
    .reduce((acc, t) => {
      return acc + (t.tipo === 'entrada' ? t.valor : -t.valor);
    }, 0);
};

export const calcularFaturaCartao = (transacoes: Transacao[], nomeCartao: string): number => {
  return transacoes
    .filter(t => t.fonte === nomeCartao)
    .reduce((acc, t) => {
      return acc + (t.tipo === 'saida' ? t.valor : -t.valor);
    }, 0);
};

export const calcularLimiteDisponivel = (cartao: Cartao, fatura: number): number => {
  const disponivel = Math.max(0, cartao.limite - fatura);
  return disponivel + (cartao.ajusteDisponivel || 0);
};

export const calcularProximoVencimento = (diaVencimento: number): Date => {
  if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
    return new Date();
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
  vencimento.setHours(0, 0, 0, 0);
  
  if (vencimento <= hoje) {
    vencimento.setMonth(vencimento.getMonth() + 1);
  }
  
  return vencimento;
};

export const calcularMelhorDiaCompra = (diaFechamento: number, diaVencimento: number): string => {
  if (!diaFechamento || diaFechamento < 1 || diaFechamento > 31) {
    return 'Dia de fechamento não definido';
  }
  
  // O melhor dia para comprar é logo após o fechamento da fatura
  const melhorDia = diaFechamento === 31 ? 1 : diaFechamento + 1;
  
  // Calcular quantos dias até o vencimento a partir do melhor dia de compra
  let diasAteVencimento: number;
  
  if (diaVencimento >= melhorDia) {
    diasAteVencimento = diaVencimento - melhorDia;
  } else {
    // Vencimento é no mês seguinte
    diasAteVencimento = (30 - melhorDia) + diaVencimento;
  }
  
  return `Dia ${melhorDia} (${diasAteVencimento} dias até vencimento)`;
};

export const calcularDiasAteVencimento = (diaVencimento: number): number => {
  if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
    return 0;
  }
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = calcularProximoVencimento(diaVencimento);
  const diff = vencimento.getTime() - hoje.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};
