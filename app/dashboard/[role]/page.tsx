import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';

interface DashboardPageProps {
  params: {
    role: string;
  };
}

const roleNames: { [key: string]: string } = {
  director: 'Director',
  docente: 'Docente',
  alumno: 'Alumno',
  tutor: 'Tutor',
  administrativo: 'Administrativo',
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const role = params.role.toLowerCase();
  const roleName = roleNames[role];

  if (!roleName) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Registros</div>
            <p className="text-xs text-muted-foreground">hoy</p>
          </CardContent>
        </Card>
        {/* Add more cards specific to roles */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido, {roleName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Este es tu panel de control personalizado. Aquí encontrarás las herramientas y la información relevante para tu rol.</p>
        </CardContent>
      </Card>
    </div>
  );
}
