"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getGrupos, createGrupo, deleteGrupo } from '@/lib/api';
import type { GrupoEscolar, NivelEscolar } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, LayoutGrid, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ACADEMIC_STRUCTURE = {
  Secundaria: {
    grados: ["1er Grado", "2do Grado", "3er Grado"],
    carreras: []
  },
  Preparatoria: {
    grados: ["1er Semestre", "2do Semestre", "3er Semestre", "4to Semestre", "5to Semestre", "6to Semestre"],
    carreras: []
  },
  Universidad: {
    grados: ["1er Semestre", "2do Semestre", "3er Semestre", "4to Semestre", "5to Semestre", "6to Semestre", "7mo Semestre", "8vo Semestre", "9no Semestre"],
    carreras: ["Ingeniería en Sistemas", "Derecho", "Medicina", "Arquitectura", "Administración de Empresas"]
  }
};

const BASE_LETTERS = "ABCDEFGHIJKLM".split("");

const formSchema = z.object({
  nivel: z.enum(["Secundaria", "Preparatoria", "Universidad"]),
  grado: z.string().min(1, "Selecciona un grado."),
  letra: z.string().min(1, "Selecciona una letra."),
  turno: z.enum(["Matutino", "Vespertino"]),
  aula: z.string().min(1, "Define el aula."),
  carrera: z.string().optional()
});

export function GroupManager({ idEscuela }: { idEscuela?: string }) {
  const [grupos, setGrupos] = useState<GrupoEscolar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nivel: "Preparatoria", grado: "", letra: "A", turno: "Matutino", aula: "", carrera: "" }
  });

  const selectedNivel = form.watch("nivel") as NivelEscolar;

  const fetchGrupos = useCallback(async () => {
    if (!idEscuela) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const res = await getGrupos(idEscuela);
        if (res.status === 'success' && res.data?.grupos) {
            // Normalización extrema de idEscuela para que no haya fallos de visibilidad
            const normalized = res.data.grupos.map((g: any) => ({
                ...g,
                idEscuela: g.idEscuela || g.idescuela || idEscuela
            }));
            setGrupos(normalized);
        } else {
            setGrupos([]);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    } finally {
        setIsLoading(false);
    }
  }, [idEscuela]);

  useEffect(() => { 
    fetchGrupos(); 
  }, [fetchGrupos]);

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    if (!idEscuela) return;
    setIsSubmitting(true);
    try {
        const res = await createGrupo({ 
            ...values, 
            idEscuela, 
            id: `GRP-${Date.now()}` 
        });
        
        if (res.status === 'success') {
            toast({ title: "Éxito", description: "Grupo y Hoja de Lista generados correctamente." });
            form.reset({ ...form.getValues(), aula: "" });
            await fetchGrupos(); // REFRESCO INMEDIATO PARA VISUALIZACIÓN
        } else {
            toast({ variant: "destructive", title: "Error", description: res.message });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Fallo al conectar con el servidor." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este grupo?")) return;
    const res = await deleteGrupo(id);
    if (res.status === 'success') {
      toast({ title: "Eliminado", description: "El grupo ha sido removido." });
      fetchGrupos();
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-4 pb-10">
      <Card className="border-primary/10 shadow-sm mx-1">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase">
            <PlusCircle className="h-4 w-4 text-primary" /> Crear Nuevo Grupo
          </CardTitle>
          <CardDescription className="text-[10px] font-bold italic">Se generará una hoja de lista automática</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nivel"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Nivel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-xs font-bold uppercase"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{Object.keys(ACADEMIC_STRUCTURE).map(n => <SelectItem key={n} value={n} className="text-xs font-bold uppercase">{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grado"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Grado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-xs font-bold uppercase"><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                        <SelectContent>{ACADEMIC_STRUCTURE[selectedNivel].grados.map(g => <SelectItem key={g} value={g} className="text-xs font-bold uppercase">{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {selectedNivel === "Universidad" && (
                <FormField
                  control={form.control}
                  name="carrera"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Carrera</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-xs font-bold uppercase"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent>{ACADEMIC_STRUCTURE.Universidad.carreras.map(c => <SelectItem key={c} value={c} className="text-xs font-bold uppercase">{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="letra"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Letra</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-xs font-bold uppercase"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{BASE_LETTERS.map(l => <SelectItem key={l} value={l} className="text-xs font-bold uppercase">{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Turno</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-8 text-xs font-bold uppercase"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Matutino" className="text-xs font-bold uppercase">MAT</SelectItem>
                          <SelectItem value="Vespertino" className="text-xs font-bold uppercase">VES</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aula"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[9px] font-black uppercase">Aula</FormLabel>
                      <FormControl><Input placeholder="EJ: 101" {...field} className="h-8 text-xs font-black uppercase" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button type="submit" className="w-full h-10 text-[10px] font-black uppercase" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
                Crear Grupo y Hoja
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="border-none shadow-xl overflow-hidden bg-background mx-1">
        <CardHeader className="p-4 bg-muted/30 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-black uppercase">Grupos Operativos</CardTitle>
            <CardDescription className="text-[10px] font-bold italic">Base de datos institucional</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchGrupos()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-40 gap-3">
                <Loader2 className="animate-spin text-primary h-6 w-6" />
                <span className="text-[10px] font-black uppercase animate-pulse">Cargando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[9px] font-black uppercase h-8 px-4">Grado/Grupo</TableHead>
                    <TableHead className="text-[9px] font-black uppercase h-8 px-4 text-center">Aula</TableHead>
                    <TableHead className="text-[9px] font-black uppercase h-8 text-right px-4 whitespace-nowrap">Acc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map((g) => (
                    <TableRow key={g.id} className="hover:bg-muted/20 border-b last:border-0">
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-[11px] uppercase text-primary leading-none">
                            {(g.grado || '').split(" ")[0]}{g.letra}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{(g.nivel || '').substring(0,3)} | {g.turno === 'Matutino' ? 'MAT' : 'VES'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <Badge variant="outline" className="text-[9px] h-5 font-black border-primary/30 text-primary">
                            {g.aula || 'S/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(g.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {grupos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-[10px] font-bold uppercase text-muted-foreground italic">
                        No se encontraron grupos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
