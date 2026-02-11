import type { ApiResponse, User, DocenteGroup, StudentAttendance, LectorStatus, LectorRemoteStatus, LectorLockStatus, FullAttendanceRecord, StudentGrade, AcademicConfig, GrupoEscolar } from './types';

async function callApi<T>(
    action: string, 
    params: Record<string, any> = {}
): Promise<ApiResponse<T>> {
  
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          status: 'error', 
          message: errorData.message || `Error en la conexión: ${response.status}` 
        };
    }

    const result = await response.json();
    return result as ApiResponse<T>;

  } catch (error: any) {
    console.error(`API Proxy Error (${action}):`, error);
    return { 
        status: 'error', 
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.' 
    };
  }
}

export async function loginUser(data: any): Promise<ApiResponse<{ user: User, dashboardUrl: string }>> {
  const response = await callApi<{ user: User }>('login', data);
  if (response.status === 'success' && response.data) {
    const user = response.data.user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qrGateUser', JSON.stringify(user));
    }
    
    const dashboardPath = (user.rol || 'auth').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const finalPath = dashboardPath === 'administrador' ? 'director' : dashboardPath;

    return {
      status: 'success',
      message: 'Inicio de sesión exitoso.',
      data: {
        user: user,
        dashboardUrl: `/dashboard/${finalPath}`,
      },
    };
  }
  return response as ApiResponse<any>;
}

export async function registerUser(data: any): Promise<ApiResponse<{ user: User, qrData: string }>> {
  return callApi('register', data);
}

export async function getUsers(idEscuela?: string): Promise<ApiResponse<{ users: User[] }>> {
  return callApi('get_all_users', { idEscuela });
}

export async function adminCreateUser(data: any): Promise<ApiResponse<{ user: User }>> {
  return callApi('register', data);
}

export async function adminUpdateUser(data: Partial<User>): Promise<ApiResponse<null>> {
  return callApi('update_user', data);
}

export async function adminDeleteUser(email: string): Promise<ApiResponse<null>> {
  return callApi('delete_user', { email });
}

export async function getEstadoLectorQR(): Promise<LectorStatus> {
    const res = await callApi<{status: LectorStatus}>('get_estado_lector_qr');
    if (res.status === 'success' && res.data) return res.data.status;
    return { configurado: false, estado: 'Error', bloqueado: true, intentosFallidos: 0, tiempoRestanteBloqueo: 0, ultimoCambio: '', cambiadoPor: '' };
}

export async function cambiarPasswordLectorQR(nuevaPassword: string, user: User): Promise<ApiResponse<null>> { 
    return callApi('cambiar_password_lector_qr', { nuevaPassword, user: JSON.stringify(user) });
}

export async function validarPasswordLectorQR(password: string): Promise<{ valido: boolean; bloqueado: boolean; mensaje?: string; intentosRestantes?: number }> {
    const res = await callApi<{valido: boolean; bloqueado: boolean; intentosRestantes?: number}>('validar_password_lector_qr', { password });
    return { valido: res.data?.valido || false, bloqueado: res.data?.bloqueado || false, mensaje: res.message, intentosRestantes: res.data?.intentosRestantes };
}

export async function getEstadoLectorRemoto(): Promise<LectorRemoteStatus> {
    const res = await callApi<LectorRemoteStatus>('get_estado_lector_remoto');
    if (res.status === 'success' && res.data) return res.data;
    return { activo: true, estado: 'activo', cameraFacingMode: 'environment', ultimaConexion: '', escaneosHoy: 0 };
}

export async function controlLectorRemoto(action: string, user: User, payload?: any): Promise<ApiResponse<null>> {
    return callApi('control_lector_remoto', { controlAction: action, user: JSON.stringify(user), payload: JSON.stringify(payload) });
}

export async function getLectorLockStates(): Promise<ApiResponse<{ statuses: LectorLockStatus[] }>> { 
    return callApi('get_lector_lock_states');
}

export async function lockLector(lectorId: string, operatorId: string): Promise<ApiResponse<null>> { 
    return callApi('lock_lector', { lectorId, operatorId });
}

export async function unlockLector(lectorId: string): Promise<ApiResponse<null>> { 
    return callApi('unlock_lector', { lectorId });
}

export async function processQrScan(lectorId: string, email: string): Promise<ApiResponse<{ movimiento: string, nombre: string, hora: string }>> {
    return callApi('process_scan', { lectorId, email });
}

export async function getStudentActivity(email: string): Promise<ApiResponse<{ registros: { tipo: string; hora: string; fecha: string; }[] }>> {
    return callApi('get_activity', { email });
}

export async function getFullAttendanceLog(idEscuela?: string): Promise<ApiResponse<{ log: FullAttendanceRecord[] }>> {
    return callApi('get_full_log', { idEscuela });
}

export async function searchStudents(query: string): Promise<ApiResponse<{ students: User[] }>> {
     return callApi('search_user', { search: query });
}

export async function linkStudent(tutorEmail: string, studentEmail: string): Promise<ApiResponse<null>> {
    return callApi('link_student', { tutor_email: tutorEmail, student_email: studentEmail });
}

export async function getLinkedStudents(tutorEmail: string): Promise<ApiResponse<{ hijos: string[] }>> {
    return callApi('get_linked_students', { tutor_email: tutorEmail });
}

export async function getStudentDetails(studentEmail: string): Promise<ApiResponse<{ alumno: User }>> {
     const response = await callApi<{ user: User }>('get_user', { email: studentEmail });
     if (response.status === 'success' && response.data) {
        return { status: 'success', message: 'OK', data: { alumno: response.data.user }};
     }
     return response as ApiResponse<any>;
}

export async function createGrupo(grupo: Partial<GrupoEscolar>): Promise<ApiResponse<null>> {
    return callApi('create_grupo', { grupoJson: JSON.stringify(grupo) });
}

export async function getGrupos(idEscuela: string): Promise<ApiResponse<{ grupos: GrupoEscolar[] }>> {
    return callApi('get_grupos', { idEscuela });
}

export async function deleteGrupo(id: string): Promise<ApiResponse<null>> {
    return callApi('delete_grupo', { id });
}

export async function getDocenteGrupos(email: string): Promise<ApiResponse<{ grupos: DocenteGroup[] }>> {
     return callApi('get_docente_grupos', { email });
}

export async function updateDocenteGrupos(email: string, grupos: DocenteGroup[]): Promise<ApiResponse<null>> {
    return callApi('update_docente_grupos', { email, grupos_materias_json: JSON.stringify(grupos) });
}

export async function getAlumnosDelGrupo(grupo: string, materia: string, idEscuela: string): Promise<ApiResponse<{ alumnos: StudentAttendance[] }>> {
    return callApi('get_alumnos_del_grupo', { grupo, materia, idEscuela });
}

export async function getGrades(idEscuela: string): Promise<ApiResponse<{ grades: StudentGrade[] }>> {
  return callApi('get_grades', { idEscuela });
}

export async function getStudentGrades(curp: string): Promise<ApiResponse<{ grades: Partial<StudentGrade> }>> {
  return callApi('get_student_grades', { curp });
}

export async function uploadGrades(idEscuela: string, gradesData: Partial<StudentGrade>[]): Promise<ApiResponse<null>> {
    return callApi('upload_grades', { idEscuela, gradesData: JSON.stringify(gradesData) });
}

export async function updateGrade(idEscuela: string, curp: string, studentName: string, subject: string, grade: number | string | ''): Promise<ApiResponse<null>> {
    return callApi('update_grade', { idEscuela, curp, studentName, subject, grade });
}

export async function requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    return callApi('request_password_reset', { email });
}

export async function verifyResetCode(email: string, code: string): Promise<ApiResponse<null>> {
    return callApi('verify_reset_code', { email, code });
}

export async function updatePassword(email: string, code: string, password: string): Promise<ApiResponse<null>> {
    return callApi('update_password_user', { email, code, password });
}
