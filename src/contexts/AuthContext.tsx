import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    collection
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Household } from '../types';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    userProfile: UserProfile | null;
    currentHousehold: Household | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    joinHouseholdByCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // 1. Buscar ou Criar Perfil de Usuário
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);

                    let profileData: UserProfile;

                    if (userSnap.exists()) {
                        profileData = userSnap.data() as UserProfile;
                    } else {
                        // Novo usuário: criar perfil sem household inicialmente
                        profileData = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            currentHouseholdId: null,
                            createdAt: serverTimestamp()
                        };
                        // Salvamos parcialmente, atualizaremos com householdId abaixo
                        await setDoc(userRef, profileData);
                    }

                    // 2. Verificar/Criar Household
                    let householdId = profileData.currentHouseholdId;
                    let householdData: Household | null = null;

                    if (householdId) {
                        // Usuário já tem casa, buscar dados
                        const householdRef = doc(db, 'households', householdId);
                        const householdSnap = await getDoc(householdRef);
                        if (householdSnap.exists()) {
                            householdData = { id: householdSnap.id, ...householdSnap.data() } as Household;
                        }
                    }

                    if (!householdData) {
                        // Criar nova Household se não existir ou não for encontrada
                        const newHouseholdRef = doc(collection(db, 'households'));
                        const houseName = user.displayName ? `Família de ${user.displayName.split(' ')[0]}` : 'Minha Família';

                        // Gerar código de Alta Entropia (12 caracteres alfanuméricos)
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let inviteCode = '';
                        const randomValues = new Uint32Array(12);
                        crypto.getRandomValues(randomValues);
                        for (let i = 0; i < 12; i++) {
                            inviteCode += chars[randomValues[i] % chars.length];
                        }

                        const newHousehold: Omit<Household, 'id'> = {
                            name: houseName,
                            ownerId: user.uid,
                            members: [user.uid],
                            roles: { [user.uid]: 'OWNER' },
                            inviteCode,
                            createdAt: serverTimestamp(),
                            currency: 'BRL'
                        };

                        await setDoc(newHouseholdRef, newHousehold);

                        // Criar mapeamento de código para ID da casa (para busca rápida e segura)
                        await setDoc(doc(db, 'invite_codes', inviteCode), {
                            householdId: newHouseholdRef.id,
                            createdAt: serverTimestamp()
                        });

                        householdId = newHouseholdRef.id;
                        householdData = { id: householdId, ...newHousehold };

                        // Atualizar perfil do usuário com a nova household
                        await setDoc(userRef, { currentHouseholdId: householdId }, { merge: true });
                        profileData.currentHouseholdId = householdId;
                    }

                    setUserProfile(profileData);
                    setCurrentHousehold(householdData);

                } catch (error) {
                    console.error("Erro ao carregar dados do usuário/household:", error);
                    // Em caso de erro crítico, talvez deslogar ou mostrar erro
                }
            } else {
                setUserProfile(null);
                setCurrentHousehold(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const joinHouseholdByCode = async (code: string) => {
        if (!currentUser) return;

        // 1. Buscar o ID da casa pelo código
        const codeSnap = await getDoc(doc(db, 'invite_codes', code.toUpperCase()));
        if (!codeSnap.exists()) {
            throw new Error("Código inválido ou não encontrado.");
        }

        const { householdId } = codeSnap.data();

        // 2. Adicionar usuário à Household
        const householdRef = doc(db, 'households', householdId);

        // Usamos updateDoc para adicionar ao array e ao map de roles
        // Nota: Precisaremos atualizar as regras de segurança para permitir isso
        await setDoc(householdRef, {
            members: arrayUnion(currentUser.uid),
            roles: { [currentUser.uid]: 'MEMBER' }
        }, { merge: true });

        // 3. Atualizar perfil do usuário
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { currentHouseholdId: householdId });

        // 4. Atualizar estado local
        const householdSnap = await getDoc(householdRef);
        setCurrentHousehold({ id: householdSnap.id, ...householdSnap.data() } as Household);
        setUserProfile(prev => prev ? { ...prev, currentHouseholdId: householdId } : null);
    };

    const value = {
        currentUser,
        userProfile,
        currentHousehold,
        loading,
        signInWithGoogle,
        logout,
        joinHouseholdByCode
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
