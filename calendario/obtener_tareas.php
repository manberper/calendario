<?php
header('Content-Type: application/json'); // Indica que la respuesta será JSON
$archivo = 'tareas.json'; // Ruta al archivo donde guardas las tareas

// Verifica si el archivo existe y no está vacío
if (file_exists($archivo) && filesize($archivo) > 0) {
    // Lee el contenido del archivo
    $contenidoArchivo = file_get_contents($archivo);
    // Decodifica el JSON a un array de PHP
    $tareas = json_decode($contenidoArchivo, true);
    
    // Si la decodificación falla (ej. JSON corrupto) o no es un array, devuelve un array vacío
    if (!is_array($tareas)) {
        $tareas = [];
    }
    // Devuelve las tareas como JSON
    echo json_encode($tareas);
} else {
    // Si el archivo no existe o está vacío, devuelve un array JSON vacío
    echo json_encode([]);
}
?>