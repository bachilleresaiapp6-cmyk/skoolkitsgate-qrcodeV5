"use client";

import { StudentIdCard } from '@/components/dashboard/student/student-id-card';
import { StudentAttendance } from '@/components/dashboard/student/student-attendance';
import { StudentGrades } from '@/components/dashboard/student/student-grades';
import { User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface StudentViewProps {
    student: User;
    activity: any[];
    isActivityLoading: boolean;
}

export function StudentView({ student, activity, isActivityLoading }: StudentViewProps) {
    const stats = activity
    .filter(record => {
        if (!record.fecha) return false;
        const today = new Date().toISOString().split('T')[0];
        const recordDate = record.fecha.includes('T') ? record.fecha.split('T')[0] : record.fecha;
        return recordDate === today;
    })
    .reduce((acc, record) => {
        if((record.movimiento || '').toLowerCase() === 'entrada') acc.entradas++;
        if((record.movimiento || '').toLowerCase() === 'salida') acc.salidas++;
        return acc;
    }, { entradas: 0, salidas: 0 });

  return (
    <Tabs defaultValue="panel" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="panel">Panel del Alumno</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
        <TabsTrigger value="grades">Calificaciones</TabsTrigger>
      </TabsList>
      <TabsContent value="panel">
        <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-5">
            <div className="lg:col-span-1 xl:col-span-2 space-y-8">
              <StudentIdCard user={student} isTutorView={true} />
            </div>
            <div className="lg:col-span-2 xl:col-span-3 space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Entradas Hoy</CardTitle>
                      <div className="text-green-500"><ArrowRight/></div>
                      </CardHeader>
                      <CardContent>
                      <div className="text-2xl font-bold">{isActivityLoading ? '...' : stats.entradas}</div>
                      </CardContent>
                  </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Salidas Hoy</CardTitle>
                        <div className="text-red-500"><ArrowLeft/></div>
                      </CardHeader>
                      <CardContent>
                      <div className="text-2xl font-bold">{isActivityLoading ? '...' : stats.salidas}</div>
                      </CardContent>
                  </Card>
              </div>
               <Card>
                <CardHeader>
                  <CardTitle>Vista de Tutor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Estás viendo el panel del alumno <span className="font-bold">{student.nombre}</span>.</p>
                </CardContent>
              </Card>
            </div>
          </div>
      </TabsContent>
      <TabsContent value="activity">
        <StudentAttendance records={activity} isLoading={isActivityLoading} />
      </TabsContent>
      <TabsContent value="grades">
        <StudentGrades curp={student.curp} />
      </TabsContent>
    </Tabs>
  );
}
