// calendario/server.js

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises; // Para operaciones de sistema de archivos, si las necesitas

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Puedes configurar el puerto en .env si quieres

// --- Conexión a MongoDB Atlas ---
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión a MongoDB Atlas:', err));

// --- Definir el Esquema y el Modelo de Tarea ---
// Asegúrate de que este esquema coincide con la estructura de tus objetos de tarea
const tareaSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Usar tu ID único para cada tarea
    titulo: String,
    descripcion: String,
    fecha: String, // Formato "YYYY-MM-DD"
    hora: String,
    duracion: Number,
    categoria: String,
    completada: { type: Boolean, default: false } // Valor por defecto
}, { _id: false }); // No crear un _id automático si ya usas tu propio 'id'

const Tarea = mongoose.models.Tarea || mongoose.model('Tarea', tareaSchema);

// --- Middleware ---
app.use(bodyParser.json()); // Para parsear el body de las peticiones POST y PUT como JSON
app.use(bodyParser.urlencoded({ extended: true })); // Para URLs codificadas

// Servir archivos estáticos desde la misma carpeta del servidor
app.use(express.static(path.join(__dirname))); // Sirve los archivos de la carpeta 'calendario'

// --- RUTAS DE API ---

// Ruta para LEER todas las tareas
// GET /api/tareas
app.get('/api/tareas', async (req, res) => {
    try {
        const tareas = await Tarea.find({});
        // Formatear las tareas para que se agrupen por fecha como tu frontend espera
        const tareasPorFecha = {};
        tareas.forEach(tarea => {
            if (!tareasPorFecha[tarea.fecha]) {
                tareasPorFecha[tarea.fecha] = [];
            }
            tareasPorFecha[tarea.fecha].push(tarea.toObject());
        });
        res.json(tareasPorFecha);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener tareas.' });
    }
});

// Ruta para CREAR/ACTUALIZAR una tarea
// POST /api/tarea
app.post('/api/tarea', async (req, res) => {
    const nuevaTarea = req.body;
    if (!nuevaTarea || !nuevaTarea.id) {
        return res.status(400).json({ message: 'Datos de tarea incompletos (falta id).' });
    }

    try {
        const tareaExistente = await Tarea.findOneAndUpdate(
            { id: nuevaTarea.id },
            nuevaTarea,
            { upsert: true, new: true } // upsert: crea si no existe; new: devuelve el documento actualizado
        );
        res.status(200).json({ message: 'Tarea guardada con éxito.', tarea: tareaExistente });
    } catch (error) {
        console.error('Error al guardar tarea:', error);
        res.status(500).json({ message: 'Error interno del servidor al guardar tarea.' });
    }
});

// Ruta para ELIMINAR una tarea
// DELETE /api/tarea/:id
app.delete('/api/tarea/:id', async (req, res) => {
    const tareaId = req.params.id;

    try {
        const result = await Tarea.deleteOne({ id: tareaId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }
        res.status(200).json({ message: 'Tarea eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar tarea.' });
    }
});

// Ruta para servir el index.html al acceder a la raíz del servidor
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Node.js escuchando en http://localhost:${PORT}`);
    console.log(`Accede a tu calendario en: http://localhost:${PORT}/index.html`);
});