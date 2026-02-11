
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, ShieldAlert, School, Shield } from 'lucide-react';
import { getUsers, getFullAttendanceLog } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LectorSecurityManager } from '@/components/admin/lector-security-manager';
import { MyCredentialTab } from '@/components/admin/my-credential-tab';

export default function DirectorDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    attendanceToday: 0,
    systemAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async (schoolId?: string) => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const usersRes = await getUsers(schoolId);
      const attendanceRes = await getFullAttendanceLog(schoolId);
      
      const totalUsers = usersRes.data?.users.length || 0;
      const today = new Date().toISOString().split('T')[0];
      const attendanceToday = attendanceRes.data?.log.filter(record => record.fecha === today).length || 0;

      setStats({
        totalUsers,
        attendanceToday,
        systemAlerts: 0,
      });

    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userDataString = localStorage.getItem('qrGateUser');
    if (userDataString) {
        const user = JSON.parse(userDataString) as User;
        setCurrentUser(user);
        if (user.idEscuela) fetchStats(user.idEscuela);
    } else {
        setIsLoading(false);
    }
  }, [fetchStats]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="stats" className="w-full flex flex-col h-full overflow-hidden">
        <div className="bg-muted/30 border-b overflow-x-auto scrollbar-hide shrink-0 px-2 pt-2">
            <TabsList className="inline-flex w-auto min-w-full justify-start bg-transparent p-0 h-10 gap-1">
                <TabsTrigger value="stats" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6">Supervisión</TabsTrigger>
                <TabsTrigger value="security" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6">Seguridad</TabsTrigger>
                <TabsTrigger value="credential" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6">Mi QR</TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <TabsContent value="stats" className="mt-0 space-y-6 outline-none">
                <div className="grid gap-3 grid-cols-2">
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                            <CardTitle className="text-[9px] font-black uppercase text-muted-foreground">Usuarios</CardTitle>
                            <Users className="h-3 w-3 text-primary" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <div className="text-xl font-black">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                            <CardTitle className="text-[9px] font-black uppercase text-muted-foreground">Asistencia</CardTitle>
                            <Activity className="h-3 w-3 text-primary" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <div className="text-xl font-black">{stats.attendanceToday}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-primary/10 bg-primary/5 col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                            <CardTitle className="text-[9px] font-black uppercase text-primary">ID Institución</CardTitle>
                            <School className="h-3 w-3 text-primary" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            <div className="text-lg font-black font-mono">{currentUser?.idEscuela || 'N/A'}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase">Bienvenido, Director</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            Vista general de la institución. Las tareas operativas de registro y grupos han sido asignadas al personal administrativo.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 outline-none">
                <LectorSecurityManager />
            </TabsContent>

            <TabsContent value="credential" className="mt-0 outline-none">
                <MyCredentialTab />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
