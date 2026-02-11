"use client";

import { useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/lib/types';
import { getLinkedStudents, getStudentDetails, getStudentActivity } from '@/lib/api';
import { Loader2, School } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StudentSelector } from '@/components/dashboard/tutor/student-selector';
import { StudentView } from '@/components/dashboard/tutor/student-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Student = User;

export default function TutorDashboardPage() {
  const router = useRouter();
  const [tutor, setTutor] = useState<User | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentActivity, setStudentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol?.toLowerCase() !== 'tutor') {
        router.replace(`/dashboard/${parsedUser.rol?.toLowerCase() || 'auth'}`);
      } else {
        setTutor(parsedUser);
      }
    } else {
      router.replace('/auth');
    }
  }, [router]);

  const fetchLinkedStudents = useCallback(async () => {
    if (!tutor) return;
    setIsLoading(true);
    const res = await getLinkedStudents(tutor.email);
    if (res.status === 'success' && res.data?.hijos) {
      const studentEmails = res.data.hijos;
      
      const studentDetailsPromises = studentEmails.map(email => 
        getStudentDetails(email).then(result => 
          result.status === 'success' ? result.data?.alumno : null
        )
      );
      
      const students = (await Promise.all(studentDetailsPromises)).filter(Boolean) as Student[];
        
      setLinkedStudents(students);
      if (students.length > 0) {
        setSelectedStudent(students[0]);
      } else {
        setSelectedStudent(null);
        setStudentActivity([]);
      }
    }
    setIsLoading(false);
  }, [tutor]);

  useEffect(() => {
    if (tutor) {
      fetchLinkedStudents();
    }
  }, [tutor, fetchLinkedStudents]);

  const fetchStudentActivity = useCallback(async () => {
    if (!selectedStudent) return;
    setIsActivityLoading(true);
    const res = await getStudentActivity(selectedStudent.email);
    if(res.status === 'success' && res.data) {
      setStudentActivity(res.data.registros);
    }
    setIsActivityLoading(false);
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentActivity();
    }
  }, [selectedStudent, fetchStudentActivity]);

  if (!tutor) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            { tutor.idEscuela && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                        <CardTitle className="text-xs font-medium px-2">Mi Código de Escuela</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <div className="text-lg font-bold font-mono">{tutor.idEscuela}</div>
                    </CardContent>
                </Card>
            )}
            <div className="sm:ml-auto">
                 <StudentSelector 
                    students={linkedStudents} 
                    selectedStudent={selectedStudent} 
                    onSelectStudent={setSelectedStudent} 
                    tutorEmail={tutor.email} 
                    onStudentLinked={fetchLinkedStudents}
                    isLoading={isLoading}
                />
            </div>
        </div>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando alumnos...</p>
            </div>
        ) : selectedStudent ? (
            <StudentView student={selectedStudent} activity={studentActivity} isActivityLoading={isActivityLoading} />
        ) : (
            <div className="text-center py-10 bg-card rounded-lg">
                <h2 className="text-2xl font-bold">No hay alumnos vinculados</h2>
                <p className="text-muted-foreground mt-2 mb-4">Haz clic en el botón "Vincular Alumno" para añadir a tu primer hijo y monitorear su actividad.</p>
                {/* The button to link is in the selector component */}
            </div>
        )}
    </div>
  )
}
