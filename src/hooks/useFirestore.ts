import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp, getDocs, getDoc } from 'firebase/firestore';
import { db, type Transacao, type Config } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useFirestore = () => {
  const { currentUser, currentHousehold } = useAuth();

  useEffect(() => {
    if (!currentUser || !currentHousehold) {
      setTransacoes([]);
      setConfig({ contas: [], beneficios: [], cartoes: [], contasFixas: [] });
      setLoading(false);
      return;
    }

    const qTransacoes = query(
      collection(db, 'households', currentHousehold.id, 'transacoes'),
      where('householdId', '==', currentHousehold.id) // RED CODE FIX: Explicit Isolation
    );
    const unsubTransacoes = onSnapshot(qTransacoes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Transacao[];
      setTransacoes(docs);
    });

    const unsubConfig = onSnapshot(doc(db, 'households', currentHousehold.id, 'config', 'geral'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as Config);
      } else {
        // Fallback or init empty
        setConfig({ contas: [], beneficios: [], cartoes: [], contasFixas: [] });
      }
      setLoading(false);
    });

    return () => {
      unsubTransacoes();
      unsubConfig();
    };
  }, [currentUser, currentHousehold]);

  const addTransacao = async (transacao: Omit<Transacao, 'id' | 'createdAt'>) => {
    if (!currentHousehold) return;
    await addDoc(collection(db, 'households', currentHousehold.id, 'transacoes'), {
      ...transacao,
      householdId: currentHousehold.id, // RED CODE FIX
      createdAt: Timestamp.now()
    });
  };

  const updateTransacao = async (id: string, data: Partial<Transacao>) => {
    if (!currentHousehold) return;
    await updateDoc(doc(db, 'households', currentHousehold.id, 'transacoes', id), data);
  };

  const deleteTransacao = async (id: string) => {
    if (!currentHousehold) return;
    await deleteDoc(doc(db, 'households', currentHousehold.id, 'transacoes', id));
  };

  const updateConfig = async (newConfig: Partial<Config>) => {
    if (!currentHousehold) return;
    await setDoc(doc(db, 'households', currentHousehold.id, 'config', 'geral'), newConfig, { merge: true });
  };

  const addTransacaoParcelada = async (transacao: Omit<Transacao, 'id' | 'createdAt'>, numParcelas: number) => {
    if (!currentHousehold) return;
    const batch = writeBatch(db);
    const valorParcela = transacao.valor / numParcelas;
    const dataInicial = new Date(transacao.data);

    for (let i = 0; i < numParcelas; i++) {
      const dataParcela = new Date(dataInicial);
      dataParcela.setMonth(dataParcela.getMonth() + i);

      const ref = doc(collection(db, 'households', currentHousehold.id, 'transacoes'));
      batch.set(ref, {
        ...transacao,
        valor: valorParcela,
        data: dataParcela.toISOString().split('T')[0],
        parcela: `${i + 1}/${numParcelas}`,
        descricao: `${transacao.descricao} (${i + 1}/${numParcelas})`,
        householdId: currentHousehold.id, // RED CODE FIX
        createdAt: Timestamp.now()
      });
    }

    await batch.commit();
  };

  const bootstrapHousehold = async () => {
    if (!currentHousehold) return;

    // REGRA DE OURO: Verificar se já existem dados
    // Verifica transações
    const transacoesSnap = await getDocs(collection(db, 'households', currentHousehold.id, 'transacoes'));
    // Verifica config (se tem contas)
    const configSnap = await getDoc(doc(db, 'households', currentHousehold.id, 'config', 'geral'));
    const configData = configSnap.exists() ? configSnap.data() as Config : null;

    if (!transacoesSnap.empty || (configData && configData.contas && configData.contas.length > 0)) {
      console.warn("Golden Rule: Household não está vazia. Abortando bootstrap.");
      return;
    }

    // Criar dados padrão
    const defaultConfig: Config = {
      contas: [
        { id: '1', nome: 'Carteira', tipo: 'carteira', saldo: 0, cor: 'green' },
        { id: '2', nome: 'Banco Principal', tipo: 'banco', saldo: 0, cor: 'blue' }
      ],
      cartoes: [],
      beneficios: [],
      contasFixas: [],
      categorias: [
        { id: 'cat1', nome: 'Alimentação', cor: 'red', tipo: 'despesa' },
        { id: 'cat2', nome: 'Moradia', cor: 'blue', tipo: 'despesa' },
        { id: 'cat3', nome: 'Salário', cor: 'green', tipo: 'receita' }
      ]
    };

    await setDoc(doc(db, 'households', currentHousehold.id, 'config', 'geral'), defaultConfig);
  };

  const resetHousehold = async () => {
    if (!currentHousehold) return;

    // 1. Deletar Transações (Batch se for muito grande, mas aqui simples)
    const transacoesSnap = await getDocs(collection(db, 'households', currentHousehold.id, 'transacoes'));
    const batch = writeBatch(db);
    transacoesSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Deletar Config (Zerando)
    batch.delete(doc(db, 'households', currentHousehold.id, 'config', 'geral'));

    await batch.commit();

    // 3. Rodar Bootstrapping
    await bootstrapHousehold();
  };

  return {
    transacoes,
    config,
    loading,
    addTransacao,
    updateTransacao,
    deleteTransacao,
    updateConfig,
    addTransacaoParcelada,
    resetHousehold
  };
};
