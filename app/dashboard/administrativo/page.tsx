"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, UserPlus, School, Loader2, Users, LayoutGrid, ClipboardList, Contact, BadgeCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyCredentialTab } from "@/components/admin/my-credential-tab";
import { UserManager } from "@/components/admin/user-manager";
import { GroupManager } from "@/components/admin/group-manager";
import { GradesManager } from "@/components/admin/grades-manager";
import { AttendanceHistoryManager } from "@/components/admin/attendance-history-manager";
import { User } from '@/lib/types';

export default function AdministrativoDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
        setCurrentUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  return (
    <Tabs defaultValue="panel" className="w-full flex flex-col h-full overflow-hidden">
        <div className="bg-muted/30 border-b overflow-x-auto scrollbar-hide shrink-0 px-2 pt-2">
            <TabsList className="inline-flex w-auto min-w-full justify-start bg-transparent p-0 h-10 gap-1 pb-2">
                <TabsTrigger value="panel" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0">Panel</TabsTrigger>
                <TabsTrigger value="users" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0">Usuarios</TabsTrigger>
                <TabsTrigger value="groups" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0">Grupos</TabsTrigger>
                <TabsTrigger value="grades" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0">Evaluaciones</TabsTrigger>
                <TabsTrigger value="history" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0">Auditoría</TabsTrigger>
                <TabsTrigger value="credential" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 shrink-0 text-primary">Mi Credencial</TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <TabsContent value="panel" className="mt-0 outline-none">
                <div className="space-y-6 pt-2">
                    <div className="grid gap-3 grid-cols-2">
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                                <CardTitle className="text-[9px] font-black uppercase text-muted-foreground">Matrículas</CardTitle>
                                <UserPlus className="h-3 w-3 text-primary" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="text-xl font-black">45</div>
                                <p className="text-[8px] font-bold text-muted-foreground">+5 hoy</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                                <CardTitle className="text-[9px] font-black uppercase text-muted-foreground">Pendientes</CardTitle>
                                <FileText className="h-3 w-3 text-primary" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="text-xl font-black">12</div>
                                <p className="text-[8px] font-bold text-muted-foreground">Trámites</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-primary/10 bg-primary/5 col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                                <CardTitle className="text-[9px] font-black uppercase text-primary">ID Institución</CardTitle>
                                <School className="h-3 w-3 text-primary" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <div className="text-lg font-black font-mono">{currentUser?.idEscuela || 'N/A'}</div> }
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase">Gestión Operativa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                Bienvenido al centro de control administrativo. Toca tu foto en la pestaña <span className="text-primary font-black">"Mi Credencial"</span> para subir tu foto y personalizar tu ID institucional. Toda la gestión académica está centralizada aquí.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0 outline-none">
                <UserManager onUsersChanged={() => {}} idEscuela={currentUser?.idEscuela} />
            </TabsContent>

            <TabsContent value="groups" className="mt-0 outline-none">
                <GroupManager idEscuela={currentUser?.idEscuela} />
            </TabsContent>

            <TabsContent value="grades" className="mt-0 outline-none">
                <GradesManager idEscuela={currentUser?.idEscuela} />
            </TabsContent>

            <TabsContent value="history" className="mt-0 outline-none">
                <AttendanceHistoryManager idEscuela={currentUser?.idEscuela} />
            </TabsContent>

            <TabsContent value="credential" className="mt-0 outline-none">
                <MyCredentialTab />
            </TabsContent>
        </div>
    </Tabs>
  );
}