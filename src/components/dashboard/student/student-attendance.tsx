"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type AttendanceRecord = {
  movimiento: string;
  hora: string;
  fecha: string;
};

interface StudentAttendanceProps {
  records: AttendanceRecord[];
  isLoading: boolean;
}

export function StudentAttendance({ records, isLoading }: StudentAttendanceProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
        
        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Historial de Actividad</CardTitle>
        <CardDescription>
          Registro de tus entradas y salidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="mb-2">Todavía no tienes registros de actividad.</p>
            <p className="text-sm">Escanea tu código QR en un lector para registrar tu primera entrada.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Movimiento</TableHead>
                  <TableHead className="text-right">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={`${record.fecha}-${record.hora}-${index}`}>
                    <TableCell className="font-mono">{formatDate(record.fecha)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className={
                          (record.movimiento || '').toLowerCase() === 'entrada'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }
                      >
                        {record.movimiento}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-right">{record.hora}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
