"use client";

import { useEffect, useState } from 'react';
import { getStudentGrades } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, GraduationCap, Award, BookOpen, FileText } from 'lucide-react';
import type { StudentGrade } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface StudentGradesProps {
  curp?: string;
}

const SUBJECTS = [
  { id: 'energia_procesos', label: 'Energía y Procesos' },
  { id: 'conciencia_historica_ii', label: 'Conciencia Histórica' },
  { id: 'sociologia_i', label: 'Sociología I' },
  { id: 'historia_arte_i', label: 'Historia del Arte' },
  { id: 'temas_filosofia_i', label: 'Temas de Filosofía' },
  { id: 'derecho_i', label: 'Derecho I' },
  { id: 'sistemas_informacion', label: 'Sistemas de Info.' },
  { id: 'programacion', label: 'Programación' },
  { id: 'curriculum_ampliado', label: 'Currículum Amp.' },
  { id: 'conducta', label: 'Conducta' }
];

export function StudentGrades({ curp }: StudentGradesProps) {
  const [grades, setGrades] = useState<Partial<StudentGrade> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!curp) {
      setError("No se encontró CURP.");
      setIsLoading(false);
      return;
    }

    const fetchGrades = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getStudentGrades(curp);
        if (result.status === 'success' && result.data?.grades) {
          setGrades(result.data.grades);
        } else {
          setError("Sin evaluaciones.");
        }
      } catch (err) {
        setError("Error de conexión.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [curp]);

  const getGradeColor = (grade: any) => {
    const num = parseFloat(grade);
    if (isNaN(num)) return "text-muted-foreground";
    if (num >= 9) return "text-green-600 font-black";
    if (num < 6) return "text-destructive font-black";
    return "text-foreground font-bold";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen Móvil */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-primary/5 border-none p-3 flex flex-col items-center justify-center text-center">
            <GraduationCap className="text-primary h-4 w-4 mb-1"/>
            <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">Grado</p>
            <p className="text-sm font-black">{grades?.semestre || '—'}</p>
        </Card>
        <Card className="bg-accent/5 border-none p-3 flex flex-col items-center justify-center text-center">
            <BookOpen className="text-accent h-4 w-4 mb-1"/>
            <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">Grupo</p>
            <p className="text-sm font-black">{grades?.grupo || '—'}</p>
        </Card>
        <Card className="bg-green-500/5 border-none p-3 flex flex-col items-center justify-center text-center">
            <Award className="text-green-600 h-4 w-4 mb-1"/>
            <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">Ciclo</p>
            <p className="text-sm font-black">24-25</p>
        </Card>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden bg-background">
        <CardHeader className="bg-muted/30 p-4 border-b">
            <div className="flex items-center gap-2">
                <FileText className="text-primary h-4 w-4" />
                <CardTitle className="text-sm font-black uppercase tracking-tighter">Boleta de Calificaciones</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="text-center p-8">
              <p className="text-xs text-muted-foreground italic">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
                <Table>
                <TableHeader className="bg-muted/10">
                    <TableRow>
                    <TableHead className="px-4 font-black text-[9px] uppercase w-[120px]">Asignatura</TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase px-1">P1</TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase px-1">P2</TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase px-1">P3</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {SUBJECTS.map((sub) => (
                    <TableRow key={sub.id} className="h-10 hover:bg-muted/5">
                        <TableCell className="px-4 font-bold text-[10px] truncate max-w-[120px] uppercase leading-none">{sub.label}</TableCell>
                        <TableCell className={`text-center font-mono text-[13px] px-1 ${getGradeColor(grades?.[`${sub.id}_p1`])}`}>
                        {grades?.[`${sub.id}_p1`] || '—'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-[13px] px-1 ${getGradeColor(grades?.[`${sub.id}_p2`])}`}>
                        {grades?.[`${sub.id}_p2`] || '—'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-[13px] px-1 ${getGradeColor(grades?.[`${sub.id}_p3`])}`}>
                        {grades?.[`${sub.id}_p3`] || '—'}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center pb-4">
        <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">ID CURP: {curp}</span>
      </div>
    </div>
  );
}
