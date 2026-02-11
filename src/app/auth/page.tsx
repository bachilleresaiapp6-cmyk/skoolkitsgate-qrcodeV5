import { AuthTabs } from '@/components/auth/auth-tabs';
import { Logo } from '@/components/logo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ScanLine } from 'lucide-react';

export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-2xl shadow-primary/10">
          <AuthTabs />
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O accede como
            </span>
          </div>
        </div>

        <Button asChild variant="secondary" className="w-full">
            <Link href="/scanner">
                <ScanLine className="mr-2 h-4 w-4" />
                Operador de Lector QR
            </Link>
        </Button>
      </div>
    </main>
  );
}
