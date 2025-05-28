<?php
header('Content-Type: application/json');
$archivo = 'tareas.json'; // Ruta al archivo JSON
$logFile = 'debug_log.txt'; // Archivo de log para depuración

// --- LOGGING: Inicio de la petición ---
file_put_contents($logFile, "\n--- Petición recibida: " . date('Y-m-d H:i:s') . " ---\n", FILE_APPEND);

$datosRecibidos = json_decode(file_get_contents('php://input'), true);

// --- LOGGING: Datos recibidos y decodificados ---
file_put_contents($logFile, "Datos recibidos (decoded):\n" . print_r($datosRecibidos, true) . "\n", FILE_APPEND);

if ($datosRecibidos !== null) {
    $jsonParaGuardar = json_encode($datosRecibidos, JSON_PRETTY_PRINT);

    // --- LOGGING: JSON que se intentará guardar ---
    file_put_contents($logFile, "JSON a guardar (previo a escritura):\n" . $jsonParaGuardar . "\n", FILE_APPEND);

    // Intento de escritura en el archivo
    if (file_put_contents($archivo, $jsonParaGuardar) !== false) {
        // --- LOGGING: Éxito de escritura ---
        file_put_contents($logFile, "Guardado exitoso en " . $archivo . "\n", FILE_APPEND);
        echo json_encode(['status' => 'ok', 'message' => 'Estado del calendario guardado con éxito.']);
    } else {
        // --- LOGGING: Fallo de escritura ---
        file_put_contents($logFile, "FALLO al guardar en " . $archivo . ". Posible problema de permisos o ruta.\n", FILE_APPEND);
        echo json_encode(['status' => 'error', 'message' => 'Error al escribir en el archivo ' . $archivo . '. Verifique permisos.']);
    }
} else {
    // --- LOGGING: Datos inválidos ---
    file_put_contents($logFile, "ERROR: Datos inválidos o vacíos recibidos (json_decode falló).\n", FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Datos inválidos o vacíos recibidos.']);
}
?>