"use client";

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from "react-qr-code";
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Printer, User as UserIcon, School, AtSign, Calendar, ShieldCheck, Camera } from 'lucide-react';
import {
  downloadCredentialAsPNG,
  downloadCredentialAsPDF,
  printCredential
} from '@/lib/qr-service';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { resizeImage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StudentIdCardProps {
  user: User;
  isTutorView?: boolean;
}

export function StudentIdCard({ user, isTutorView = false }: StudentIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userPlaceholder = PlaceHolderImages.find(img => img.id === 'user-placeholder');
  const { toast } = useToast();

  const [profileImage, setProfileImage] = useState(userPlaceholder?.imageUrl || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImage = localStorage.getItem(`profileImage_${user.email}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [user.email]);

  const emissionDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const qrValue = user.email;
  const safeFileName = user.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const handleImageClick = () => {
    if (isTutorView) return; 
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const resizedDataUrl = await resizeImage(file, 256, 256);
        setProfileImage(resizedDataUrl);
        localStorage.setItem(`profileImage_${user.email}`, resizedDataUrl);
        toast({
            title: "Foto actualizada",
            description: "Tu imagen se ha guardado localmente."
        });
      } catch (err) {
        console.error("Failed to resize and save image", err);
        toast({
            variant: "destructive",
            title: "Error al cargar imagen",
            description: "Intenta con otra imagen."
        });
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
        <div className="relative w-full max-w-[340px] aspect-[85.6/54] overflow-hidden rounded-2xl shadow-2xl border-2 border-primary/20 bg-card group">
            <div
                ref={cardRef}
                className="absolute inset-0 h-full w-full p-4 flex flex-row gap-3 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
            >
                <div className="absolute top-2 right-3 text-primary font-headline text-[14px] font-black opacity-80 uppercase tracking-tighter">LA DIURNA</div>

                {/* Left Side */}
                <div className="flex flex-col justify-between items-center w-[40%] space-y-2">
                    <div 
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-primary/50 overflow-hidden shadow-lg mt-1 ${!isTutorView ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                      onClick={handleImageClick}
                    >
                      <Image
                        src={profileImage}
                        alt="Perfil"
                        width={96}
                        height={96}
                        data-ai-hint={userPlaceholder?.imageHint}
                        className="object-cover w-full h-full"
                      />
                      {!isTutorView && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white h-6 w-6" />
                        </div>
                      )}
                       <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/png, image/jpeg"
                          disabled={isTutorView}
                      />
                    </div>
                    <div className="flex-grow flex items-center justify-center w-full mb-1">
                        <div className="bg-white p-1 rounded-lg border shadow-inner">
                            <QRCode value={qrValue} size={65} level="L" />
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-[60%] flex flex-col justify-center text-[9px] space-y-0.5 pt-4">
                  <p className="font-black text-[13px] text-primary truncate leading-tight uppercase">{user.nombre}</p>
                  <div className="flex items-center gap-1 text-muted-foreground font-bold">
                      <UserIcon className="w-2.5 h-2.5 text-accent" />
                      <span>{user.rol}</span>
                  </div>
                   {user.rol === 'Alumno' && (user.grado || user.grupo) && (
                     <div className="flex items-center gap-1 text-muted-foreground font-bold">
                        <span>{user.grado}° {user.grupo} ({user.turno})</span>
                     </div>
                   )}
                  <div className="flex items-center gap-1 text-muted-foreground truncate font-medium">
                      <AtSign className="w-2.5 h-2.5 text-accent" />
                      <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Calendar className="w-2.5 h-2.5 text-accent" />
                      <span>Emisión: {emissionDate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-black pt-1 uppercase tracking-tighter text-[10px]">
                      <ShieldCheck className="w-3 h-3"/>
                      <span>VÁLIDO</span>
                  </div>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2 w-full mt-6 px-1">
            <Button onClick={() => downloadCredentialAsPNG(cardRef.current, `credencial_${safeFileName}`)} className="flex-1 h-10 text-[10px] uppercase font-black tracking-widest shadow-lg">
                <Download className="mr-1 h-3 w-3" /> PNG
            </Button>
            <Button onClick={() => downloadCredentialAsPDF(cardRef.current, `credencial_${safeFileName}`)} variant="outline" className="flex-1 h-10 text-[10px] uppercase font-black tracking-widest">
                <Download className="mr-1 h-3 w-3" /> PDF
            </Button>
            <Button onClick={() => printCredential(cardRef.current)} variant="outline" className="flex-1 h-10 text-[10px] uppercase font-black tracking-widest">
                <Printer className="mr-1 h-3 w-3" /> Imprimir
            </Button>
        </div>
    </div>
  );
}