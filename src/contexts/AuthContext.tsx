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
                        // 2b. Se não tem household, verificar se tem CONVITE pendente
                        // Buscamos na coleção 'invites' pelo email do usuário
                        const inviteRef = doc(db, 'invites', user.email!);
                        const inviteSnap = await getDoc(inviteRef);

                        if (inviteSnap.exists()) {
                            // Achou convite!
                            const inviteData = inviteSnap.data();
                            householdId = inviteData.householdId;

                            // TENTATIVA DE AUTO-JOIN: Atualizar a household adicionando-se aos membros
                            // Isso só funciona porque a regra de segurança permite update se invitedEmails contiver nosso email
                            const householdRef = doc(db, 'households', householdId!);

                            try {
                                await updateDoc(householdRef, {
                                    members: arrayUnion(user.uid)
                                });

                                // Sucesso no join!
                                // Pegar dados atualizados da casa
                                const householdSnap = await getDoc(householdRef);
                                if (householdSnap.exists()) {
                                    householdData = { id: householdSnap.id, ...householdSnap.data() } as Household;

                                    // Atualizar perfil do usuário
                                    await setDoc(userRef, { currentHouseholdId: householdId }, { merge: true });
                                    profileData.currentHouseholdId = householdId;
                                }
                            } catch (joinError) {
                                console.error("Erro ao aceitar convite automaticamente:", joinError);
                                // Se falhar (ex: regra de segurança bloqueou), cairá no fallback de criar nova casa abaixo?
                                // Não, melhor deixar null pra criar nova casa de fallback ou mostrar erro.
                                // Vamos deixar cair no fallback de criar casa nova para não travar o login, 
                                // mas idealmente o usuário veria um erro.
                            }
                        }
                    }

                    if (!householdData) {
                        // Criar nova Household se não existir ou não for encontrada
                        const newHouseholdRef = doc(collection(db, 'households'));
                        const houseName = user.displayName ? `Família de ${user.displayName.split(' ')[0]}` : 'Minha Família';

                        const newHousehold: Omit<Household, 'id'> = {
                            name: houseName,
                            ownerId: user.uid,
                            members: [user.uid],
                            createdAt: serverTimestamp(),
                            currency: 'BRL'
                        };

                        await setDoc(newHouseholdRef, newHousehold);

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

    const value = {
        currentUser,
        userProfile,
        currentHousehold,
        loading,
        signInWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
