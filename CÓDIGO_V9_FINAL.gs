// =================================================================
// SCRIPT DEFINITIVO Y ROBUSTO v9 - QR GATE SKOOL KITS
// =================================================================

// === NUEVA FUNCIÓN DE PRUEBA ===
/**
 * Envía un correo de prueba para verificar que el servicio MailApp está autorizado y funcionando.
 * ANTES DE EJECUTAR: Debes reemplazar 'reemplaza.con.tu.email@ejemplo.com' por tu correo real.
 */
function enviarEmailDePrueba() {
  // IMPORTANTE: Reemplaza esta dirección con tu propio correo electrónico para la prueba.
  var emailDePrueba = "reemplaza.con.tu.email@ejemplo.com"; 
  
  if (emailDePrueba === "reemplaza.con.tu.email@ejemplo.com") {
    var msg = "Error: Debes editar el email en la función de prueba del script 'enviarEmailDePrueba'.";
    console.error(msg);
    // Muestra una notificación emergente en la hoja de cálculo si está abierta.
    try { SpreadsheetApp.getActiveSpreadsheet().toast(msg); } catch(e){}
    return;
  }

  try {
    MailApp.sendEmail(
      emailDePrueba,
      "Correo de Prueba - QR GATE",
      "¡Felicidades! Si recibes este correo, el sistema de envío de notificaciones de Google Apps Script está funcionando correctamente."
    );
    var successMsg = 'Correo de prueba enviado a ' + emailDePrueba;
    console.log('✅ ' + successMsg);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(successMsg); } catch(e){}
  } catch (e) {
    var errorMsg = 'Error al enviar correo: ' + e.message;
    console.error('❌ Error enviando el email de prueba:', e.stack);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(errorMsg); } catch(e){}
  }
}

// === CONFIGURACIÓN ===
var SPREADSHEET_ID = '1SQk8OwLdHga5hx3lR6Q5PsmOqZs511yTML4ulHpxi-I';

var SHEET_NAMES = {
  USUARIOS: 'USUARIOS',
  TUTORES: 'TUTORES',
  PROFESORES: 'PROFESORES',
  ADMINISTRATIVOS: 'ADMINISTRATIVOS',
  DIRECTIVOS: 'DIRECTIVOS',
  ASISTENCIA: 'ASISTENCIA'
};

// === FUNCIONES PRINCIPALES ===
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'test';
    
    switch(action) {
      case 'test': return testConnection();
      case 'login': return handleLogin(params);
      case 'register': return handleRegister(params);
      case 'search_user': return searchUser(params);
      case 'get_user': return getUser(params);
      case 'get_all_users': return getAllUsers(params);
      case 'link_student': return linkStudent(params);
      case 'get_linked_students': return getLinkedStudents(params);
      case 'process_scan': return processScan(params);
      case 'get_activity': return getActivity(params);
      case 'get_full_log': return getFullLog(params);
      case 'update_user': return updateUser(params);
      case 'delete_user': return deleteUser(params);
      default:
        return createResponse('error', 'Acción no válida.');
    }
  } catch (error) {
    console.error('❌ Error en handleRequest:', error.stack);
    return createResponse('error', 'Error interno del servidor: ' + error.toString());
  }
}

// === FUNCIONES CRUD DE USUARIOS ===
function handleRegister(params) {
  if (!params || !params.email || !params.password || !params.nombre || !params.rol) return createResponse('error', 'Se requiere: email, password, nombre, rol.');
  var { email, password, nombre, rol, idEscuela } = params;
  if (findUserInAnySheet(email)) return createResponse('error', 'El email ya está registrado.');
  var sheetName;
  if (rol === "Tutor") sheetName = SHEET_NAMES.TUTORES;
  else if (rol === "Docente") sheetName = SHEET_NAMES.PROFESORES;
  else if (rol === "Director") sheetName = SHEET_NAMES.DIRECTIVOS;
  else if (rol === "Administrativo") sheetName = SHEET_NAMES.ADMINISTRATIVOS;
  else sheetName = SHEET_NAMES.USUARIOS;
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return createResponse('error', 'La hoja de destino no existe: ' + sheetName);
  var headers = getSheetHeaders(sheet);
  var newUserRow = headers.map(function(h) {
    var data = { email: email, password: password, rol: rol, nombre: nombre, id_escuela: idEscuela || '', fecha_registro: new Date().toLocaleString('es-ES'), status: 'active' };
    return data[h] || '';
  });
  sheet.appendRow(newUserRow);
  try {
    var subject = "¡Bienvenido a QR GATE Skool Kits!";
    var body = "Hola " + nombre + ",\n\nTu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión en la aplicación con tu email y contraseña.\n\nRol Asignado: " + rol + "\nEmail: " + email + "\n\nGracias por unirte a nuestra plataforma.\n\nAtentamente,\nEl equipo de QR GATE Skool Kits";
    MailApp.sendEmail(email, subject, body, { name: 'QR GATE Skool Kits' });
  } catch (e) {
    console.error('❌ Error enviando email de bienvenida a:', email, e.message);
  }
  return createResponse('success', 'Usuario registrado exitosamente', { user: { email:email, nombre:nombre, rol:rol, idEscuela:idEscuela } });
}

function getAllUsers(params) {
    params = params || {}; 
    var idEscuela = params.idEscuela;
    var allUsers = [];
    for (var sheetKey in SHEET_NAMES) {
        if (SHEET_NAMES[sheetKey] !== SHEET_NAMES.ASISTENCIA) {
            var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES[sheetKey]);
            if(sheet) allUsers = allUsers.concat(getSheetData(sheet));
        }
    }
    if (idEscuela) allUsers = allUsers.filter(function(u) { return u.id_escuela === idEscuela; });
    return createResponse('success', 'Usuarios obtenidos.', { users: allUsers });
}

function deleteUser(params) {
    if (!params || !params.email) return createResponse('error', 'Se requiere: email.');
    var userRecord = findUserInAnySheet(params.email);
    if (!userRecord) return createResponse('error', 'Usuario a eliminar no encontrado.');
    try {
        var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(userRecord.sheetName);
        var data = sheet.getDataRange().getValues();
        var emailIndex = getSheetHeaders(sheet).indexOf('email');
        for (var i = data.length - 1; i >= 1; i--) {
            if (data[i][emailIndex] === params.email) {
                sheet.deleteRow(i + 1);
                return createResponse('success', 'Usuario eliminado.');
            }
        }
    } catch (e) {
        return createResponse('error', 'Error al eliminar: ' + e.message);
    }
    return createResponse('error', 'No se encontró al usuario para eliminar.');
}

function updateUser(params) {
    if (!params || !params.email) return createResponse('error', 'Se requiere: email.');
    var userRecord = findUserInAnySheet(params.email);
    if (!userRecord) return createResponse('error', 'Usuario a actualizar no encontrado.');
    try {
        var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(userRecord.sheetName);
        var data = sheet.getDataRange().getValues();
        var headers = getSheetHeaders(sheet);
        var emailIndex = headers.indexOf('email');
        for (var i = 1; i < data.length; i++) {
            if (data[i][emailIndex] === params.email) {
                var newRow = headers.map(function(h, j) {
                    var pKey = Object.keys(params).find(p => p.toLowerCase() === h.replace(/_/g, ''));
                    return (pKey && params[pKey] !== undefined) ? params[pKey] : data[i][j];
                });
                sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
                return createResponse('success', 'Usuario actualizado.');
            }
        }
    } catch (e) {
        return createResponse('error', 'Error al actualizar: ' + e.message);
    }
    return createResponse('error', 'No se encontró al usuario para actualizar.');
}

function handleLogin(params) {
  if (!params || !params.email || !params.password) return createResponse('error', 'Se requiere: email, password.');
  var userRecord = findUserInAnySheet(params.email);
  if (!userRecord) return createResponse('error', 'Usuario no encontrado.');
  if (userRecord.user.password === params.password) {
    if (userRecord.user.status && userRecord.user.status.toLowerCase() !== 'active') return createResponse('error', 'Usuario inactivo.');
    return createResponse('success', 'Login exitoso', { user: userRecord.user });
  } else {
    return createResponse('error', 'Contraseña incorrecta.');
  }
}

function searchUser(params) {
    if (!params || !params.search) return createResponse('error', 'Se requiere: search.');
    var allUsers = getAllUsers({}).data.users;
    var queryLower = params.search.toLowerCase();
    var results = allUsers.filter(function(u) { return (u.nombre && u.nombre.toLowerCase().includes(queryLower)) || (u.email && u.email.toLowerCase().includes(queryLower)); });
    return createResponse('success', 'Búsqueda completada.', { students: results });
}

function getUser(params) {
    if (!params || !params.email) return createResponse('error', 'Se requiere: email.');
    var userRecord = findUserInAnySheet(params.email);
    return userRecord ? createResponse('success', 'Usuario encontrado.', { user: userRecord.user }) : createResponse('error', 'Usuario no encontrado.');
}

function getFullLog(params) {
  params = params || {};
  var idEscuela = params.idEscuela;
  var asistenciaSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.ASISTENCIA);
  if (!asistenciaSheet) return createResponse('success', 'No hay registros.', { log: [] });
  var allLogs = getSheetData(asistenciaSheet);
  if (idEscuela) allLogs = allLogs.filter(function(l) { return l.id_escuela === idEscuela; });
  allLogs.sort(function(a, b) { return new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora); });
  return createResponse('success', 'Historial obtenido.', { log: allLogs });
}

function processScan(params) {
  if (!params || !params.email || !params.lectorId) return createResponse('error', 'Se requieren: email, lectorId.');
  var userRecord = findUserInAnySheet(params.email);
  if (!userRecord) return createResponse('error', 'Usuario no encontrado.');
  var user = userRecord.user;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var asistenciaSheet = ss.getSheetByName(SHEET_NAMES.ASISTENCIA);
  if (!asistenciaSheet) {
    asistenciaSheet = ss.insertSheet(SHEET_NAMES.ASISTENCIA);
    asistenciaSheet.appendRow(['Timestamp', 'Fecha', 'Hora', 'Email', 'Nombre', 'Rol', 'Movimiento', 'LectorID', 'ID_Escuela']);
    asistenciaSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setFrozenRows(1);
  }
  if (!getSheetHeaders(asistenciaSheet).includes('id_escuela')) asistenciaSheet.getRange(1, getSheetHeaders(asistenciaSheet).length + 1).setValue('ID_Escuela');
  var data = asistenciaSheet.getDataRange().getValues();
  var todayStr = new Date().toISOString().split('T')[0];
  var lastMovement = null;
  for (var i = data.length - 1; i > 0; i--) {
    if (data[i][3] === params.email && Utilities.formatDate(new Date(data[i][1]), "GMT", "yyyy-MM-dd") === todayStr) {
      lastMovement = data[i][6];
      break;
    }
  }
  var newMovement = (lastMovement === 'Entrada') ? 'Salida' : 'Entrada';
  var now = new Date();
  var hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  asistenciaSheet.appendRow([now, todayStr, hora, params.email, user.nombre, user.rol, newMovement, params.lectorId, user.id_escuela || '']);
  if (user.rol && String(user.rol).toLowerCase().includes('alumno')) {
    var tutores = getLinkedTutorsForStudent(params.email);
    tutores.forEach(function(t) {
      var subject = 'Notificación de Asistencia: ' + user.nombre;
      var body = 'Hola ' + t.nombre + ',\n\nSe ha registrado una ' + newMovement.toLowerCase() + ' para ' + user.nombre + ' a las ' + hora + '.\n\nAtentamente,\nQR GATE Skool Kits';
      try { MailApp.sendEmail(t.email, subject, body, { name: 'QR GATE Skool Kits' }); } catch (e) { console.error('Error enviando email a tutor:', t.email, e.message); }
    });
  }
  return createResponse('success', 'Registro exitoso.', { movimiento: newMovement, nombre: user.nombre, hora: hora });
}

function getActivity(params) {
  if (!params || !params.email) return createResponse('error', 'Se requiere: email.');
  var asistenciaSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.ASISTENCIA);
  if (!asistenciaSheet) return createResponse('success', 'No hay registros.', { registros: [] });
  var data = getSheetData(asistenciaSheet);
  var userLog = data.filter(function(r) { return r.email === params.email; }).map(function(r) { return { tipo: r.movimiento, hora: r.hora, fecha: r.fecha }; }).sort(function(a,b){ return new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora);});
  return createResponse('success', 'Historial obtenido.', { registros: userLog });
}

function linkStudent(params) {
  if (!params || !params.tutor_email || !params.student_email) return createResponse('error', 'Se requieren: tutor_email, student_email.');
  var tutoresSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.TUTORES);
  if (!tutoresSheet) return createResponse('error', 'Hoja de Tutores no encontrada.');
  var data = tutoresSheet.getDataRange().getValues();
  var emailIndex = getSheetHeaders(tutoresSheet).indexOf('email');
  var hijosIndex = getSheetHeaders(tutoresSheet).indexOf('ids_hijos');
  if(hijosIndex === -1) { tutoresSheet.getRange(1, data[0].length + 1).setValue('Ids_hijos'); hijosIndex = data[0].length; }
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === params.tutor_email) {
      var hijosArray = (data[i][hijosIndex] || '').toString().split(',').filter(Boolean);
      if (!hijosArray.includes(params.student_email)) {
        hijosArray.push(params.student_email);
        tutoresSheet.getRange(i + 1, hijosIndex + 1).setValue(hijosArray.join(','));
        return createResponse('success', 'Alumno vinculado.');
      } else { return createResponse('error', 'Este alumno ya está vinculado.'); }
    }
  }
  return createResponse('error', 'Tutor no encontrado.');
}

function getLinkedStudents(params) {
    if (!params || !params.tutor_email) return createResponse('error', 'Se requiere: tutor_email.');
    var tutorRecord = findUserInAnySheet(params.tutor_email);
    if (!tutorRecord || tutorRecord.sheetName !== SHEET_NAMES.TUTORES) return createResponse('error', 'Tutor no encontrado.');
    var hijos = tutorRecord.user.ids_hijos || '';
    return createResponse('success', 'Hijos obtenidos.', { hijos: hijos ? hijos.split(',') : [] });
}

function getLinkedTutorsForStudent(studentEmail) {
  var tutoresSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.TUTORES);
  if (!tutoresSheet) return [];
  return getSheetData(tutoresSheet).filter(function(t) { return (t.ids_hijos || '').split(',').includes(studentEmail); });
}

function testConnection() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return createResponse('success', 'Backend conectado: ' + ss.getName());
  } catch (e) {
    return createResponse('error', 'Error de conexión: ' + e.message);
  }
}

function findUserInAnySheet(email) {
    for (var type in SHEET_NAMES) {
        if (type !== 'ASISTENCIA') {
            var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES[type]);
            if (sheet) {
                var user = findUserInSheet(sheet, email);
                if (user) return { user: user, sheetName: SHEET_NAMES[type] };
            }
        }
    }
    return null;
}

function findUserInSheet(sheet, email) {
    if (!sheet) return null;
    return getSheetData(sheet).find(function(r){ return r.email === email; }) || null;
}

function getSheetData(sheet) {
  if (!sheet || typeof sheet.getDataRange !== 'function' || sheet.getLastRow() < 1) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = getSheetHeaders(sheet);
  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    return obj;
  });
}

function getSheetHeaders(sheet) {
    if (!sheet || sheet.getLastRow() < 1) return [];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h){ return h ? h.toString().trim().toLowerCase().replace(/\s+/g, '_') : ''; });
}

function createResponse(status, message, data) {
  var response = { status: status, message: message };
  if (data !== undefined) response.data = data;
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}
