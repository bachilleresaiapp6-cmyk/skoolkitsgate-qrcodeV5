
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { read, utils } from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Upload, Loader2, Search, Table as TableIcon, CheckCircle2 } from 'lucide-react';
import { getGrades, uploadGrades, updateGrade, getUsers } from '@/lib/api';
import type { StudentGrade, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GradesManagerProps {
  idEscuela?: string;
}

const SUBJECTS = [
  { id: 'energia_procesos', label: 'Energía y Proc.', color: 'bg-blue-500' },
  { id: 'conciencia_historica_ii', label: 'Conciencia Hist.', color: 'bg-green-500' },
  { id: 'sociologia_i', label: 'Sociología I', color: 'bg-purple-500' },
  { id: 'historia_arte_i', label: 'Hist. Arte I', color: 'bg-orange-500' },
  { id: 'temas_filosofia_i', label: 'Filosofía I', color: 'bg-pink-500' },
  { id: 'derecho_i', label: 'Derecho I', color: 'bg-yellow-500' },
  { id: 'sistemas_informacion', label: 'Sistemas Inf.', color: 'bg-cyan-500' },
  { id: 'programacion', label: 'Programación', color: 'bg-indigo-500' },
  { id: 'curriculum_ampliado', label: 'Curr. Ampliado', color: 'bg-red-500' },
  { id: 'conducta', label: 'Conducta', color: 'bg-emerald-500' }
];

const CONDUCTA_OPTIONS = [
  { value: 'EXCELENTE', label: 'EXCELENTE' },
  { value: 'BUENA', label: 'BUENA' },
  { value: 'ACEPTABLE', label: 'ACEPTABLE' },
  { value: 'MALA', label: 'MALA' },
];

const PARCIALES = [
  { id: 'p1', label: 'P1' },
  { id: 'p2', label: 'P2' },
  { id: 'p3', label: 'P3' }
];

export function GradesManager({ idEscuela }: GradesManagerProps) {
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [gradesData, setGradesData] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcial, setSelectedParcial] = useState('p1');
  const [updatingCells, setUpdatingCells] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!idEscuela) return;
    setIsLoading(true);
    try {
      const [usersRes, gradesRes] = await Promise.all([
          getUsers(idEscuela),
          getGrades(idEscuela)
      ]);

      if (usersRes.status === 'success' && usersRes.data?.users) {
          const studentUsers = usersRes.data.users.filter(u => u.rol === 'Alumno' && u.curp);
          setAllStudents(studentUsers);
      }

      if (gradesRes.status === 'success' && gradesRes.data?.grades) {
        setGradesData(gradesRes.data.grades);
      } else {
        setGradesData([]);
      }
    } catch (error) {
      console.error("Error fetching grades data", error);
    } finally {
      setIsLoading(false);
    }
  }, [idEscuela]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mergedData = useMemo(() => {
    if (!allStudents.length) return [];
    const gradesMap = new Map(gradesData.map(g => [String(g.curp).toUpperCase().trim(), g]));
    
    return allStudents.map(student => {
        const sCurp = String(student.curp || "").toUpperCase().trim();
        const existingGrade = gradesMap.get(sCurp);
        
        if (existingGrade) {
            return { ...student, ...existingGrade, nombre_alumno: student.nombre };
        }
        
        const baseRow: any = {
            curp: student.curp || '',
            nombre_alumno: student.nombre,
            semestre: student.grado || '',
            grupo: student.grupo || '',
            periodo_escolar: '2024-2025',
            id_escuela: idEscuela || ''
        };
        
        SUBJECTS.forEach(sub => {
            ['p1', 'p2', 'p3'].forEach(p => {
                baseRow[`${sub.id}_${p}`] = '';
            });
        });
        
        return baseRow;
    });
  }, [allStudents, gradesData, idEscuela]);

  const handleGradeChange = async (curp: string, studentName: string, subjectKey: string, value: string) => {
    const cellKey = `${curp}:${subjectKey}`;
    setUpdatingCells(prev => ({ ...prev, [cellKey]: true }));
    
    try {
      if (!idEscuela) throw new Error("ID de escuela no disponible");
      const res = await updateGrade(idEscuela, curp, studentName, subjectKey, value);
      
      if (res.status === 'success') {
          // ACTUALIZACIÓN LOCAL INMEDIATA DEL ESTADO (FORZADA)
          setGradesData(prev => {
              const normalizedCurp = curp.toUpperCase().trim();
              const existingIndex = prev.findIndex(g => String(g.curp).toUpperCase().trim() === normalizedCurp);
              
              if (existingIndex !== -1) {
                  const updatedGrades = [...prev];
                  updatedGrades[existingIndex] = { ...updatedGrades[existingIndex], [subjectKey]: value };
                  return updatedGrades;
              } else {
                  return [...prev, { curp: normalizedCurp, [subjectKey]: value } as StudentGrade];
              }
          });
          toast({ title: 'Guardado', description: `${studentName}: ${value}` });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setUpdatingCells(prev => ({ ...prev, [cellKey]: false }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !idEscuela) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(worksheet) as any[];

        if (json.length === 0) throw new Error("El archivo está vacío.");

        await uploadGrades(idEscuela, json);
        toast({ title: 'Éxito', description: `Importación completada.` });
        fetchData();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error de importación', description: error.message });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredGrades = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return mergedData.filter(record =>
      record.nombre_alumno.toLowerCase().includes(term) ||
      record.curp.toLowerCase().includes(term)
    );
  }, [mergedData, searchTerm]);

  return (
    <Card className="mt-4 border-none shadow-none md:border-2 md:shadow-xl overflow-hidden bg-transparent md:bg-background">
      <CardHeader className="p-4 md:p-6 bg-gradient-to-b from-primary/5 to-transparent border-b">
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-white rounded-lg shadow-md">
                    <TableIcon className="h-5 w-5"/>
                </div>
                <div>
                    <CardTitle className="font-headline text-xl">Evaluaciones</CardTitle>
                    <CardDescription className="text-xs">Ciclo 2024-2025</CardDescription>
                </div>
            </div>
            
            <div className="flex flex-col gap-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar alumno..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 h-10 text-sm"
                    />
                </div>
                <div className="flex gap-2 w-full">
                    <label htmlFor="file-upload" className={cn(buttonVariants({ variant: "outline", size: "sm" }), 'flex-1 cursor-pointer text-xs h-10 border-dashed')}>
                         {isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                         Importar
                    </label>
                    <input id="file-upload" ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" disabled={isUploading || isLoading} />
                </div>
            </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Periodo:</span>
            <Tabs value={selectedParcial} onValueChange={setSelectedParcial} className="flex-1 ml-4">
                <TabsList className="grid w-full grid-cols-3 h-9">
                    {PARCIALES.map(p => (
                        <TabsTrigger key={p.id} value={p.id} className="text-xs font-bold">
                            {p.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-background">
        {isLoading ? (
            <div className="flex flex-col justify-center items-center h-60 gap-4">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
                <p className="text-xs text-muted-foreground font-medium animate-pulse">Cargando...</p>
            </div>
        ) : (
            <div className="overflow-x-auto scrollbar-hide">
                <Table className="min-w-max">
                    <TableHeader className="bg-muted/50 border-b">
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background/95 backdrop-blur-sm z-30 font-bold text-[10px] border-r text-center h-12 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[140px]">
                                ALUMNO
                            </TableHead>
                            <TableHead className="text-center font-bold text-[10px] border-r bg-muted/20 w-12">G/G</TableHead>
                            {SUBJECTS.map(sub => (
                                <TableHead key={sub.id} className="p-0 border-r min-w-[80px]">
                                    <div className={cn("h-1 w-full", sub.color)}></div>
                                    <div className="flex flex-col items-center justify-center h-10 px-1">
                                        <span className="text-[9px] font-black uppercase text-muted-foreground leading-tight text-center">
                                            {sub.label}
                                        </span>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGrades.map((grade) => (
                            <TableRow key={grade.curp} className="hover:bg-primary/5 transition-colors group h-14">
                                <TableCell className="sticky left-0 bg-background/95 backdrop-blur-sm z-20 border-r group-hover:bg-primary/5 shadow-[2px_0_5px_rgba(0,0,0,0.05)] py-1">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-primary truncate w-[120px] uppercase">{grade.nombre_alumno}</span>
                                        <span className="text-[8px] text-muted-foreground font-mono">{grade.curp}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[10px] font-black text-center border-r bg-muted/5">{grade.semestre}°{grade.grupo}</TableCell>
                                {SUBJECTS.map(sub => {
                                    const key = `${sub.id}_${selectedParcial}`;
                                    const val = grade[key] || '';
                                    const isLow = parseFloat(val) < 6;
                                    const isHigh = parseFloat(val) >= 9;
                                    
                                    if (sub.id === 'conducta') {
                                        return (
                                            <TableCell key={key} className="p-1 border-r text-center transition-all min-w-[100px]">
                                                <Select 
                                                    value={val} 
                                                    onValueChange={(newVal) => handleGradeChange(grade.curp, grade.nombre_alumno, key, newVal)}
                                                    disabled={updatingCells[`${grade.curp}:${key}`]}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-8 text-[9px] font-black border uppercase",
                                                        updatingCells[`${grade.curp}:${key}`] && "opacity-30 animate-pulse"
                                                    )}>
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CONDUCTA_OPTIONS.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold">
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        );
                                    }

                                    return (
                                        <TableCell key={key} className="p-1 border-r text-center transition-all">
                                            <Input
                                                defaultValue={val}
                                                onBlur={(e) => {
                                                    if (e.target.value !== val) {
                                                        handleGradeChange(grade.curp, grade.nombre_alumno, key, e.target.value);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-10 text-center mx-auto h-8 text-[12px] p-0 font-black border",
                                                    isLow ? "text-destructive border-destructive/40 bg-destructive/5" : 
                                                    isHigh ? "text-green-600 border-green-500/40 bg-green-50/50" : 
                                                    "text-foreground border-muted focus:border-primary",
                                                    updatingCells[`${grade.curp}:${key}`] && "opacity-30 animate-pulse scale-90"
                                                )}
                                                disabled={updatingCells[`${grade.curp}:${key}`]}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
      </CardContent>
      <div className="bg-muted/30 p-3 border-t flex justify-center gap-4 text-[8px] font-bold text-muted-foreground uppercase tracking-widest overflow-hidden">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-destructive rounded-full"></div> Repro</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Excel</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full"></div> Proc</div>
      </div>
    </Card>
  );
}
