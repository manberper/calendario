<?php
header('Content-Type: application/json');
$archivo = 'tareas.json';

$datos = json_decode(file_get_contents('php://input'), true);

if ($datos !== null) {
    // Asegurarse de que el JSON se guarda con formato para facilitar la lectura
    file_put_contents($archivo, json_encode($datos, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Datos inválidos']);
}
?>