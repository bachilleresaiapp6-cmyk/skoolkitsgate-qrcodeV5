"use client";

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { StudentIdCard } from '@/components/dashboard/student/student-id-card';
import { Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MyCredentialTab() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Card className="mt-6 border-none shadow-none">
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>No se pudo cargar la información del usuario.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Por favor, intenta iniciar sesión de nuevo.</p>
            </CardContent>
        </Card>
    );
  }
  
  const customUser = {
      ...user,
      rol: user.rol || 'Administrativo'
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-6 pb-10">
      <div className="w-full bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-muted-foreground">
              Toca la <span className="text-primary font-black">foto de perfil</span> para subir tu imagen real. Se guardará automáticamente en este dispositivo.
          </p>
      </div>
      
      <StudentIdCard user={customUser} />
      
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
          Credencial de Acceso Institucional
      </p>
    </div>
  );
}