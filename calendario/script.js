// script.js
// Lógica de formularios y manejo del modal de tareas (añadir, editar, eliminar).
// Utiliza variables globales y funciones definidas en main.js y calendar.js.

// --- Elementos del DOM relacionados con el formulario y el modal (declarados al inicio del script) ---
// Estos elementos son directamente accesibles por todas las funciones dentro de este script.
const fechaInput = document.getElementById("fecha");
const horaInput = document.getElementById("hora");
const duracionSelect = document.getElementById("duracion");
const profesionalSelect = document.getElementById("profesional");
const tareaInput = document.getElementById("descripcion");
const formulario = document.getElementById("formulario");

// Panel de Tareas del Día
const fechaPanelTareas = document.getElementById("fecha-panel-tareas");
const listaTareas = document.getElementById("lista-tareas");
const listaProximasTareas = document.getElementById("lista-proximas-tareas");

// Modal de Detalles/Edición de Tarea
const modalTarea = document.getElementById("modal-tarea");
const detalleFechaSpan = document.getElementById("detalle-fecha");
const detalleHoraSpan = document.getElementById("detalle-hora");
const detalleDuracionSpan = document.getElementById("detalle-duracion");
const detalleProfesionalSpan = document.getElementById("detalle-profesional");
const detalleDescripcionSpan = document.getElementById("detalle-descripcion");

const editarFechaInput = document.getElementById("editar-fecha");
const editarHoraSelect = document.getElementById("editar-hora");
// Hacemos que estos selectores sean accesibles globalmente para main.js si es necesario
// para que main.js pueda rellenarlos con cargarProfesionales.
window.editarDuracionSelect = document.getElementById("editar-duracion");
window.editarProfesionalSelect = document.getElementById("editar-profesional");
const editarDescripcionInput = document.getElementById("editar-descripcion");

const guardarCambiosBtn = document.getElementById("guardar-cambios");
const eliminarTareaBtn = document.getElementById("eliminar-tarea");
const cancelarEdicionBtn = document.getElementById("cancelar-edicion");


// --- Funciones auxiliares (algunas pueden estar en main.js o calendar.js y ser accesibles via window) ---

/**
 * Muestra el modal de detalles/edición de una tarea.
 * @param {string} fecha - La fecha de la tarea (YYYY-MM-DD).
 * @param {object} tarea - El objeto de la tarea seleccionada.
 * @param {number} index - El índice de la tarea en el array de tareas de esa fecha.
 */
window.mostrarDetallesTarea = (fecha, tarea, index) => {
    window.tareaSeleccionada = { fecha, ...tarea, index }; // Guardar la tarea seleccionada globalmente

    // Mostrar detalles
    detalleFechaSpan.textContent = fecha;
    detalleHoraSpan.textContent = tarea.hora;
    detalleDuracionSpan.textContent = `${tarea.duracion} minutos`;
    // Buscar el nombre del profesional
    const profesionalObj = window.profesionales.find(p => p.id === tarea.profesional);
    detalleProfesionalSpan.textContent = profesionalObj ? profesionalObj.nombre : "Desconocido";
    detalleDescripcionSpan.textContent = tarea.descripcion;

    // Rellenar formulario de edición
    editarFechaInput.value = fecha;
    editarDescripcionInput.value = tarea.descripcion;

    // Cargar horas disponibles para edición, si ya existen las funciones y selectores
    if (typeof window.cargarHorasDisponibles === 'function' && editarHoraSelect && window.editarDuracionSelect && window.editarProfesionalSelect) {
        window.cargarHorasDisponibles(fecha, tarea.duracion, tarea.profesional, editarHoraSelect, tarea.hora);
    } else {
        console.warn("La función cargarHorasDisponibles o los selectores de edición no están disponibles.");
    }

    // Cargar profesionales para edición
    if (typeof window.cargarProfesionales === 'function' && window.editarProfesionalSelect) {
        window.cargarProfesionales(window.editarProfesionalSelect, tarea.profesional);
    } else {
        console.warn("La función cargarProfesionales o el selector de profesionales de edición no están disponibles.");
    }

    // Seleccionar la duración actual en el select de edición
    if (window.editarDuracionSelect) {
        window.editarDuracionSelect.value = tarea.duracion;
    }

    modalTarea.style.display = "block"; // Mostrar el modal
};


/**
 * Guarda los cambios de una tarea editada en el servidor.
 */
async function guardarCambiosTarea() {
    if (!window.tareaSeleccionada) {
        alert("No hay tarea seleccionada para guardar cambios.");
        return;
    }

    const { fecha: originalFecha, index: originalIndex } = window.tareaSeleccionada;

    const nuevaFecha = editarFechaInput.value;
    const nuevaHora = editarHoraSelect.value;
    const nuevaDuracion = parseInt(window.editarDuracionSelect.value);
    const nuevoProfesional = window.editarProfesionalSelect.value;
    const nuevaDescripcion = editarDescripcionInput.value.trim();

    if (!nuevaFecha || !nuevaHora || isNaN(nuevaDuracion) || !nuevoProfesional || !nuevaDescripcion) {
        alert("Por favor, completa todos los campos para editar la tarea.");
        return;
    }

    // Asegurarse de que window.tareas esté inicializado
    if (typeof window.tareas === 'undefined' || window.tareas === null) {
        console.error("Error: window.tareas no está inicializado. Recargando datos.");
        alert("La aplicación no pudo cargar las tareas. Recargando la página.");
        location.reload(); // Recargar para intentar inicializar tareas
        return;
    }

    // Crear una copia profunda de las tareas para no modificar el estado global directamente
    const tareasCopia = JSON.parse(JSON.stringify(window.tareas));

    // Remover la tarea original
    if (tareasCopia[originalFecha] && tareasCopia[originalFecha][originalIndex]) {
        tareasCopia[originalFecha].splice(originalIndex, 1);
        if (tareasCopia[originalFecha].length === 0) {
            delete tareasCopia[originalFecha];
        }
    } else {
        alert("Error: No se encontró la tarea original para editar.");
        return;
    }

    // Añadir la tarea modificada (podría ser en una fecha diferente)
    const tareaModificada = {
        hora: nuevaHora,
        duracion: nuevaDuracion,
        profesional: nuevoProfesional,
        descripcion: nuevaDescripcion,
    };

    if (!tareasCopia[nuevaFecha]) {
        tareasCopia[nuevaFecha] = [];
    }
    tareasCopia[nuevaFecha].push(tareaModificada);

    try {
        await window.guardarTareasEnServidor(tareasCopia);
        window.tareas = tareasCopia; // Actualizar la variable global
        alert("Cambios guardados correctamente.");
        window.renderizarTodoElCalendarioUI();
        // Asegurarse de que window.filtroProfesionalSelect exista antes de acceder a su valor
        const filtro = window.filtroProfesionalSelect ? window.filtroProfesionalSelect.value : '';
        window.mostrarTareasDelDia(window.formatearFecha(window.fechaActual), window.tareas, window.profesionales, filtro);
        window.renderizarProximasTareas(window.tareas, window.profesionales);
        window.cerrarModales();
    } catch (error) {
        console.error("Error al guardar cambios:", error);
        alert("Hubo un error al guardar los cambios de la tarea. Por favor, inténtalo de nuevo.");
    }
}

/**
 * Elimina una tarea seleccionada del servidor.
 */
async function eliminarTarea() {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        if (!window.tareaSeleccionada) {
            alert("No hay tarea seleccionada para eliminar.");
            return;
        }

        // Asegurarse de que window.tareas esté inicializado
        if (typeof window.tareas === 'undefined' || window.tareas === null) {
            console.error("Error: window.tareas no está inicializado. Recargando datos.");
            alert("La aplicación no pudo cargar las tareas. Recargando la página.");
            location.reload(); // Recargar para intentar inicializar tareas
            return;
        }

        const { fecha, index } = window.tareaSeleccionada;
        const tareasCopia = JSON.parse(JSON.stringify(window.tareas));

        if (tareasCopia[fecha] && tareasCopia[fecha][index]) {
            tareasCopia[fecha].splice(index, 1);

            if (tareasCopia[fecha].length === 0) {
                delete tareasCopia[fecha];
            }

            try {
                await window.guardarTareasEnServidor(tareasCopia);
                window.tareas = tareasCopia; // Actualizar la variable global
                window.renderizarTodoElCalendarioUI();
                // Asegurarse de que window.filtroProfesionalSelect exista antes de acceder a su valor
                const filtro = window.filtroProfesionalSelect ? window.filtroProfesionalSelect.value : '';
                window.mostrarTareasDelDia(window.formatearFecha(window.fechaActual), window.tareas, window.profesionales, filtro);
                window.renderizarProximasTareas(window.tareas, window.profesionales);
                window.cerrarModales();
                alert("Tarea eliminada correctamente.");
            } catch (error) {
                console.error("Error al eliminar tarea:", error);
                alert("Hubo un error al eliminar la tarea. Por favor, inténtalo de nuevo.");
            }
        } else {
            alert("No se encontró la tarea a eliminar.");
        }
    }
}

/**
 * Cierra todos los modales abiertos.
 */
window.cerrarModales = () => {
    modalTarea.style.display = "none";
    window.tareaSeleccionada = null; // Limpiar la tarea seleccionada
};


// --- Inicialización y Event Listeners principales del script ---
document.addEventListener("DOMContentLoaded", () => {

    // Manejar el envío del formulario para añadir una nueva tarea
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevenir el envío por defecto del formulario

        const fecha = fechaInput.value;
        const hora = horaInput.value;
        const duracion = parseInt(duracionSelect.value);
        const profesional = profesionalSelect.value;
        const descripcion = tareaInput.value.trim();

        // Validación básica
        if (!fecha || !hora || isNaN(duracion) || !profesional || !descripcion) {
            alert("Por favor, completa todos los campos del formulario correctamente.");
            return;
        }

        // Asegurarse de que window.tareas esté inicializado antes de intentar copiarlo
        if (typeof window.tareas === 'undefined' || window.tareas === null) {
            console.error("Error: window.tareas no está inicializado. Recargando datos.");
            alert("La aplicación no pudo cargar las tareas. Recargando la página.");
            location.reload(); // Recargar para intentar inicializar tareas
            return;
        }
        
        const tareasCopia = JSON.parse(JSON.stringify(window.tareas)); // Ahora window.tareas debería ser un objeto

        const nuevaTarea = {
            hora: hora,
            duracion: duracion,
            profesional: profesional,
            descripcion: descripcion,
        };

        if (!tareasCopia[fecha]) {
            tareasCopia[fecha] = [];
        }
        tareasCopia[fecha].push(nuevaTarea);

        try {
            await window.guardarTareasEnServidor(tareasCopia);
            window.tareas = tareasCopia; // Actualizar la variable global en main.js
            alert("Tarea guardada correctamente.");

            formulario.reset();
            // Asegurarse de que estas funciones existan y sean accesibles globalmente.
            if (typeof window.cargarHorasDisponibles === 'function' && fechaInput.value) {
                // Pasamos los elementos del DOM directamente a cargarHorasDisponibles
                window.cargarHorasDisponibles(fechaInput.value, duracionSelect.value, profesionalSelect.value, horaInput);
            }
            if (typeof window.renderizarTodoElCalendarioUI === 'function') {
                window.renderizarTodoElCalendarioUI();
            }
            if (typeof window.mostrarTareasDelDia === 'function' && typeof window.formatearFecha === 'function') {
                 // Asegurarse de que window.filtroProfesionalSelect exista antes de acceder a su valor
                const filtro = window.filtroProfesionalSelect ? window.filtroProfesionalSelect.value : '';
                window.mostrarTareasDelDia(window.formatearFecha(window.fechaActual), window.tareas, window.profesionales, filtro);
            }
            if (typeof window.renderizarProximasTareas === 'function') {
                window.renderizarProximasTareas(window.tareas, window.profesionales);
            }

        } catch (error) {
            console.error("Error al guardar la tarea:", error);
            alert("Hubo un error al guardar la tarea. Por favor, inténtalo de nuevo.");
        }
    });

    // Event listeners para el modal de edición/detalles
    if (guardarCambiosBtn) guardarCambiosBtn.addEventListener("click", guardarCambiosTarea);
    if (eliminarTareaBtn) eliminarTareaBtn.addEventListener("click", eliminarTarea);
    if (cancelarEdicionBtn) cancelarEdicionBtn.addEventListener("click", window.cerrarModales);

    // Añadir listeners para los cambios en los selects de edición
    if (editarFechaInput) {
        editarFechaInput.addEventListener('change', () => {
            if (typeof window.cargarHorasDisponibles === 'function' && editarFechaInput.value && window.editarDuracionSelect && window.editarProfesionalSelect && editarHoraSelect) {
                window.cargarHorasDisponibles(editarFechaInput.value, window.editarDuracionSelect.value, window.editarProfesionalSelect.value, editarHoraSelect, editarHoraSelect.value);
            }
        });
    }
    if (window.editarDuracionSelect) {
        window.editarDuracionSelect.addEventListener('change', () => {
            if (typeof window.cargarHorasDisponibles === 'function' && editarFechaInput.value && window.editarProfesionalSelect && editarHoraSelect) {
                window.cargarHorasDisponibles(editarFechaInput.value, window.editarDuracionSelect.value, window.editarProfesionalSelect.value, editarHoraSelect, editarHoraSelect.value);
            }
        });
    }
    if (window.editarProfesionalSelect) {
        window.editarProfesionalSelect.addEventListener('change', () => {
            if (typeof window.cargarHorasDisponibles === 'function' && editarFechaInput.value && window.editarDuracionSelect && editarHoraSelect) {
                window.cargarHorasDisponibles(editarFechaInput.value, window.editarDuracionSelect.value, window.editarProfesionalSelect.value, editarHoraSelect, editarHoraSelect.value);
            }
        });
    }

    // Listener para el campo de duración del formulario de añadir tarea
    if (duracionSelect) {
        duracionSelect.addEventListener('change', () => {
            // Asegúrate de que fechaInput y profesionalSelect tengan valores antes de llamar
            if (fechaInput.value && profesionalSelect.value && horaInput) {
                window.cargarHorasDisponibles(fechaInput.value, duracionSelect.value, profesionalSelect.value, horaInput);
            }
        });
    }

    // Listener para el campo de profesional del formulario de añadir tarea
    if (profesionalSelect) {
        profesionalSelect.addEventListener('change', () => {
            // Asegúrate de que fechaInput y duracionSelect tengan valores antes de llamar
            if (fechaInput.value && duracionSelect.value && horaInput) {
                window.cargarHorasDisponibles(fechaInput.value, duracionSelect.value, profesionalSelect.value, horaInput);
            }
        });
    }

    // Listener para el campo de fecha del formulario de añadir tarea
    if (fechaInput) {
        fechaInput.addEventListener('change', () => {
            // Asegúrate de que duracionSelect y profesionalSelect tengan valores antes de llamar
            if (duracionSelect.value && profesionalSelect.value && horaInput) {
                window.cargarHorasDisponibles(fechaInput.value, duracionSelect.value, profesionalSelect.value, horaInput);
            }
        });
    }

    // --- Inicialización al cargar la página: ---
    // Cargar profesionales en el select del formulario de añadir tarea
    // Se espera que main.js llame a window.cargarProfesionales para esto al inicio.
    // También se espera que main.js inicialice la fechaInput.value al cargar el DOM.
    // Y que main.js llame a cargarHorasDisponibles para la carga inicial.
});