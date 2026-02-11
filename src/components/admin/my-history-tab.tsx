"use client";

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getStudentActivity } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { StudentAttendance } from '@/components/dashboard/student/student-attendance';

type AttendanceRecord = {
  movimiento: string;
  hora: string;
  fecha: string;
};

export function MyHistoryTab() {
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('qrGateUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      const fetchActivity = async () => {
        setIsLoading(true);
        const result = await getStudentActivity(user.email);
        if (result.status === 'success' && result.data) {
          setActivity(result.data.registros);
        }
        setIsLoading(false);
      };
      fetchActivity();
    } else if (user === null) {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading && !user) {
    return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="text-center py-10">
            <p>No se pudo cargar la información del usuario.</p>
        </div>
    );
  }

  return (
    <div className="mt-6">
        <StudentAttendance records={activity} isLoading={isLoading} />
    </div>
  );
}
