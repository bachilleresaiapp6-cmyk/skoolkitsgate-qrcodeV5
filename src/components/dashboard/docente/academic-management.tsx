"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAcademicConfig, getDocenteGrupos, updateDocenteGrupos } from '@/lib/api';
import type { User, DocenteGroup, AcademicConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Save } from 'lucide-react';

interface AcademicManagementProps {
    docente: User;
    onAssignmentsChanged: () => void;
}

const formSchema = z.object({
  assignments: z.array(z.object({
    grupo: z.string().min(1, "El grupo es requerido."),
    materia: z.string().min(1, "La materia es requerida."),
  }))
});

export function AcademicManagement({ docente, onAssignmentsChanged }: AcademicManagementProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignments"
  });

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    const res = await getDocenteGrupos(docente.email);
    if (res.status === 'success' && res.data?.grupos) {
        form.reset({ assignments: res.data.grupos });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las asignaciones actuales.' });
    }
    setIsLoading(false);
  }, [docente.email, form, toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = await updateDocenteGrupos(docente.email, data.assignments);
    if (result.status === 'success') {
      toast({ title: 'Éxito', description: 'Tus asignaciones han sido guardadas.' });
      onAssignmentsChanged(); // Notify parent to refetch
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  return (
     <Card className="mt-6">
        <CardHeader>
            <CardTitle>Gestión de Grupos y Materias</CardTitle>
            <CardDescription>
                Añade o elimina los grupos y materias que impartes. Estos aparecerán en el selector de la pestaña de Asistencia.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2 p-4 border rounded-lg bg-muted/50">
                                    <FormField
                                        control={form.control}
                                        name={`assignments.${index}.grupo`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Grupo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: 3A-SEC" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`assignments.${index}.materia`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Materia</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Matemáticas" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                        <Trash2 />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => append({ grupo: '', materia: '' })}
                                className="w-full"
                            >
                                <PlusCircle className="mr-2"/> Añadir Asignación
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
