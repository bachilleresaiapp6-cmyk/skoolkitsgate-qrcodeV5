"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle, Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { School, Copy, Check, RefreshCw } from "lucide-react";
import { Input } from '@/components/ui/input';

export function EnrollmentForm() {
  const { toast } = useToast();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleGenerateCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newSchoolId = `ESC-${randomNum}`;
    setSchoolId(newSchoolId);
    setHasCopied(false); // Reset copied state when a new code is generated
    toast({
      title: "Nuevo Código de Escuela Generado",
      description: `El nuevo código es: ${newSchoolId}`,
    });
  };

  const handleCopy = () => {
    if (!schoolId) return;
    navigator.clipboard.writeText(schoolId);
    setHasCopied(true);
    toast({
      title: "Copiado",
      description: "El código de la escuela ha sido copiado al portapapeles.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="text-center space-y-4">
      <CardHeader className="p-0">
        <CardTitle>Inscripción de Escuela</CardTitle>
        <CardDescription>
          Genera un código único para registrar una nueva institución en el sistema.
        </CardDescription>
      </CardHeader>

      <div className="flex justify-center p-4">
        <School className="w-16 h-16 text-primary" />
      </div>

      {schoolId ? (
        <Card className="bg-muted border-dashed">
            <CardContent className="pt-6 space-y-4">
                <p className="text-sm font-medium">Comparte este código con tus usuarios:</p>
                <div className="flex items-center gap-2">
                    <Input 
                        readOnly 
                        value={schoolId}
                        className="font-mono text-lg h-12 text-center tracking-widest"
                    />
                    <Button size="icon" onClick={handleCopy} className="h-12 w-12 shrink-0">
                        {hasCopied ? <Check /> : <Copy />}
                    </Button>
                </div>
                 <Button onClick={handleGenerateCode} variant="outline" className="w-full">
                    <RefreshCw className="mr-2"/>
                    Generar Otro Código
                </Button>
            </CardContent>
        </Card>
      ) : (
        <>
            <p className="text-sm text-muted-foreground">
                Haz clic en el botón de abajo para generar un nuevo y único código de escuela.
            </p>
            <Button onClick={handleGenerateCode} className="w-full">
                Generar Código de Escuela
            </Button>
        </>
      )}
    </div>
  );
}
