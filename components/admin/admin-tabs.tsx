"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManager } from "@/components/admin/user-manager";
import { LectorSecurityManager } from "./lector-security-manager";
import { MyCredentialTab } from "./my-credential-tab";
import { AttendanceHistoryManager } from "./attendance-history-manager";
import { GradesManager } from "./grades-manager";
import { GroupManager } from "./group-manager";

interface AdminTabsProps {
  onUsersChanged: () => void;
  idEscuela?: string;
}

export function AdminTabs({ onUsersChanged, idEscuela }: AdminTabsProps) {
  return (
    <Tabs defaultValue="users" className="w-full flex flex-col h-full">
      <div className="bg-muted/30 border-b overflow-x-auto scrollbar-hide shrink-0 px-2 pt-2">
        <TabsList className="inline-flex w-auto min-w-full justify-start bg-transparent p-0 h-10 gap-1">
          <TabsTrigger value="users" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Usuarios</TabsTrigger>
          <TabsTrigger value="groups" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Grupos</TabsTrigger>
          <TabsTrigger value="grades" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Calificaciones</TabsTrigger>
          <TabsTrigger value="security" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Seguridad</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Historial</TabsTrigger>
          <TabsTrigger value="credential" className="text-[10px] font-black uppercase tracking-tighter rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4">Mi QR</TabsTrigger>
        </TabsList>
      </div>
      
      <div className="flex-1 overflow-y-auto px-1 scrollbar-hide">
        <TabsContent value="users" className="outline-none">
          <UserManager onUsersChanged={onUsersChanged} idEscuela={idEscuela} />
        </TabsContent>
        <TabsContent value="groups" className="outline-none">
          <GroupManager idEscuela={idEscuela} />
        </TabsContent>
        <TabsContent value="grades" className="outline-none">
          <GradesManager idEscuela={idEscuela} />
        </TabsContent>
        <TabsContent value="security" className="outline-none">
          <LectorSecurityManager />
        </TabsContent>
        <TabsContent value="history" className="outline-none">
          <AttendanceHistoryManager idEscuela={idEscuela} />
        </TabsContent>
        <TabsContent value="credential" className="outline-none">
          <MyCredentialTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
