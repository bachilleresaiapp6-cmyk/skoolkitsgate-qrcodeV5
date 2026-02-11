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
import { Loader2, Clock } from "lucide-react";

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
    /**
     * Limpia la fecha para mostrar DD/MM/AAAA
     */
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const baseDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
        const parts = baseDate.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`;
        }
        return dateString;
    }

    /**
     * Limpia la hora de formatos ISO (ej: 1899-12-30T07:58:29.000Z)
     * Retorna HH:mm
     */
    const formatTime = (timeString: string) => {
        if (!timeString) return '--:--';
        let target = timeString;
        if (timeString.includes('T')) {
            target = timeString.split('T')[1];
        }
        const match = target.match(/(\d{2}:\d{2})/);
        return match ? match[1] : timeString;
    }

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-background">
      <CardHeader className="bg-muted/30 p-4 border-b">
        <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Historial de Actividad
        </CardTitle>
        <CardDescription className="text-[10px] font-bold italic">
          Registro cronológico de accesos
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
            <p className="text-[10px] font-black uppercase animate-pulse">Cargando bitácora...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-xs font-bold uppercase text-muted-foreground italic mb-2">Sin registros de actividad</p>
            <p className="text-[10px] font-medium text-muted-foreground/60 max-w-[200px] mx-auto text-center">
              Escanea tu código QR en un lector para registrar tu primera entrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[9px] font-black uppercase h-8 px-4">Fecha</TableHead>
                  <TableHead className="text-[9px] font-black uppercase h-8 px-4 text-center">Mov</TableHead>
                  <TableHead className="text-[9px] font-black uppercase h-8 text-right px-4">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={`${record.fecha}-${record.hora}-${index}`} className="hover:bg-muted/20 border-b last:border-0 h-12">
                    <TableCell className="px-4">
                        <span className="font-bold text-[10px] text-muted-foreground uppercase">{formatDate(record.fecha)}</span>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <Badge
                        variant="outline"
                        className={
                          (record.movimiento || '').toLowerCase() === 'entrada'
                            ? 'border-green-500 text-green-700 bg-green-50 text-[8px] h-4 font-black uppercase px-1.5'
                            : 'border-orange-500 text-orange-700 bg-orange-50 text-[8px] h-4 font-black uppercase px-1.5'
                        }
                      >
                        {(record.movimiento || '').substring(0, 3)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-4">
                        <span className="font-mono text-[12px] font-black text-primary">
                            {formatTime(record.hora)}
                        </span>
                    </TableCell>
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
