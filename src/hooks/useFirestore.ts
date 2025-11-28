import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db, TRANSACOES_PATH, CONFIG_PATH, type Transacao, type Config } from '@/lib/firebase';

export const useFirestore = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [config, setConfig] = useState<Config>({
    contas: [],
    beneficios: [],
    cartoes: [],
    contasFixas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qTransacoes = query(collection(db, TRANSACOES_PATH));
    const unsubTransacoes = onSnapshot(qTransacoes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Transacao[];
      setTransacoes(docs);
    });

    const unsubConfig = onSnapshot(doc(db, CONFIG_PATH), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as Config);
      }
      setLoading(false);
    });

    return () => {
      unsubTransacoes();
      unsubConfig();
    };
  }, []);

  const addTransacao = async (transacao: Omit<Transacao, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, TRANSACOES_PATH), {
      ...transacao,
      createdAt: Timestamp.now()
    });
  };

  const updateTransacao = async (id: string, data: Partial<Transacao>) => {
    await updateDoc(doc(db, TRANSACOES_PATH, id), data);
  };

  const deleteTransacao = async (id: string) => {
    await deleteDoc(doc(db, TRANSACOES_PATH, id));
  };

  const updateConfig = async (newConfig: Partial<Config>) => {
    await setDoc(doc(db, CONFIG_PATH), newConfig, { merge: true });
  };

  const addTransacaoParcelada = async (transacao: Omit<Transacao, 'id' | 'createdAt'>, numParcelas: number) => {
    const batch = writeBatch(db);
    const valorParcela = transacao.valor / numParcelas;
    const dataInicial = new Date(transacao.data);

    for (let i = 0; i < numParcelas; i++) {
      const dataParcela = new Date(dataInicial);
      dataParcela.setMonth(dataParcela.getMonth() + i);
      
      const ref = doc(collection(db, TRANSACOES_PATH));
      batch.set(ref, {
        ...transacao,
        valor: valorParcela,
        data: dataParcela.toISOString().split('T')[0],
        parcela: `${i + 1}/${numParcelas}`,
        descricao: `${transacao.descricao} (${i + 1}/${numParcelas})`,
        createdAt: Timestamp.now()
      });
    }

    await batch.commit();
  };

  return {
    transacoes,
    config,
    loading,
    addTransacao,
    updateTransacao,
    deleteTransacao,
    updateConfig,
    addTransacaoParcelada
  };
};
