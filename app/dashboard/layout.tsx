"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, UserCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/logo';

const roleNames: { [key: string]: string } = {
  director: 'Director',
  docente: 'Docente',
  alumno: 'Alumno',
  tutor: 'Tutor',
  administrativo: 'Administrativo',
};

const getRoleFromPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'dashboard') {
        const roleKey = segments[1].toLowerCase();
        return roleNames[roleKey] || 'Usuario';
    }
    return 'Dashboard';
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  
  const roleName = getRoleFromPath(pathname);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('qrGateUser');
    router.replace('/auth');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[500px] mx-auto border-x border-primary/5 shadow-2xl">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/80 backdrop-blur-md px-4">
        <div className="flex-1 flex items-center gap-2">
            <Link href="/auth" className="scale-75 origin-left">
                <Logo />
            </Link>
            <div className="h-6 w-px bg-border mx-1" />
            <h1 className="text-sm font-black font-headline uppercase tracking-tighter">
                <span className="text-primary">{roleName}</span>
            </h1>
        </div>
        <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px] hidden xs:inline">{user?.nombre?.split(' ')[0]}</span>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Cerrar Sesión">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/5">
        {children}
      </main>
    </div>
  );
}
