"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUsers, adminCreateUser, adminDeleteUser, getGrupos } from '@/lib/api';
import type { User, Role, GrupoEscolar } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { normalizeName } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Trash2, Contact, Link2, Users, Filter, Search } from 'lucide-react';
import { StudentIdCard } from '@/components/dashboard/student/student-id-card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const adminCreateFormSchema = z.object({
  nombre: z.string().min(3, { message: "Mínimo 3 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres." }),
  rol: z.enum(ROLES),
});

export function UserManager({ onUsersChanged, idEscuela }: { onUsersChanged: () => void; idEscuela?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [grupos, setGrupos] = useState<GrupoEscolar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [roleFilter, setRoleFilter] = useState<string>('ALUMNO');
  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const { toast } = useToast();

  const createForm = useForm<z.infer<typeof adminCreateFormSchema>>({
    resolver: zodResolver(adminCreateFormSchema),
    defaultValues: { nombre: "", email: "", password: "", rol: 'Alumno' },
  });
  
  const fetchUsers = async () => {
    if (!idEscuela) return;
    setIsLoading(true);
    try {
        const response = await getUsers(idEscuela);
        if (response.status === 'success' && response.data) {
          setUsers(response.data.users);
        }
    } catch(e) {}
    setIsLoading(false);
  };

  const fetchGruposList = async () => {
    if (!idEscuela) return;
    try {
        const res = await getGrupos(idEscuela);
        if (res.status === 'success' && res.data) {
            setGrupos(res.data.grupos);
        }
    } catch(e) {}
  };

  useEffect(() => {
    if (idEscuela) {
        fetchUsers();
        fetchGruposList();
    }
  }, [idEscuela]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
        const matchesRole = roleFilter === 'TODOS' || u.rol.toUpperCase() === roleFilter;
        const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  const handleCreateUser = async (values: z.infer<typeof adminCreateFormSchema>) => {
    setIsSubmitting(true);
    const result = await adminCreateUser({ ...values, idEscuela, nombre: normalizeName(values.nombre) });
    if (result.status === 'success') {
      toast({ title: "Éxito", description: "Usuario registrado." });
      setIsCreateModalOpen(false);
      fetchUsers();
      onUsersChanged();
      createForm.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleLinkToGroup = async () => {
    if (!selectedUser || !selectedGroupId) return;
    setIsSubmitting(true);
    
    try {
        const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'link_student_to_group',
                email: selectedUser.email,
                groupId: selectedGroupId
            })
        });
        const data = await res.json();
        if(data.status === 'success') {
            toast({ title: "Éxito", description: "Vínculo académico completado." });
            setIsLinkModalOpen(false);
            fetchUsers();
        } else {
            throw new Error(data.message);
        }
    } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message || "Fallo en vinculación." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mt-4 pb-10">
      <Card className="border-none shadow-sm bg-primary/5">
        <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
                    <Filter className="h-3 w-3"/> Gestión de Usuarios
                </h3>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 text-[9px] font-black uppercase"><PlusCircle className="mr-1 h-3 w-3"/> Nuevo</Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95%] max-w-md rounded-2xl">
                        <DialogHeader><DialogTitle className="uppercase font-black text-sm">Nuevo Registro</DialogTitle></DialogHeader>
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                                <FormField control={createForm.control} name="rol" render={({ field }) => (
                                    <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-10 text-xs font-bold uppercase"><SelectValue placeholder="Rol"/></SelectTrigger></FormControl><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r} className="text-xs font-bold uppercase">{r}</SelectItem>)}</SelectContent></Select></FormItem>
                                )}/>
                                <FormField control={createForm.control} name="nombre" render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="NOMBRE COMPLETO" {...field} className="h-10 text-xs font-black uppercase"/></FormControl></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={createForm.control} name="email" render={({ field }) => (
                                        <FormItem><FormControl><Input placeholder="EMAIL" {...field} className="h-10 text-xs"/></FormControl></FormItem>
                                    )}/>
                                    <FormField control={createForm.control} name="password" render={({ field }) => (
                                        <FormItem><FormControl><Input type="password" placeholder="CLAVE" {...field} className="h-10 text-xs"/></FormControl></FormItem>
                                    )}/>
                                </div>
                                <Button type="submit" className="w-full h-12 text-xs font-black uppercase" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : "Registrar"}</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                        placeholder="BUSCAR NOMBRE O EMAIL..." 
                        className="pl-10 h-10 text-[10px] font-bold uppercase border-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 text-[10px] font-black uppercase border-primary/20">
                        <SelectValue placeholder="FILTRAR POR ROL" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALUMNO" className="text-xs font-bold uppercase">Ver Alumnos</SelectItem>
                        <SelectItem value="DOCENTE" className="text-xs font-bold uppercase">Ver Docentes</SelectItem>
                        <SelectItem value="TUTOR" className="text-xs font-bold uppercase">Ver Tutores</SelectItem>
                        <SelectItem value="ADMINISTRATIVO" className="text-xs font-bold uppercase">Ver Administrativos</SelectItem>
                        <SelectItem value="DIRECTOR" className="text-xs font-bold uppercase">Ver Directores</SelectItem>
                        <SelectItem value="TODOS" className="text-xs font-bold uppercase">Ver Todos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="p-4 bg-muted/30">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary"/> Resultados ({filteredUsers.length})
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {isLoading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-primary"/></div>
            ) : (
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[9px] font-black uppercase h-8 px-4">Usuario</TableHead>
                                <TableHead className="text-[9px] font-black uppercase h-8 text-right px-4">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.email} className="hover:bg-primary/5 border-b last:border-0 h-16">
                                    <TableCell className="px-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] uppercase text-primary leading-tight truncate max-w-[180px]">{user.nombre}</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-black uppercase border-primary/30">{user.rol}</Badge>
                                                <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                                            </div>
                                            {(user.rol === 'Alumno' && user.grupo) && (
                                                <span className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-tighter italic">Sección: {user.grado}°{user.grupo}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            {(user.rol === 'Alumno' || user.rol === 'Docente') && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="Vincular a Grupo" onClick={() => { setSelectedUser(user); setIsLinkModalOpen(true); }}>
                                                    <Link2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setSelectedUser(user); setIsCredentialModalOpen(true); }}>
                                                <Contact className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-12 text-[10px] font-bold uppercase text-muted-foreground italic">
                                        No hay usuarios en esta categoría.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="w-[95%] max-w-sm rounded-2xl">
            <DialogHeader><DialogTitle className="text-sm font-black uppercase">Vinculación Académica</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Selecciona el grupo destino para:</p>
                <div className="p-3 bg-muted rounded-lg border">
                    <p className="font-black text-xs uppercase">{selectedUser?.nombre}</p>
                </div>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="h-12 text-xs font-black uppercase"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
                    <SelectContent>
                        {grupos.map(g => (
                            <SelectItem key={g.id} value={g.id} className="text-xs font-bold uppercase">
                                {g.grado} {g.letra} | {g.turno === 'Matutino' ? 'MAT' : 'VES'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter><Button className="w-full h-12 text-xs font-black uppercase" onClick={handleLinkToGroup} disabled={isSubmitting || !selectedGroupId}>Confirmar Vínculo</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
        <DialogContent className="bg-transparent border-none shadow-none flex justify-center p-0">{selectedUser && <StudentIdCard user={selectedUser} />}</DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="w-[90%] rounded-xl">
            <AlertDialogHeader><AlertDialogTitle className="text-sm font-black uppercase">¿Confirmar Borrado?</AlertDialogTitle><AlertDialogDescription className="text-xs">Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2">
                <AlertDialogCancel className="mt-0 flex-1 h-10 text-xs font-bold">No</AlertDialogCancel>
                <AlertDialogAction onClick={async () => { await adminDeleteUser(userToDelete!.email); fetchUsers(); setIsDeleteModalOpen(false); }} className="flex-1 h-10 text-xs font-bold bg-destructive">Sí, borrar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
