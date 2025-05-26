<?php
$file = "tareas.json";
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo "{}";
}
?>
