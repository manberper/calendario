<?php
header('Content-Type: application/json');
$archivo = 'tareas.json';

// Verifica si el archivo existe y tiene contenido
if (file_exists($archivo) && filesize($archivo) > 0) {
    // Lee el contenido del archivo
    $contenidoArchivo = file_get_contents($archivo);
    // Decodifica el JSON a un array de PHP
    $tareas = json_decode($contenidoArchivo, true);
    
    // Si la decodificación falla o no es un array, devuelve un objeto vacío
    if (!is_array($tareas)) {
        $tareas = [];
    }
    echo json_encode($tareas);
} else {
    // Si el archivo no existe o está vacío, devuelve un objeto JSON vacío
    echo json_encode([]);
}
?>