import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <Button asChild variant="ghost" size="sm" className="absolute top-4 left-4">
              <Link href="/auth">
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <CardTitle className="text-center pt-8">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-center">
              Sigue los pasos para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordResetForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
