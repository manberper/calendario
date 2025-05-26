<?php
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true); // true para array asociativo

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'JSON inválido recibido.']);
    exit;
}

$filepath = 'tareas.json';

// Bloquear el archivo para evitar condiciones de carrera
$fileHandle = fopen($filepath, 'c+'); // 'c+' para abrir para lectura y escritura; si no existe, lo crea.
if (!$fileHandle) {
    echo json_encode(['success' => false, 'message' => 'No se pudo abrir el archivo de tareas.']);
    exit;
}

if (!flock($fileHandle, LOCK_EX)) { // Bloqueo exclusivo
    fclose($fileHandle);
    echo json_encode(['success' => false, 'message' => 'No se pudo bloquear el archivo de tareas.']);
    exit;
}

try {
    // Si el archivo está vacío o corrupto, inicializarlo como un objeto JSON vacío
    if (filesize($filepath) === 0) {
        $existing_data = [];
    } else {
        rewind($fileHandle); // Ir al principio del archivo
        $existing_content = fread($fileHandle, filesize($filepath));
        $existing_data = json_decode($existing_content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Si el JSON existente está corrupto, lo sobrescribimos o manejamos el error
            error_log("Error al decodificar tareas.json existente: " . json_last_error_msg());
            $existing_data = []; // O manejar de otra manera, por ejemplo, lanzar un error
        }
    }

    // $data ya contiene el objeto completo de tareas que se envía desde el frontend
    // Simplemente sobrescribimos el contenido del archivo con el nuevo $data
    $json_output = json_encode($data, JSON_PRETTY_PRINT);

    if ($json_output === false) {
        throw new Exception('Error al codificar JSON: ' . json_last_error_msg());
    }

    ftruncate($fileHandle, 0); // Truncar el archivo a longitud 0
    rewind($fileHandle); // Volver al principio
    fwrite($fileHandle, $json_output);

    echo json_encode(['success' => true, 'message' => 'Tareas guardadas.']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
} finally {
    flock($fileHandle, LOCK_UN); // Liberar el bloqueo
    fclose($fileHandle);
}
?>