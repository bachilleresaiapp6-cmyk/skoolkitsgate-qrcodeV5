"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { User, DocenteGroup, StudentAttendance } from '@/lib/types';
import { getDocenteGrupos, getAlumnosDelGrupo } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CheckCircle, XCircle, Clock, School } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyCredentialTab } from "@/components/admin/my-credential-tab";
import { MyHistoryTab } from "@/components/admin/my-history-tab";
import { AcademicManagement } from '@/components/dashboard/docente/academic-management';
import { useToast } from '@/hooks/use-toast';

const GradesManager = dynamic(() => import('@/components/admin/grades-manager').then(mod => mod.GradesManager), {
  ssr: false,
});

export default function DocenteDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [docente, setDocente] = useState<User | null>(null);
  const [grupos, setGrupos] = useState<DocenteGroup[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [alumnos, setAlumnos] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlumnosLoading, setIsAlumnosLoading] = useState(false);

  const fetchDocenteGrupos = useCallback(async (email: string) => {
    setIsLoading(true);
    const res = await getDocenteGrupos(email);
    if (res.status === 'success' && res.data?.grupos) {
      setGrupos(res.data.grupos);
      if (res.data.grupos.length > 0) {
          const firstGroupIdentifier = `${res.data.grupos[0].grupo}::${res.data.grupos[0].materia}`;
          const isSelectedGrupoValid = res.data.grupos.some(g => `${g.grupo}::${g.materia}` === selectedGrupo);
          if (!selectedGrupo || !isSelectedGrupoValid) {
              setSelectedGrupo(firstGroupIdentifier);
          }
      } else {
          setSelectedGrupo(null);
          setAlumnos([]);
      }
    } else {
      setGrupos([]);
      setSelectedGrupo(null);
      setAlumnos([]);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las asignaciones actuales.' });
    }
    setIsLoading(false);
  }, [selectedGrupo, toast]);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.rol?.toLowerCase() !== 'docente') {
        router.replace(`/dashboard/${parsedUser.rol?.toLowerCase() || 'auth'}`);
      } else {
        setDocente(parsedUser);
      }
    } else {
      router.replace('/auth');
    }
  }, [router]);

  useEffect(() => {
    if (docente) {
      fetchDocenteGrupos(docente.email);
    }
  }, [docente, fetchDocenteGrupos]);

  useEffect(() => {
    if (selectedGrupo && docente?.idEscuela) {
      const [grupo, materia] = selectedGrupo.split('::');
      setIsAlumnosLoading(true);
      getAlumnosDelGrupo(grupo, materia, docente.idEscuela).then(res => {
        if (res.status === 'success' && res.data?.alumnos) {
          setAlumnos(res.data.alumnos);
        }
        setIsAlumnosLoading(false);
      });
    }
  }, [selectedGrupo, docente]);

  const getStatusBadge = (status: StudentAttendance['status']) => {
    switch (status) {
      case 'Presente':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Presente</Badge>;
      case 'Ausente':
        return <Badge variant="destructive">Ausente</Badge>;
      case 'Tarde':
        return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Tarde</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };
  
  const stats = alumnos.reduce((acc, alumno) => {
    if (alumno.status === 'Presente') acc.presentes++;
    if (alumno.status === 'Ausente') acc.ausentes++;
    if (alumno.status === 'Tarde') acc.tardes++;
    return acc;
  }, { presentes: 0, ausentes: 0, tardes: 0 });

  if (!docente) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="asistencia" className="w-full flex flex-col h-full overflow-hidden">
      <div className="bg-muted/30 border-b overflow-x-auto scrollbar-hide shrink-0 px-2 pt-2">
        <TabsList className="inline-flex w-auto min-w-full justify-start bg-transparent p-0 h-10 gap-1">
          <TabsTrigger value="asistencia" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Asistencia</TabsTrigger>
          <TabsTrigger value="gestion" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Grupos</TabsTrigger>
          <TabsTrigger value="calificaciones" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Evaluaciones</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Historial</TabsTrigger>
          <TabsTrigger value="credential" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Credencial</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <TabsContent value="asistencia" className="mt-0 outline-none">
          <div className="flex flex-col gap-4 h-full">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                  {isLoading ? (
                      <div className="h-10 w-full sm:w-[300px] bg-muted animate-pulse rounded-md"></div>
                  ) : (
                  <Select
                      onValueChange={setSelectedGrupo}
                      value={selectedGrupo || ""}
                      disabled={grupos.length === 0}
                  >
                      <SelectTrigger className="w-full sm:w-[300px] border-primary/20 shadow-sm font-bold text-xs uppercase">
                      <SelectValue placeholder="Seleccionar Grupo" />
                      </SelectTrigger>
                      <SelectContent>
                      {grupos.map((g) => (
                          <SelectItem key={`${g.grupo}::${g.materia}`} value={`${g.grupo}::${g.materia}`} className="text-xs font-bold uppercase">
                          {g.grupo} - {g.materia}
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  )}
                  <Card className="w-full sm:w-auto sm:ml-auto border-primary/10 shadow-none bg-primary/5">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                          <CardTitle className="text-[10px] font-black uppercase px-2 text-primary">Escuela</CardTitle>
                          <School className="h-3 w-3 text-primary" />
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                          <div className="text-sm font-black font-mono px-2">{docente?.idEscuela || 'N/A'}</div>
                      </CardContent>
                  </Card>
              </div>
              
              {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : !selectedGrupo ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                      <CardContent className="text-center py-12">
                          <h2 className="text-xl font-black uppercase text-muted-foreground">Sin grupos asignados</h2>
                          <p className="text-xs text-muted-foreground mt-2 mb-4">Ve a la pestaña "Grupos" para añadir tus materias.</p>
                      </CardContent>
                  </Card>
              ) : (
                  <div className="space-y-6">
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                          <Card className="shadow-sm border-primary/10">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                              <CardTitle className="text-[9px] font-black uppercase text-muted-foreground">Total</CardTitle>
                              <Users className="h-3 w-3 text-primary" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                              <div className="text-xl font-black">{alumnos.length}</div>
                          </CardContent>
                      </Card>
                          <Card className="shadow-sm border-green-500/10">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                              <CardTitle className="text-[9px] font-black uppercase text-green-700">Presentes</CardTitle>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                              <div className="text-xl font-black text-green-700">{stats.presentes}</div>
                          </CardContent>
                      </Card>
                          <Card className="shadow-sm border-destructive/10">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                              <CardTitle className="text-[9px] font-black uppercase text-destructive">Ausentes</CardTitle>
                              <XCircle className="h-3 w-3 text-destructive" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                              <div className="text-xl font-black text-destructive">{stats.ausentes}</div>
                          </CardContent>
                      </Card>
                          <Card className="shadow-sm border-yellow-500/10">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                              <CardTitle className="text-[9px] font-black uppercase text-yellow-700">Tardes</CardTitle>
                              <Clock className="h-3 w-3 text-yellow-500" />
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                              <div className="text-xl font-black text-yellow-700">{stats.tardes}</div>
                          </CardContent>
                      </Card>
                  </div>

                  <Card className="border-none shadow-xl overflow-hidden">
                      <CardHeader className="p-4 bg-muted/30">
                      <CardTitle className="text-sm font-black uppercase tracking-tight">Lista del Grupo</CardTitle>
                      <CardDescription className="text-[10px] font-bold italic">
                          Estado de asistencia hoy
                      </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                      {isAlumnosLoading ? (
                          <div className="flex justify-center items-center h-64">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="ml-2 font-bold text-xs uppercase">Actualizando...</p>
                          </div>
                      ) : (
                          <div className="overflow-x-auto scrollbar-hide">
                            <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                <TableHead className="text-[9px] font-black uppercase h-8 px-4">Nombre</TableHead>
                                <TableHead className="text-[9px] font-black uppercase h-8 px-4">Estado</TableHead>
                                <TableHead className="text-[9px] font-black uppercase h-8 text-right px-4 whitespace-nowrap">Hora</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alumnos.map((alumno) => (
                                <TableRow key={alumno.email} className="hover:bg-muted/20">
                                    <TableCell className="font-bold text-[11px] uppercase py-3 px-4">{alumno.nombre}</TableCell>
                                    <TableCell className="px-4">{getStatusBadge(alumno.status)}</TableCell>
                                    <TableCell className="text-right font-mono text-[10px] font-black px-4">{alumno.hora || '--:--'}</TableCell>
                                </TableRow>
                                ))}
                                {alumnos.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12 text-xs font-bold italic uppercase">
                                    No hay registros para este grupo hoy.
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
              )}
              </div>
        </TabsContent>

        <TabsContent value="gestion" className="mt-0 outline-none">
          <AcademicManagement 
              docente={docente} 
              onAssignmentsChanged={() => fetchDocenteGrupos(docente.email)} 
          />
        </TabsContent>
        
        <TabsContent value="calificaciones" className="mt-0 outline-none">
          <GradesManager idEscuela={docente?.idEscuela} />
        </TabsContent>
        <TabsContent value="history" className="mt-0 outline-none">
          <MyHistoryTab />
        </TabsContent>
        <TabsContent value="credential" className="mt-0 outline-none">
          <MyCredentialTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}