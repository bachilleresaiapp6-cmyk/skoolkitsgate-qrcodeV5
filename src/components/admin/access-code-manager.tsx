"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getActiveCodes, generateAccessCode, revokeCode } from '@/lib/api';
import type { AccessCode } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Ban, Copy, Check, ExternalLink } from 'lucide-react';
import QRCode from "react-qr-code";

const formSchema = z.object({
  lectorAsignado: z.string().optional(),
  usosMaximos: z.string(),
});

export function AccessCodeManager() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyGeneratedCode, setNewlyGeneratedCode] = useState<{ id: string, code: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lectorAsignado: 'TODOS',
      usosMaximos: '0',
    },
  });
  
  // NOTE: In a real app, the admin email should come from a secure auth context.
  const adminEmail = 'admin@example.com';

  const fetchCodes = async () => {
    setIsLoading(true);
    const response = await getActiveCodes();
    if (response.status === 'success' && response.data) {
      setCodes(response.data.codigos);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerateCode = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const lector = values.lectorAsignado || 'TODOS';
    const usos = parseInt(values.usosMaximos, 10);
    
    const result = await generateAccessCode(adminEmail, lector, usos);

    if (result.status === 'success' && result.data) {
      toast({
        title: "Éxito",
        description: `Código ${result.data.codigo} generado.`,
      });
      setNewlyGeneratedCode({ id: result.data.id, code: result.data.codigo });
      setIsModalOpen(true);
      fetchCodes();
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error al generar código",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };

  const handleRevokeCode = async (id: string) => {
    const motivo = prompt('Motivo de la revocación (opcional):', 'Revocado por administrador');
    if (motivo === null) return;

    const result = await revokeCode(id, adminEmail, motivo);
    if (result.status === 'success') {
      toast({
        title: "Éxito",
        description: "El código ha sido revocado.",
      });
      fetchCodes();
    } else {
      toast({
        variant: "destructive",
        title: "Error al revocar",
        description: result.message,
      });
    }
  };
  
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <div className="space-y-8 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Generar Código de Acceso</CardTitle>
            <CardDescription>Crea un nuevo código de un solo uso o permanente.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerateCode)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="usosMaximos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Usos</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Ilimitados (hasta revocación)</SelectItem>
                          <SelectItem value="1">1 uso</SelectItem>
                          <SelectItem value="5">5 usos</SelectItem>
                          <SelectItem value="10">10 usos</SelectItem>
                          <SelectItem value="50">50 usos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lectorAsignado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lector Específico (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: CEL-001 o TODOS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                  Generar Código
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Códigos de Acceso Activos</CardTitle>
            <CardDescription>
              Lista de códigos que están actualmente en uso y no han sido revocados o agotados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : codes.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">No hay códigos activos.</p>
            ) : (
              <div className="overflow-x-auto">
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Lector</TableHead>
                          <TableHead>Usos</TableHead>
                          <TableHead>Generado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {codes.map((code) => (
                          <TableRow key={code.id}>
                          <TableCell className="font-mono font-bold">
                              {code.codigo}
                          </TableCell>
                          <TableCell>
                              <Badge variant={code.lectorAsignado === 'TODOS' ? 'secondary' : 'default'}>
                              {code.lectorAsignado}
                              </Badge>
                          </TableCell>
                          <TableCell>
                              {code.usosActuales} / {code.usosMaximos === 0 ? '∞' : code.usosMaximos}
                          </TableCell>
                          <TableCell>
                              {new Date(code.fechaGeneracion).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleRevokeCode(code.id)} title="Revocar código">
                                  <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                          </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Generado Exitosamente</DialogTitle>
            <DialogDescription>
              Comparte este código o el QR con el usuario. Una vez cierres esta ventana, no podrás ver el QR de nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
             <div className="bg-white p-4 rounded-lg border shadow-md">
                {newlyGeneratedCode && <QRCode value={newlyGeneratedCode.code} size={160} />}
             </div>
             <div className="flex items-center space-x-2 w-full">
                <Input
                    id="code"
                    readOnly
                    value={newlyGeneratedCode?.code || ''}
                    className="font-mono text-lg h-12 flex-grow"
                />
                <Button size="icon" className="h-12 w-12" onClick={() => handleCopy(newlyGeneratedCode?.code || '')}>
                  {copiedCode === newlyGeneratedCode?.code ? <Check /> : <Copy />}
                </Button>
            </div>
             <Button asChild variant="outline" className="w-full">
                <a href={`/scanner?lector=TODOS`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2"/>
                    Probar en el Lector Universal
                </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
