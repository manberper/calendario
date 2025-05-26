<?php
header('Content-Type: application/json');

$archivo = 'tareas.json';

if (!file_exists($archivo)) {
    echo json_encode(['status' => 'error', 'message' => 'Archivo no encontrado']);
    exit;
}

$tareas = json_decode(file_get_contents($archivo), true);
$data = json_decode(file_get_contents('php://input'), true);

$clave = $data['clave'] ?? null; // Fecha (ej: "2025-05-21")
$hora = $data['hora'] ?? null;   // Hora (ej: "12:00")
$indiceEnArray = $data['indiceEnArray'] ?? null; // Nuevo: Índice en el array de tareas para esa hora
$accion = $data['accion'] ?? null;
$texto = $data['texto'] ?? null; // Contenido completo de la tarea para edición

// Validaciones básicas
if (!isset($tareas[$clave])) {
    echo json_encode(['status' => 'error', 'message' => 'Fecha no encontrada para la tarea']);
    exit;
}
if (!isset($tareas[$clave][$hora])) {
    echo json_encode(['status' => 'error', 'message' => 'Hora no encontrada para la tarea']);
    exit;
}
// Asegurarse de que el índice es numérico y existe en el array
if ($indiceEnArray === null || !is_numeric($indiceEnArray) || !isset($tareas[$clave][$hora][$indiceEnArray])) {
    echo json_encode(['status' => 'error', 'message' => 'Índice de tarea inválido o no encontrado']);
    exit;
}


if ($accion === 'editar') {
    // El 'texto' ahora es el objeto de tarea completo (texto, duracion, profesional)
    $tareas[$clave][$hora][$indiceEnArray] = $texto;
} elseif ($accion === 'borrar') {
    // Usamos array_splice para eliminar por índice de un array
    array_splice($tareas[$clave][$hora], $indiceEnArray, 1);

    // Si el array de tareas para esa hora queda vacío, eliminamos la entrada de la hora
    if (empty($tareas[$clave][$hora])) {
        unset($tareas[$clave][$hora]);
    }
    // Si no quedan horas para esa fecha, eliminamos la entrada de la fecha
    if (empty($tareas[$clave])) {
        unset($tareas[$clave]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Acción inválida']);
    exit;
}

// Guardar los cambios
if (file_put_contents($archivo, json_encode($tareas, JSON_PRETTY_PRINT))) {
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Error al escribir en el archivo']);
}
?>