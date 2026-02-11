import { Logo } from '@/components/logo';

export function SplashScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 text-center animate-fade-in">
        <Logo />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Sistema de Control de Acceso Escolar con Tecnología QR
          </h2>
          <p className="text-sm text-muted-foreground">
            CONCEPTOS AI MX
            <br />
            Panuco Ver. 2026
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-5 w-5 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Cargando...</span>
        </div>
      </div>
    </div>
  );
}
