import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, documentId, updateDoc, setDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, Household } from '@/types'; // Assuming Household type is available
import { Loader2, Copy, LogIn, Crown, User as UserIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useFirestore } from '@/hooks/useFirestore';

export function FamilyConfig() {
    const { currentHousehold, currentUser, joinHouseholdByCode, createHousehold, switchHousehold } = useAuth();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [myHouseholds, setMyHouseholds] = useState<Household[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [joining, setJoining] = useState(false);

    // Carregar membros E casas do usuário
    useEffect(() => {
        if (!currentUser) return;

        async function fetchData() {
            setLoadingMembers(true);
            try {
                // 1. Membros da casa atual
                if (currentHousehold?.members?.length) {
                    const qMembers = query(collection(db, 'users'), where(documentId(), 'in', currentHousehold.members));
                    const snapshotMembers = await getDocs(qMembers);
                    setMembers(snapshotMembers.docs.map(doc => doc.data() as UserProfile));
                } else {
                    setMembers([]); // Clear members if no current household or no members
                }

                // 2. Casas do usuário (Switcher)
                const qHouseholds = query(collection(db, 'households'), where('members', 'array-contains', currentUser!.uid));
                const snapshotHouseholds = await getDocs(qHouseholds);
                const houses = snapshotHouseholds.docs.map(doc => ({ id: doc.id, ...doc.data() } as Household));
                setMyHouseholds(houses);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoadingMembers(false);
            }
        }
        fetchData();
    }, [currentHousehold, currentUser]);

    const handleCopyCode = () => {
        if (currentHousehold?.inviteCode) {
            navigator.clipboard.writeText(currentHousehold.inviteCode);
            toast.success("Código copiado!");
        } else {
            toast.error("Código não disponível.");
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode || joinCode.length < 6) {
            toast.error("Código inválido.");
            return;
        }

        setJoining(true);
        try {
            await joinHouseholdByCode(joinCode);
            toast.success("Você entrou na nova família!");
            setJoinCode('');
            window.location.reload();
        } catch (error) {
            console.error("Erro ao entrar:", error);
            toast.error("Falha ao entrar: Código inválido ou erro de sistema.");
        } finally {
            setJoining(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!currentHousehold) return;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
        let newCode = '';
        const randomValues = new Uint32Array(12);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < 12; i++) {
            newCode += chars[randomValues[i] % chars.length];
        }

        try {
            await updateDoc(doc(db, 'households', currentHousehold.id), { inviteCode: newCode });
            await setDoc(doc(db, 'invite_codes', newCode), { householdId: currentHousehold.id, createdAt: new Date() });
            toast.success("Código gerado com sucesso!");
            window.location.reload();
        } catch (error) {
            console.error("Erro ao gerar código:", error);
            toast.error("Erro ao gerar código.");
        }
    };

    const handleCreateFamily = async () => {
        const name = window.prompt("Nome da nova família (ex: Família Silva):");
        if (!name) return;

        setJoining(true);
        try {
            await createHousehold(name);
            toast.success("Nova família criada com sucesso!");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar família.");
        } finally {
            setJoining(false);
        }
    };

    // Verificação robusta: É owner se tiver a role OU se for o criador original (legado)
    const userRole = currentHousehold?.roles?.[currentUser?.uid || ''] || 'MEMBER';
    const isOwner = userRole === 'OWNER' || currentHousehold?.ownerId === currentUser?.uid;

    return (
        <div className="space-y-8">
            {/* SEÇÃO 0: MEUS LARES (Household Switcher) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myHouseholds.map(house => (
                    <div
                        key={house.id}
                        onClick={() => house.id !== currentHousehold?.id && switchHousehold(house.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-secondary/50 flex items-center justify-between ${house.id === currentHousehold?.id ? 'border-primary bg-secondary/20 ring-1 ring-primary' : 'bg-card'}`}
                    >
                        <div>
                            <p className="font-medium">{house.name}</p>
                            <p className="text-xs text-muted-foreground">{house.members?.length || 0} membros</p>
                        </div>
                        {house.id === currentHousehold?.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                ))}

                {/* Botão Criar Novo (Card) */}
                <div
                    onClick={handleCreateFamily}
                    className="p-4 border border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 flex items-center justify-center gap-2 text-muted-foreground transition-all"
                >
                    <Crown className="w-4 h-4" />
                    <span>Criar Nova Família</span>
                </div>
            </div>

            {/* SEÇÃO 1: DADOS DA FAMÍLIA ATUAL (CÓDIGO) */}
            <div className="space-y-4 pt-4 border-t">
                <h2 className="text-lg font-semibold">Configurações de: {currentHousehold?.name}</h2>

                {isOwner ? (
                    <div className="p-4 border rounded-lg bg-secondary/20 space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Código de Convite</label>

                        {currentHousehold?.inviteCode ? (
                            <>
                                <div className="flex gap-2 items-center">
                                    <code className="flex-1 bg-background p-3 rounded border text-center text-2xl font-mono tracking-widest truncate">
                                        {currentHousehold.inviteCode}
                                    </code>
                                    <Button size="icon" variant="outline" onClick={handleCopyCode} title="Copiar Código">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Compartilhe este código com quem você quer adicionar.
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Esta família ainda não possui um código de convite (Legado).
                                </p>
                                <Button onClick={handleGenerateCode} variant="outline" className="w-full">
                                    <Crown className="mr-2 h-4 w-4" />
                                    Gerar Código de Convite
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 border rounded-lg bg-muted text-center text-sm text-muted-foreground">
                        Você é um membro desta família. Apenas o administrador pode ver o código de convite.
                    </div>
                )}
            </div>

            {/* SEÇÃO 2: MEMBROS */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Membros da Família</h2>
                <div className="space-y-3">
                    {loadingMembers ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando membros...
                        </div>
                    ) : (
                        members.map(member => {
                            const role = currentHousehold?.roles?.[member.uid] || 'MEMBER';
                            return (
                                <div key={member.uid} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.photoURL || ''} />
                                            <AvatarFallback>{member.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {role === 'OWNER' ? (
                                            <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full flex items-center gap-1 font-medium border border-amber-500/20">
                                                <Crown className="w-3 h-3" /> Admin
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1 dark:bg-slate-800 dark:text-slate-400">
                                                <UserIcon className="w-3 h-3" /> Membro
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* SEÇÃO 3: ENTRAR EM OUTRA FAMÍLIA (Código de Terceiros) */}
            <div className="pt-8 border-t">
                <h2 className="text-lg font-semibold mb-2">Entrar em outra Família</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Tem um código de convite? Digite abaixo para entrar.
                </p>
                <form onSubmit={handleJoin} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Código de Convite"
                        className="font-mono"
                        maxLength={12}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={joining} variant="secondary">
                        {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                        Entrar
                    </Button>
                </form>
            </div>

            {/* SEÇÃO 4: ZONA DE PERIGO */}
            {isOwner && (
                <div className="pt-8 border-t mt-8">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Zona de Perigo</h2>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-destructive">Zerar Dados da Família</h3>
                            <p className="text-sm text-muted-foreground">
                                Apaga todas as transações e contas, mantendo os membros. Ação irreversível.
                            </p>
                        </div>
                        <ResetAction />
                    </div>
                </div>
            )}
        </div>
    );
}

function ResetAction() {
    const { resetHousehold } = useFirestore(); // O hook que criamos
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        const confirm1 = window.confirm("ATENÇÃO: Você tem certeza que deseja RESETAR todos os dados da família? Isso apagará todas as transações, contas e categorias para TODOS os membros.");
        if (!confirm1) return;

        const confirm2 = window.confirm("Confirmação Final: Esta ação é irreversível. Deseja realmente continuar?");
        if (!confirm2) return;

        setLoading(true);
        try {
            await resetHousehold?.();
            toast.success("Dados resetados e recriados com sucesso.");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao resetar dados.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="destructive" onClick={handleReset} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Resetar Dados
        </Button>
    );
}
