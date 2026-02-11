"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFullAttendanceLog } from '@/lib/api';
import type { FullAttendanceRecord, Role } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar as CalendarIcon, FilterX, UserCog } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from "date-fns";

export function AttendanceHistoryManager({ idEscuela }: { idEscuela?: string }) {
  const [log, setLog] = useState<FullAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<string>('todos');
  const [selectedMovement, setSelectedMovement] = useState<string>('todos');
  const { toast } = useToast();

  const fetchLog = useCallback(async () => {
    if (!idEscuela) {
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    const response = await getFullAttendanceLog(idEscuela);
    if (response.status === 'success' && response.data) {
      setLog(response.data.log);
    } else {
      toast({
        variant: "destructive",
        title: "Error de Sincronización",
        description: response.message,
      });
    }
    setIsLoading(false);
  }, [idEscuela, toast]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  /**
   * Formateador robusto para fecha y hora
   */
  const cleanFormat = (val: any, type: 'date' | 'time') => {
    if (!val) return '--:--';
    const s = String(val);
    
    if (type === 'date') {
        const baseDate = s.includes('T') ? s.split('T')[0] : s;
        const match = baseDate.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const [y, m, d] = match[1].split('-');
            return `${d}/${m}/${y}`;
        }
        return s;
    }
    
    if (type === 'time') {
        let target = s;
        if (s.includes('T')) {
            target = s.split('T')[1];
        }
        const match = target.match(/(\d{2}:\d{2})/);
        return match ? match[1] : s;
    }
    return s;
  };

  const filteredLog = useMemo(() => {
    return log.filter(record => {
      const matchesSearch = record.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            record.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const recordDate = record.fecha.includes('T') ? record.fecha.split('T')[0] : record.fecha;
      const matchesDate = !selectedDate || recordDate === format(selectedDate, 'yyyy-MM-dd');
      
      const matchesRole = selectedRole === 'todos' || record.rol.toLowerCase() === selectedRole.toLowerCase();
      const matchesMovement = selectedMovement === 'todos' || (record.movimiento || '').toLowerCase() === selectedMovement.toLowerCase();
      
      return matchesSearch && matchesDate && matchesRole && matchesMovement;
    });
  }, [log, searchTerm, selectedDate, selectedRole, selectedMovement]);
  
  const getMovimientoBadge = (movimiento: string) => {
    const isEntrada = (movimiento || '').toLowerCase() === 'entrada';
    return (
        <Badge variant="outline" className={isEntrada ? "border-green-500 text-green-700 bg-green-50 text-[8px] h-4 font-black uppercase" : "border-orange-500 text-orange-700 bg-orange-50 text-[8px] h-4 font-black uppercase"}>
            {isEntrada ? 'ENT' : 'SAL'}
        </Badge>
    );
  };

  const getRoleBadge = (rol: string) => {
      const r = (rol || '').toLowerCase();
      if (r === 'alumno') return <Badge className="bg-blue-500 text-[8px] h-4 px-1">ALU</Badge>;
      if (r === 'docente') return <Badge className="bg-purple-500 text-[8px] h-4 px-1">DOC</Badge>;
      if (r === 'director') return <Badge className="bg-red-600 text-[8px] h-4 px-1">DIR</Badge>;
      if (r === 'administrativo') return <Badge className="bg-gray-700 text-[8px] h-4 px-1">ADM</Badge>;
      return <Badge variant="outline" className="text-[8px] h-4 px-1">USR</Badge>;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedRole('todos');
    setSelectedMovement('todos');
  };

  const hasActiveFilters = searchTerm || selectedDate || selectedRole !== 'todos' || selectedMovement !== 'todos';

  return (
    <div className="space-y-4 mt-4 pb-10">
      <Card className="border-none shadow-sm bg-muted/20">
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" /> Auditoría Institucional
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    placeholder="Nombre o email..."
                    className="pl-8 h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-9 text-[10px] font-black uppercase">
                        <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos" className="text-xs font-bold uppercase">Todos los Roles</SelectItem>
                        {ROLES.map(role => (
                            <SelectItem key={role} value={role.toLowerCase()} className="text-xs font-bold uppercase">{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedMovement} onValueChange={setSelectedMovement}>
                    <SelectTrigger className="h-9 text-[10px] font-black uppercase">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos" className="text-xs font-bold uppercase">Todos Movs.</SelectItem>
                        <SelectItem value="entrada" className="text-xs font-bold uppercase">Solo Entradas</SelectItem>
                        <SelectItem value="salida" className="text-xs font-bold uppercase">Solo Salidas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 h-9 text-[10px] font-black uppercase justify-start">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                            {selectedDate ? format(selectedDate, "dd/MM/yy") : "Filtrar por Fecha"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                    <Button variant="destructive" size="icon" className="h-9 w-9 shrink-0 shadow-md" onClick={clearFilters}>
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="p-4 bg-muted/30">
          <CardTitle className="text-sm font-black uppercase">Registros de Actividad</CardTitle>
          <CardDescription className="text-[10px] font-bold italic">Bitácora en tiempo real</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-48 gap-3">
              <Loader2 className="animate-spin text-primary h-6 w-6" />
              <span className="text-[10px] font-black uppercase animate-pulse">Sincronizando...</span>
            </div>
          ) : filteredLog.length === 0 ? (
             <div className="text-center py-12 px-4">
                 <p className="text-[10px] font-bold uppercase text-muted-foreground italic">No se encontraron registros</p>
             </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="text-[9px] font-black uppercase h-8 px-3">Fecha/Hr</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-8 px-3">Usuario</TableHead>
                        <TableHead className="text-[9px] font-black uppercase h-8 px-3 text-right">Mov</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredLog.map((record, index) => (
                        <TableRow key={`${record.email}-${record.fecha}-${record.hora}-${index}`} className="hover:bg-muted/20 border-b last:border-0">
                          <TableCell className="px-3 py-3">
                              <div className="flex flex-col">
                                  <span className="font-mono text-[11px] font-black leading-none text-primary">{cleanFormat(record.hora, 'time')}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{cleanFormat(record.fecha, 'date')}</span>
                              </div>
                          </TableCell>
                          <TableCell className="px-3">
                              <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5">
                                      {getRoleBadge(record.rol)}
                                      <span className="font-black text-[10px] uppercase truncate max-w-[100px]">{record.nombre}</span>
                                  </div>
                                  <span className="text-[8px] font-mono text-muted-foreground truncate max-w-[120px]">{record.email}</span>
                              </div>
                          </TableCell>
                          <TableCell className="px-3 text-right">
                              {getMovimientoBadge(record.movimiento)}
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
