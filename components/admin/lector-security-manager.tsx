"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getEstadoLectorQR, cambiarPasswordLectorQR, getEstadoLectorRemoto, controlLectorRemoto } from '@/lib/api';
import type { LectorStatus, User, LectorRemoteStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, ShieldAlert, ShieldCheck, KeyRound, RefreshCw, Eye, EyeOff, Sparkles, Power, PowerOff, Play, Pause, StopCircle, AlertTriangle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  newPassword: z.string().min(6, { message: "Mínimo 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "No coinciden.",
  path: ["confirmPassword"],
});

export function LectorSecurityManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<LectorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<LectorRemoteStatus | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const lectorStatus = await getEstadoLectorQR();
      setStatus(lectorStatus);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Fallo al cargar estado." });
    }
    setIsLoading(false);
  };
  
  const fetchRemoteStatus = async () => {
    setIsRemoteLoading(true);
    try {
        const status = await getEstadoLectorRemoto();
        setRemoteStatus(status);
    } catch (error) {
         console.error("Fallo al cargar estado remoto");
    }
    setIsRemoteLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    fetchRemoteStatus();
    const interval = setInterval(fetchRemoteStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const handleControlAction = async (action: string, payload?: any) => {
    if (!currentUser) {
       toast({ variant: "destructive", title: "Error", description: "Usuario no identificado." });
      return;
    }
    try {
        const result = await controlLectorRemoto(action, currentUser, payload);
        if (result.status === 'success') {
            toast({ title: "Éxito", description: result.message });
            fetchRemoteStatus();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    } catch (error: any) {
         toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('newPassword', password);
    form.setValue('confirmPassword', password);
    setShowPassword(true);
  };

  const handleChangePassword = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const result = await cambiarPasswordLectorQR(values.newPassword, currentUser);
      if (result.status === 'success') {
        toast({ title: "Éxito", description: "Contraseña actualizada." });
        form.reset();
        setShowPassword(false);
        fetchStatus();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6 mt-4 pb-10">
      {/* 1. ESTADO DE SEGURIDAD */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase">
            <Shield className="h-4 w-4 text-primary" /> Seguridad
          </CardTitle>
          <CardDescription className="text-[10px] font-bold italic">Estado del lector QR</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : status ? (
            <div className="space-y-2">
               {status.bloqueado && (
                <Alert variant="destructive" className="py-2 px-3">
                  <ShieldAlert className="h-3 w-3" />
                  <AlertTitle className="text-[10px] font-black uppercase">Bloqueado</AlertTitle>
                  <AlertDescription className="text-[9px] font-medium leading-tight">
                    Demasiados intentos fallidos. Cambia la contraseña para desbloquear.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado</span>
                    <Badge variant={status.bloqueado ? "destructive" : "default"} className="text-[9px] h-5 px-2 font-black uppercase">
                        {status.estado}
                    </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Fallos</span>
                    <span className="font-mono text-xs font-black">{status.intentosFallidos} / 3</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Operador</span>
                    <span className="text-[9px] font-black truncate max-w-[120px] uppercase text-primary">{status.cambiadoPor || 'SISTEMA'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
         <CardFooter className="p-4 pt-0">
            <Button onClick={fetchStatus} variant="outline" className="w-full h-8 text-[10px] font-black uppercase tracking-tighter">
              <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar Estado
            </Button>
          </CardFooter>
      </Card>
      
      {/* 2. CAMBIO DE CONTRASEÑA */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase">
            <KeyRound className="h-4 w-4 text-primary" /> Contraseña
          </CardTitle>
          <CardDescription className="text-[10px] font-bold italic">Acceso a modo escaneo</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleChangePassword)}>
                <CardContent className="p-4 pt-0 space-y-3">
                    <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                        <FormLabel className="text-[9px] font-black uppercase text-muted-foreground">Nueva Clave</FormLabel>
                        <div className="flex gap-1.5">
                            <FormControl>
                                <Input type={showPassword ? "text" : "password"} {...field} className="h-8 text-xs font-mono" />
                            </FormControl>
                            <Button type="button" variant="secondary" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                            </Button>
                        </div>
                        <FormMessage className="text-[8px]" />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                        <FormLabel className="text-[9px] font-black uppercase text-muted-foreground">Repetir Clave</FormLabel>
                        <FormControl>
                            <Input type={showPassword ? "text" : "password"} {...field} className="h-8 text-xs font-mono" />
                        </FormControl>
                        <FormMessage className="text-[8px]" />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={generateRandomPassword} className="h-8 text-[9px] font-black uppercase">
                        <Sparkles className="h-3 w-3 mr-1" /> Auto
                    </Button>
                    <Button type="submit" size="sm" className="flex-1 h-8 text-[9px] font-black uppercase" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                        {status?.bloqueado ? 'Desbloquear' : 'Guardar'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

      {/* 3. CONTROL REMOTO */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase">
            <Video className="h-4 w-4 text-primary" /> Control Cámaras
          </CardTitle>
          <CardDescription className="text-[10px] font-bold italic">Gestión de lectores activos</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
             {isRemoteLoading ? (
                    <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : remoteStatus ? (
                    <>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Switch
                                    checked={remoteStatus.activo}
                                    onCheckedChange={(checked) => handleControlAction('toggle_power', { activo: checked })}
                                />
                                <Label className="text-[10px] font-black uppercase">Sistema General</Label>
                             </div>
                             <Badge variant={remoteStatus.activo ? 'default' : 'destructive'} className="text-[8px] h-4 px-1.5 font-black uppercase">
                               {remoteStatus.activo ? 'ON' : 'OFF'}
                             </Badge>
                        </div>

                         <div className="grid grid-cols-2 gap-2">
                             <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase" onClick={() => handleControlAction('start')} disabled={!remoteStatus.activo || remoteStatus.estado === 'activo'}><Play className="h-3 w-3 mr-1"/> Iniciar</Button>
                             <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase" onClick={() => handleControlAction('pause')} disabled={!remoteStatus.activo || remoteStatus.estado !== 'activo'}><Pause className="h-3 w-3 mr-1"/> Pausar</Button>
                             <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase" onClick={() => handleControlAction('stop')} disabled={!remoteStatus.activo}><StopCircle className="h-3 w-3 mr-1"/> Parar</Button>
                             
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="h-8 text-[9px] font-black uppercase"><AlertTriangle className="h-3 w-3 mr-1"/> Pánico</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[90%] max-w-sm rounded-xl">
                                    <AlertDialogHeader>
                                    <AlertDialogTitle className="text-sm font-black uppercase">¿Cerrar todo?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs">
                                        Se detendrán inmediatamente todos los lectores QR de la escuela.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-2">
                                    <AlertDialogCancel className="mt-0 flex-1 h-9 text-xs font-bold">No</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleControlAction('emergency_stop')} className="flex-1 h-9 text-xs font-bold">Sí, Parar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                         </div>

                        <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Cámara por Defecto</Label>
                             <Select 
                                value={remoteStatus.cameraFacingMode}
                                onValueChange={(value) => handleControlAction('set_camera', { camera: value })}
                            >
                                <SelectTrigger className="h-8 text-xs font-bold uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="environment" className="text-xs font-bold uppercase">Trasera</SelectItem>
                                    <SelectItem value="user" className="text-xs font-bold uppercase">Frontal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                ) : null}
        </CardContent>
      </Card>
    </div>
  );
}