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
  administrador: 'Administrador',
};

const getRoleFromPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'dashboard') {
        const roleKey = segments[1].toLowerCase();
        return roleNames[roleKey] || 'Usuario';
    }
    return 'Dashboard';
}


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  
  const roleName = getRoleFromPath(pathname);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Allow access for server-rendered dashboards like admin/director
      // The individual pages should handle their own auth checks
      console.log("No user data in local storage, might be a server-rendered page.");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('qrGateUser');
    router.replace('/auth');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-4">
            <Link href="/auth">
                <Logo />
            </Link>
        </div>
        <div className="flex-1">
             <h1 className="text-xl font-semibold font-headline">
                Dashboard <span className="text-primary">{roleName}</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm font-medium text-right">{user?.nombre}</span>
            <Button onClick={handleLogout} variant="ghost" size="icon" aria-label="Cerrar Sesión">
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
