export type Role = "Director" | "Docente" | "Alumno" | "Tutor" | "Administrativo";

export const ROLES: Role[] = ["Alumno", "Tutor", "Docente", "Director", "Administrativo"];

export type NivelEscolar = "Secundaria" | "Preparatoria" | "Universidad";

export interface User {
  nombre: string;
  email: string;
  rol: Role;
  idEscuela: string;
  password?: string;
  hijos?: string[]; // For Tutors, an array of student emails
  curp?: string;
  grado?: string;
  grupo?: string;
  turno?: string;
  carrera?: string;
}

export interface GrupoEscolar {
  id: string;
  nivel: NivelEscolar;
  grado: string;
  letra: string;
  turno: "Matutino" | "Vespertino";
  aula: string;
  carrera?: string;
  idEscuela: string;
}

export interface CredentialData {
  user: User;
  qrData: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface AccessCode {
  id: string;
  codigo: string;
  fechaGeneracion: string;
  generado_por: string;
  lectorAsignado: string;
  usosMaximos: number;
  usosActuales: number;
  ultimoUso: string | null;
}

export interface DocenteGroup {
  grupo: string;
  materia: string;
}

export interface StudentAttendance {
  nombre: string;
  email: string;
  status: 'Presente' | 'Ausente' | 'Tarde';
  hora: string | null;
}

export interface LectorStatus {
  configurado: boolean;
  passwordActual?: string;
  ultimoCambio: string;
  cambiadoPor: string;
  estado: string;
  intentosFallidos: number;
  bloqueado: boolean;
  bloqueadoHasta: string | null;
  tiempoRestanteBloqueo: number;
}

export interface LectorRemoteStatus {
    activo: boolean;
    estado: 'activo' | 'inactivo' | 'pausado';
    ultimaConexion: string;
    escaneosHoy: 0;
    cameraFacingMode: 'environment' | 'user';
}

export interface LectorLockStatus {
    lectorId: string;
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: string;
}

export interface AttendanceRecord {
  email: string;
  movimiento: 'Entrada' | 'Salida';
  hora: string;
  fecha: string; // YYYY-MM-DD
}

export interface FullAttendanceRecord extends AttendanceRecord {
    nombre: string;
    rol: Role | 'Desconocido';
}

export interface StudentGrade {
  curp: string;
  nombre_alumno: string;
  semestre: string | number;
  grupo: string;
  periodo_escolar: string;
  id_escuela: string;
  [key: string]: any;
}

export interface AcademicConfig {
  niveles: string[];
  grados: { [key: string]: string[] };
  carreras: string[];
}
