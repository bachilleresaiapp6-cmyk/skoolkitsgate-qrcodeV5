"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserQRCodeReader, NotFoundException, IScannerControls, MediaDeviceInfo } from '@zxing/library';
import { Settings, Zap, SwitchCamera, ShieldQuestion, LogOut, Loader2, Lock, ArrowLeft, Play, Pause, Video, VideoOff, RefreshCw, PowerOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { validarPasswordLectorQR, getLectorLockStates, lockLector, unlockLector, getEstadoLectorRemoto, processQrScan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LectorLockStatus, LectorRemoteStatus } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const LECTORES_CONFIG = {
  'CEL-001': { nombre: 'Lector Entrada Principal', ubicacion: 'Puerta Principal', color: '#4CAF50', tipo: 'general', description: 'Color: Verde • Ubicación: Puerta Principal' },
  'CEL-002': { nombre: 'Lector Salida Principal', ubicacion: 'Puerta Principal', color: '#f44336', tipo: 'general', description: 'Color: Rojo • Ubicación: Puerta Principal' },
  'CEL-003': { nombre: 'Lector Cancha Deportiva', ubicacion: 'Área Deportiva', color: '#FF9800', tipo: 'general', description: 'Color: Naranja • Ubicación: Cancha' },
  'CEL-004': { nombre: 'Lector Biblioteca', ubicacion: 'Edificio B', color: '#9C27B0', tipo: 'general', description: 'Color: Púrpura • Ubicación: Edificio B' },
  'CEL-005': { nombre: 'Lector Laboratorio', ubicacion: 'Edificio C', color: '#2196F3', tipo: 'general', description: 'Color: Azul • Ubicación: Edificio C' }
};

type LectorId = keyof typeof LECTORES_CONFIG;

type ScanResult = {
    type: 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
    movimiento?: 'Entrada' | 'Salida';
}

type Stage = 'AUTHENTICATING' | 'SELECTING' | 'SCANNING';

export function QrScanner() {
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const [stage, setStage] = useState<Stage>('AUTHENTICATING');
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [currentLectorId, setCurrentLectorId] = useState<LectorId | null>(null);
  const [selectedLectorInModal, setSelectedLectorInModal] = useState<LectorId | null>(null);
  const [lectorStatuses, setLectorStatuses] = useState<LectorLockStatus[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [remoteStatus, setRemoteStatus] = useState<LectorRemoteStatus | null>(null);

  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  
  const isPausedRef = useRef(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ESCUDO DE HIDRATACIÓN: No renderizar nada hasta que estemos en el cliente
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    let opId = localStorage.getItem('qrgate_operator_id');
    if (!opId) {
        opId = `operator_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('qrgate_operator_id', opId);
    }
    setOperatorId(opId);
  }, [hasMounted]);

  const handleUnlockLector = useCallback(async (lectorToUnlock: string | null) => {
    if (lectorToUnlock) {
        await unlockLector(lectorToUnlock);
        localStorage.removeItem('qrgate_lector_id');
    }
  }, []);
  
  useEffect(() => {
    if (!hasMounted) return;
    const handleBeforeUnload = () => {
      const lectorId = localStorage.getItem('qrgate_lector_id');
      if (lectorId) unlockLector(lectorId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    const lastAccess = localStorage.getItem('qrgate_lector_last_access');
    if (lastAccess) {
      const hoursDiff = (new Date().getTime() - new Date(lastAccess).getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 8) {
        const savedLectorId = localStorage.getItem('qrgate_lector_id') as LectorId;
        if (savedLectorId && LECTORES_CONFIG[savedLectorId]) {
            setCurrentLectorId(savedLectorId);
            setStage('SCANNING');
        } else {
            setStage('SELECTING');
        }
      }
    }
  }, [hasMounted]);
  
  const fetchLectorStatuses = useCallback(async () => {
    setIsLoadingStatuses(true);
    const result = await getLectorLockStates();
    if (result.status === 'success' && result.data?.statuses) {
        setLectorStatuses(result.data.statuses);
    }
    setIsLoadingStatuses(false);
  }, []);
  
  const fetchRemoteStatus = useCallback(async () => {
    try {
        const status = await getEstadoLectorRemoto();
        setRemoteStatus(status);
        if (stage === 'SCANNING' && (!status.activo || status.estado !== 'activo')) {
             if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
             }
        }
    } catch (e) {}
  }, [stage]);

  useEffect(() => {
    if (!hasMounted) return;
    if (stage === 'SELECTING') fetchLectorStatuses();
    if (stage === 'SCANNING') {
        fetchRemoteStatus();
        const intervalId = setInterval(fetchRemoteStatus, 5000);
        return () => clearInterval(intervalId);
    }
  }, [stage, fetchLectorStatuses, fetchRemoteStatus, hasMounted]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
        const result = await validarPasswordLectorQR(password);
        if (result.valido) {
            localStorage.setItem('qrgate_lector_last_access', new Date().toISOString());
            setStage('SELECTING');
        } else {
            setAuthError(result.mensaje || 'Contraseña incorrecta.');
        }
    } catch (error: any) {
        setAuthError('Error de conexión.');
    }
    setIsAuthLoading(false);
  };
  
  const confirmLector = async () => {
    if (!selectedLectorInModal) return;
    const lockResult = await lockLector(selectedLectorInModal, operatorId);
    if (lockResult.status === 'success') {
      localStorage.setItem('qrgate_lector_id', selectedLectorInModal);
      setCurrentLectorId(selectedLectorInModal);
      setStage('SCANNING');
    } else {
        toast({ variant: "destructive", title: 'Error', description: lockResult.message });
        fetchLectorStatuses();
    }
  };

  const processQR = useCallback(async (qrData: string) => {
    if (isPausedRef.current || !currentLectorId) return;
    isPausedRef.current = true;

    let email = qrData.trim();
    if (qrData.startsWith('{')) {
        try { email = JSON.parse(qrData).email; } catch (e) {}
    }

    try {
        if (!email || !email.includes('@')) throw new Error('QR no válido.');
        const res = await processQrScan(currentLectorId, email);
        if (res.status === 'success' && res.data) {
            setLastResult({
                type: 'success',
                title: `${res.data.movimiento.toUpperCase()} EXITOSA`,
                message: `${res.data.nombre} - ${res.data.hora}`,
                timestamp: new Date().toLocaleTimeString(),
                movimiento: res.data.movimiento as 'Entrada' | 'Salida',
            });
        } else { throw new Error(res.message); }
    } catch (error: any) {
        setLastResult({
            type: 'error',
            title: 'ACCESO DENEGADO',
            message: error.message || 'Error desconocido.',
            timestamp: new Date().toLocaleTimeString(),
        });
    }

    scanTimeoutRef.current = setTimeout(() => {
        setLastResult(null);
        isPausedRef.current = false;
    }, 3000);
  }, [currentLectorId]);

  const requestCameraPermission = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: remoteStatus?.cameraFacingMode || 'environment' } 
          });
          setHasCameraPermission(true);
          if (videoRef.current) videoRef.current.srcObject = stream;
          if (!codeReaderRef.current) codeReaderRef.current = new BrowserQRCodeReader();
          const cameras = await codeReaderRef.current.listVideoInputDevices();
          if (cameras.length > 0) {
              codeReaderRef.current.decodeFromVideoDevice(cameras[0].deviceId, videoRef.current, (result, error, controls) => {
                  if (!controlsRef.current) controlsRef.current = controls;
                  if (result) processQR(result.getText());
              });
          }
      } catch (error) {
          setHasCameraPermission(false);
      }
  };

  useEffect(() => {
    return () => {
        controlsRef.current?.stop();
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  if (!hasMounted) return null;

  if (stage === 'AUTHENTICATING') {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-900 p-4">
            <Card className="w-full max-w-sm border-gray-700 bg-gray-800/50 text-white">
                <CardHeader className="text-center">
                    <ShieldQuestion className="mx-auto h-16 w-16 text-primary" />
                    <CardTitle className="text-2xl font-headline">Lector QR</CardTitle>
                    <CardDescription className="text-muted-foreground">Ingresa la contraseña para acceder.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 bg-gray-900/80 text-center text-lg text-white border-gray-600" autoFocus />
                        {authError && <p className="text-sm text-destructive text-center">{authError}</p>}
                        <Button type="submit" className="w-full h-12" disabled={isAuthLoading}>
                            {isAuthLoading ? <Loader2 className="animate-spin"/> : "Acceder"}
                        </Button>
                        <Button asChild variant="ghost" className="w-full text-gray-400">
                           <Link href="/auth">Volver al inicio</Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
     );
  }

  if (stage === 'SELECTING') {
    return (
        <div className="flex flex-col h-screen w-screen bg-gray-900 text-white">
             <header className="flex items-center p-4 border-b border-gray-700">
                <Button onClick={() => router.push('/auth')} variant="ghost" size="icon"><ArrowLeft /></Button>
                <div className='flex-grow text-center'>
                    <CardTitle>Configuración</CardTitle>
                    <CardDescription>Selecciona un lector</CardDescription>
                </div>
                <div className="w-10"></div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingStatuses ? (
                      <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    Object.entries(LECTORES_CONFIG).map(([id, config]) => {
                        const status = lectorStatuses.find(s => s.lectorId === id);
                        const isLocked = status?.isLocked;
                        const isSelected = selectedLectorInModal === id;
                        return (
                            <div key={id} 
                                className={`p-4 border-2 rounded-lg transition-all flex items-center gap-4 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-primary/20 border-primary' : 'border-gray-600'}`}
                                onClick={() => !isLocked && setSelectedLectorInModal(id as LectorId)}>
                                <div className="text-3xl">📱</div>
                                <div className="flex-grow">
                                    <h3 className="font-bold">{config.nombre}</h3>
                                    <p className="text-sm text-muted-foreground">{config.ubicacion}</p>
                                </div>
                                <Badge variant={isLocked ? "destructive" : "default"}>{isLocked ? "En Uso" : "Libre"}</Badge>
                            </div>
                        )
                    })
                )}
            </main>
             <footer className="p-4 border-t border-gray-700 flex gap-2">
                <Button onClick={fetchLectorStatuses} variant="outline" size="icon"><RefreshCw /></Button>
                <Button onClick={confirmLector} disabled={!selectedLectorInModal} className="w-full h-12">Comenzar Escaneo</Button>
             </footer>
        </div>
    );
  }

  if (stage === 'SCANNING' && currentLectorId) {
    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900/80 border-b border-gray-700 z-10">
                <Button onClick={() => setStage('SELECTING')} variant="ghost" size="icon"><ArrowLeft /></Button>
                <div className="text-center">
                    <h1 className="font-bold">{LECTORES_CONFIG[currentLectorId]?.nombre}</h1>
                    <p className="text-xs text-muted-foreground">{LECTORES_CONFIG[currentLectorId]?.ubicacion}</p>
                </div>
                 <div className="w-10"></div>
            </header>

            <main className="flex-1 relative flex items-center justify-center">
                {hasCameraPermission === null && (
                    <div className="text-center p-6 space-y-4">
                        <Video className="mx-auto h-16 w-16 text-primary" />
                        <h2 className="text-xl font-bold">Activar Cámara</h2>
                        <Button onClick={requestCameraPermission}>Permitir Acceso</Button>
                    </div>
                )}

                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="m-4">
                        <VideoOff className="h-4 w-4" />
                        <AlertTitle>Cámara Denegada</AlertTitle>
                        <Button onClick={requestCameraPermission} variant="secondary" className="mt-4">Reintentar</Button>
                    </Alert>
                )}
                
                {hasCameraPermission && (
                    <>
                        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay playsInline muted />
                        {(!remoteStatus || !remoteStatus.activo || remoteStatus.estado !== 'activo') && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-20">
                                <PowerOff className="h-16 w-16 mb-4 text-destructive"/>
                                <h2 className="text-2xl font-bold uppercase">Lector Inactivo</h2>
                                <p className="text-muted-foreground">Sistema pausado por el Administrador.</p>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className={`w-11/12 sm:w-3/4 sm:max-w-md aspect-square rounded-2xl border-8 transition-all duration-300 ${
                                !lastResult ? 'border-gray-500/30' : 
                                lastResult.type === 'error' ? 'border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.9)]' : 
                                lastResult.movimiento === 'Entrada' ? 'border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.9)]' : 
                                'border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.9)]'
                            }`} style={{boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)'}}>
                            </div>
                        </div>
                    </>
                )}
            </main>
            
            <footer className="flex-shrink-0 p-6 bg-black/80 backdrop-blur-md z-10 min-h-[140px] flex flex-col justify-center">
                {lastResult ? (
                    <div className={`p-4 rounded-xl text-center space-y-1 animate-in fade-in zoom-in duration-300 border-2 ${
                         lastResult.type === 'error' ? 'bg-red-900/40 border-red-500' : 
                         lastResult.movimiento === 'Entrada' ? 'bg-green-900/40 border-green-500' : 
                         'bg-orange-900/40 border-orange-500'
                    }`}>
                        <h3 className="font-black text-2xl tracking-tight">{lastResult.title}</h3>
                        <p className="text-lg font-bold uppercase">{lastResult.message}</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="animate-pulse font-black tracking-widest text-lg uppercase text-primary">APUNTE EL CÓDIGO QR AL LECTOR</p>
                    </div>
                )}
            </footer>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}