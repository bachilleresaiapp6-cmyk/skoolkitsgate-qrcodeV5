"use client";

import { type RefObject, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import QRCode from "react-qr-code";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { CredentialData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, Printer, User as UserIcon, School, AtSign, Calendar, ShieldCheck, Camera } from 'lucide-react';
import {
  downloadCredentialAsPNG,
  downloadCredentialAsPDF,
  printCredential
} from '@/lib/qr-service';
import { resizeImage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CredentialCardProps {
  data: CredentialData;
  cardRef: RefObject<HTMLDivElement>;
}

export function CredentialCardActions({ cardRef, userName }: { cardRef: RefObject<HTMLDivElement>, userName: string }) {
  const safeFileName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button onClick={() => downloadCredentialAsPNG(cardRef.current, `credencial_${safeFileName}`)} className="w-full">
        <Download className="mr-2 h-4 w-4" /> Descargar PNG
      </Button>
      <Button onClick={() => downloadCredentialAsPDF(cardRef.current, `credencial_${safeFileName}`)} className="w-full">
        <Download className="mr-2 h-4 w-4" /> Descargar PDF
      </Button>
      <Button onClick={() => printCredential(cardRef.current)} className="w-full">
        <Printer className="mr-2 h-4 w-4" /> Imprimir
      </Button>
    </div>
  );
}

export function CredentialCard({ data, cardRef }: CredentialCardProps) {
  const userPlaceholder = PlaceHolderImages.find(img => img.id === 'user-placeholder');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [profileImage, setProfileImage] = useState(userPlaceholder?.imageUrl || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImage = localStorage.getItem(`profileImage_${data.user.email}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [data.user.email]);

  const emissionDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const resizedDataUrl = await resizeImage(file, 256, 256);
        setProfileImage(resizedDataUrl);
        localStorage.setItem(`profileImage_${data.user.email}`, resizedDataUrl);
        toast({
            title: "Imagen subida",
            description: "Tu foto se ha guardado correctamente."
        });
      } catch (err) {
        console.error("Failed to resize image", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo procesar la imagen."
        });
      }
    }
  };

  const qrValue = data.user.email;

  return (
    <div
      ref={cardRef}
      className="bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20"
      style={{ width: '339px', height: '213px', transformOrigin: 'top left' }}
    >
      <div className="h-full w-full p-4 flex flex-row gap-3 relative bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <div className="absolute top-2 right-2 text-primary font-headline text-lg font-bold">Esc. Prep. LA DIURNA</div>

        {/* Left Side */}
        <div className="flex flex-col justify-between items-center w-2/5 space-y-2">
          <div 
            className="relative group w-24 h-24 rounded-full border-4 border-primary/50 overflow-hidden shadow-lg mt-2 cursor-pointer"
            onClick={handleImageClick}
          >
            <Image
              src={profileImage}
              alt="Foto de perfil"
              width={96}
              height={96}
              data-ai-hint={userPlaceholder?.imageHint}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white h-8 w-8" />
            </div>
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
            />
          </div>
          <div className="flex-grow flex items-center justify-center w-full">
             <div className="bg-white p-1.5 rounded-lg border shadow-inner">
                <QRCode value={qrValue} size={80} level="L" />
             </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-3/5 flex flex-col justify-center text-xs space-y-1">
          <p className="font-bold text-base text-primary truncate font-headline uppercase">{data.user.nombre}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserIcon className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">{data.user.rol}</span>
          </div>
           {data.user.rol === 'Alumno' && (data.user.grado || data.user.grupo) && (
             <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-semibold">{data.user.grado}° {data.user.grupo} ({data.user.turno})</span>
             </div>
           )}
           {data.user.idEscuela && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <School className="w-3.5 h-3.5 text-accent" />
              <span className="font-semibold">{data.user.idEscuela}</span>
            </div>
           )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AtSign className="w-3.5 h-3.5 text-accent" />
            <span className="truncate">{data.user.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Emisión: {emissionDate}</span>
          </div>
           <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
             <ShieldCheck className="w-3.5 h-3.5 text-green-600"/>
             <span className="font-semibold text-green-600">Válido</span>
           </div>
        </div>
      </div>
    </div>
  );
}
