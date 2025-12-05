
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    currentHouseholdId: string | null; // ID da casa atual do usuário
    createdAt: any; // Timestamp do Firestore
}

export interface Household {
    id: string;
    name: string; // Ex: "Família do Dan"
    ownerId: string; // UID do criador
    members: string[]; // Lista de UIDs dos membros
    roles: Record<string, 'OWNER' | 'MEMBER'>; // Mapa UID -> Role
    inviteCode?: string; // Código de convite único
    createdAt: any; // Timestamp do Firestore
    currency: string; // Ex: "BRL"
}
