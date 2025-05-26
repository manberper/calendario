<?php
header('Content-Type: application/json');

$archivo = 'tareas.json';

if (!file_exists($archivo)) {
    echo json_encode(['status' => 'error', 'message' => 'Archivo no encontrado']);
    exit;
}

$tareas = json_decode(file_get_contents($archivo), true);
$data = json_decode(file_get_contents('php://input'), true);

$clave = $data['clave'] ?? null;
$indice = $data['indice'] ?? null;
$accion = $data['accion'] ?? null;
$texto = $data['texto'] ?? '';

if (!isset($tareas[$clave]) || !isset($tareas[$clave][$indice])) {
    echo json_encode(['status' => 'error', 'message' => 'Tarea no encontrada']);
    exit;
}

if ($accion === 'editar') {
    $tareas[$clave][$indice] = $texto;
} elseif ($accion === 'borrar') {
    array_splice($tareas[$clave], $indice, 1);
    if (count($tareas[$clave]) === 0) {
        unset($tareas[$clave]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Acción inválida']);
    exit;
}

if (file_put_contents($archivo, json_encode($tareas, JSON_PRETTY_PRINT))) {
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se pudo guardar']);
}
