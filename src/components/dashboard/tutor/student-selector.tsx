"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { linkStudent, searchStudents } from '@/lib/api';
import { UserPlus, Loader2, Search } from 'lucide-react';
import type { User } from '@/lib/types';

interface StudentSelectorProps {
  students: User[];
  selectedStudent: User | null;
  onSelectStudent: (student: User) => void;
  tutorEmail: string;
  onStudentLinked: () => void;
  isLoading: boolean;
}

export function StudentSelector({ 
  students, 
  selectedStudent, 
  onSelectStudent, 
  tutorEmail, 
  onStudentLinked, 
  isLoading 
}: StudentSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchStudents(searchQuery.trim());
      if (res.status === 'success' && res.data?.students) {
        setSearchResults(res.data.students);
        if (res.data.students.length === 0) {
          toast({ title: "Sin resultados", description: "No se encontró ningún alumno con ese nombre o email." });
        }
      } else {
        setSearchResults([]);
        toast({ title: "Error", description: res.message || "Error al buscar alumnos.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Error", description: "Ocurrió un error en la búsqueda.", variant: "destructive" });
    }
    setIsSearching(false);
  };

  const handleLink = async (studentEmail: string) => {
    if (!tutorEmail || !studentEmail) return;
    setIsLinking(true);
    try {
      const res = await linkStudent(tutorEmail, studentEmail);
      if (res.status === 'success') {
        toast({ title: "Éxito", description: res.message || "Alumno vinculado correctamente." });
        onStudentLinked();
        setIsModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        toast({ title: "Error", description: res.message || "No se pudo vincular al alumno.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error de red", description: "No se pudo conectar con el servidor.", variant: "destructive" });
    }
    setIsLinking(false);
  };
  
  return (
    <div className="flex items-center gap-2">
        {isLoading ? (
            <div className="h-10 w-[250px] bg-muted animate-pulse rounded-md"></div>
        ) : (
            <Select
                value={selectedStudent?.email || ''}
                onValueChange={(email) => {
                  const student = students.find(s => s.email === email);
                  if (student) onSelectStudent(student);
                }}
                disabled={students.length === 0}
            >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={students.length === 0 ? "Sin alumnos vinculados" : "Seleccionar Alumno"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {students.map(student => (
                            <SelectItem key={student.email} value={student.email}>
                              {student.nombre}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        )}
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <UserPlus className="mr-2 h-4 w-4" />
            Vincular Alumno
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Nuevo Alumno</DialogTitle>
            <DialogDescription>
              Busca al alumno por su nombre completo o correo electrónico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input 
              placeholder="Ej: Juan Perez o alumno@email.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(student => (
                <div key={student.email} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{student.nombre}</span>
                    <span className="text-xs text-muted-foreground">{student.email}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded w-fit mt-1">{student.idEscuela}</span>
                  </div>
                  <Button size="sm" onClick={() => handleLink(student.email)} disabled={isLinking}>
                    {isLinking ? <Loader2 className="animate-spin h-3 w-3" /> : 'Vincular'}
                  </Button>
                </div>
              ))
            ) : searchQuery && !isSearching && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay resultados para esta búsqueda.
                </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}