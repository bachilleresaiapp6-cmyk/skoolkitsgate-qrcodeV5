"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CredentialCard, CredentialCardActions } from '@/components/credential-card';
import type { CredentialData as CredentialDataType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function CredentialDisplay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<CredentialDataType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const encodedData = searchParams.get('data');
    if (encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData));
        setData(decodedData);
        // FIX: Save user to localStorage to persist the session before redirecting
        if (decodedData.user && typeof window !== 'undefined') {
          localStorage.setItem('qrGateUser', JSON.stringify(decodedData.user));
        }
      } catch (e) {
        setError('No se pudieron cargar los datos de la credencial. Por favor, inténtalo de nuevo.');
      }
    } else {
      setError('No se proporcionaron datos para la credencial.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (countdown <= 0) {
      router.push(data.user.rol ? `/dashboard/${data.user.rol.toLowerCase()}` : '/auth');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [data, countdown, router]);

  if (error) {
    return (
      <div className="text-center text-destructive flex flex-col items-center gap-4">
        <AlertTriangle className="w-12 h-12" />
        <h2 className="text-xl font-bold">Error al Generar Credencial</h2>
        <p>{error}</p>
        <Button asChild>
          <Link href="/auth">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-lg">Generando tu credencial...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-center font-headline text-primary">¡Registro Exitoso!</h1>
      <p className="text-muted-foreground text-center">
        Aquí está tu credencial digital. Guárdala en un lugar seguro.
      </p>

      <div style={{ transform: 'scale(1.2)', margin: '2rem 0' }}>
         <CredentialCard data={data} cardRef={cardRef} />
      </div>

      <div className="w-full space-y-4">
        <CredentialCardActions cardRef={cardRef} userName={data.user.nombre} />

        <div className="text-center text-sm text-muted-foreground">
            <p>Redirigiendo a tu dashboard en <span className="font-bold text-primary">{countdown}</span> segundos...</p>
        </div>

        <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(data.user.rol ? `/dashboard/${data.user.rol.toLowerCase()}` : '/auth')}
        >
            Ir a mi Dashboard Ahora
        </Button>
      </div>
    </div>
  );
}

export default function CredentialPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
                <CredentialDisplay />
            </Suspense>
        </main>
    );
}
