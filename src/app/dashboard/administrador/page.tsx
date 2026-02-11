"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DeprecatedAdminDashboardPage() {
  
  return (
    <div className="flex h-full w-full items-center justify-center">
        <Card className="max-w-md text-center">
            <CardHeader>
                <div className="flex justify-center">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle>Rol Obsoleto</CardTitle>
                <CardDescription>
                    El rol de "Administrador" ha sido consolidado en el rol de "Director".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Este panel ya no está en uso. Si tienes el rol de Director, tu panel ya cuenta con todos los privilegios administrativos.
                </p>
                <Button asChild>
                    <Link href="/auth">Volver al Inicio</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
