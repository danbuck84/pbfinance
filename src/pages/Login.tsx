import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';

export default function Login() {
    const { signInWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Se já estiver logado, redireciona
    if (currentUser) {
        navigate('/');
        return null;
    }

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await signInWithGoogle();
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Falha ao fazer login com Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm p-6 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">PB Finance</h1>
                    <p className="text-muted-foreground">Faça login para continuar</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <Button
                    variant="outline"
                    className="w-full py-6"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        "Carregando..."
                    ) : (
                        <>
                            <Chrome className="mr-2 h-5 w-5" />
                            Entrar com Google
                        </>
                    )}
                </Button>
            </Card>
        </div>
    );
}
