import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/types';
import { Loader2, Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function FamilyConfig() {
    const { currentHousehold, currentUser } = useAuth();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(true);

    useEffect(() => {
        async function fetchMembers() {
            if (!currentHousehold?.members?.length) return;

            try {
                const q = query(collection(db, 'users'), where(documentId(), 'in', currentHousehold.members));
                const snapshot = await getDocs(q);
                const membersData = snapshot.docs.map(doc => doc.data() as UserProfile);
                setMembers(membersData);
            } catch (error) {
                console.error("Erro ao buscar membros:", error);
            } finally {
                setLoadingMembers(false);
            }
        }

        fetchMembers();
    }, [currentHousehold]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !currentHousehold) return;

        setLoading(true);
        try {
            const email = inviteEmail.toLowerCase().trim();

            // 1. Atualizar a Household com o email permitido
            const householdRef = doc(db, 'households', currentHousehold.id);
            await updateDoc(householdRef, {
                invitedEmails: arrayUnion(email)
            });

            // 2. Criar registro na coleção 'invites' para descoberta
            // Usamos o email como ID do documento para facilitar a busca por regra de segurança
            await setDoc(doc(db, 'invites', email), {
                householdId: currentHousehold.id,
                householdName: currentHousehold.name,
                invitedBy: currentUser?.uid,
                invitedAt: new Date()
            });

            toast.success(`Convite enviado para ${email}`);
            setInviteEmail('');
        } catch (error) {
            console.error("Erro ao convidar:", error);
            toast.error("Erro ao enviar convite");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-4">Membros da Família</h2>
                <div className="space-y-4">
                    {loadingMembers ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando membros...
                        </div>
                    ) : (
                        members.map(member => (
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
                                {member.uid === currentHousehold?.ownerId && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Dono</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="pt-6 border-t">
                <h2 className="text-lg font-semibold mb-4">Convidar Novo Membro</h2>
                <form onSubmit={handleInvite} className="flex gap-2">
                    <div className="relative flex-1">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="email"
                            placeholder="Digite o e-mail da pessoa..."
                            className="pl-9"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        {loading ? 'Enviando...' : 'Convidar'}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    A pessoa precisará fazer login com este e-mail Google para entrar na família.
                </p>
            </div>
        </div>
    );
}
