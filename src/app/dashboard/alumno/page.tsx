"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { StudentIdCard } from '@/components/dashboard/student/student-id-card';
import { StudentAttendance } from '@/components/dashboard/student/student-attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentActivity } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentGrades } from '@/components/dashboard/student/student-grades';

type AttendanceRecord = {
  movimiento: string;
  hora: string;
  fecha: string;
};

export default function AlumnoDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('qrGateUser') : null;
    if (userData) {
      const parsedUser = JSON.parse(userData) as User;
      if (parsedUser.rol?.toLowerCase() !== 'alumno') {
          router.replace(`/dashboard/${parsedUser.rol?.toLowerCase() || 'auth'}`);
      } else {
        setUser(parsedUser);
      }
    } else {
      router.replace('/auth');
    }
  }, [router]);

  useEffect(() => {
    if (user?.email) {
      const fetchActivity = async () => {
        setLoading(true);
        const result = await getStudentActivity(user.email);
        if (result.status === 'success' && result.data) {
          setActivity(result.data.registros);
        }
        setLoading(false);
      };
      fetchActivity();
    }
  }, [user]);
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const stats = activity
    .filter(record => {
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
    <div className="w-full max-w-md mx-auto h-full overflow-hidden flex flex-col">
        <Tabs defaultValue="panel" className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1">
                <TabsTrigger value="panel" className="text-xs font-bold uppercase">Inicio</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs font-bold uppercase">Bitácora</TabsTrigger>
                <TabsTrigger value="grades" className="text-xs font-bold uppercase">Boleta</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
              <TabsContent value="panel" className="mt-0 space-y-6 outline-none">
                <StudentIdCard user={user} />
                
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-500/10 border-green-500/20 shadow-none">
                        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Entradas</CardTitle>
                            <ArrowRight className="h-3 w-3 text-green-600"/>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-2xl font-black text-green-700">{stats.entradas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-500/10 border-orange-500/20 shadow-none">
                        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">Salidas</CardTitle>
                            <ArrowLeft className="h-3 w-3 text-orange-600"/>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-2xl font-black text-orange-700">{stats.salidas}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-primary/10 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-center text-muted-foreground leading-relaxed">
                            Bienvenido, <span className="text-primary font-black">{user.nombre}</span>.
                            <br/>
                            Usa tu QR para registrar asistencia.
                        </p>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-0 outline-none">
                <StudentAttendance records={activity} isLoading={loading} />
              </TabsContent>

              <TabsContent value="grades" className="mt-0 outline-none">
                <StudentGrades curp={user.curp} />
              </TabsContent>
          </div>
        </Tabs>
    </div>
  );
}
