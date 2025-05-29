// server.js

// Importa los módulos necesarios
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Usamos la versión de promesas para operaciones asíncronas
const bodyParser = require('body-parser'); // Para parsear el body de las peticiones POST

const app = express(); // Crea una instancia de la aplicación Express
const PORT = process.env.PORT || 3000; // Define el puerto en el que el servidor escuchará (usa 3000 por defecto)

// --- MIDDLEWARE ---

// 1. Sirve archivos estáticos
// Esto le dice a Express que sirva archivos HTML, CSS, JS, imágenes, etc.,
// directamente desde la carpeta donde se encuentra server.js (tu carpeta raíz del proyecto).
// Esto hará que http://localhost:3000/index.html funcione, y también /script.js, /style.css, etc.
app.use(express.static(__dirname));

// 2. Parsea el cuerpo de las peticiones HTTP
// Necesario para leer los datos que se envían en el cuerpo de las peticiones POST (como el JSON de las tareas)
app.use(bodyParser.json()); // Para peticiones que envían JSON (como la que guarda tareas)
app.use(bodyParser.urlencoded({ extended: true })); // Para peticiones con datos codificados en la URL (menos probable para tu caso, pero útil)


// --- RUTAS DE API (TU BACKEND) ---

// Ruta para LEER las tareas
// Cuando el frontend (script.js) haga un GET a /api/tareas.json
app.get('/api/tareas.json', async (req, res) => {
    // La ruta al archivo tareas.json está directamente en la misma carpeta raíz
    const filePath = path.join(__dirname, 'tareas.json');

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data)); // Envía el contenido JSON como respuesta
    } catch (error) {
        console.error('Error al leer tareas.json:', error);
        // Si el archivo no existe (ENOENT), devuelve un objeto JSON vacío para que el frontend no falle
        if (error.code === 'ENOENT') {
            res.json({});
        } else {
            // Para otros errores, envía un código de error 500 y un mensaje
            res.status(500).send('Error interno del servidor al leer tareas.');
        }
    }
});

// Ruta para GUARDAR/ACTUALIZAR las tareas
// Cuando el frontend (script.js) haga un POST a /api/guardar_tarea
app.post('/api/guardar_tarea', async (req, res) => {
    const nuevasTareas = req.body; // Los datos JSON enviados desde el frontend estarán en req.body

    // Validación básica: asegura que se recibieron datos
    if (!nuevasTareas) {
        return res.status(400).send('Datos de tarea no proporcionados.');
    }

    // La ruta al archivo tareas.json está directamente en la misma carpeta raíz
    const filePath = path.join(__dirname, 'tareas.json');

    try {
        // Escribe el objeto JSON completo en el archivo.
        // JSON.stringify(nuevasTareas, null, 4) formatea el JSON con indentación para que sea legible.
        await fs.writeFile(filePath, JSON.stringify(nuevasTareas, null, 4), 'utf8');
        res.status(200).send('Tareas guardadas con éxito.'); // Envía una respuesta de éxito
    } catch (error) {
        console.error('Error al escribir tareas.json:', error);
        res.status(500).send('Error interno del servidor al guardar tareas.'); // Envía un error si algo falla
    }
});


// --- INICIAR EL SERVIDOR ---

app.listen(PORT, () => {
    console.log(`Servidor Node.js escuchando en http://localhost:${PORT}`);
    console.log(`Accede a tu calendario en: http://localhost:${PORT}/index.html`);
});