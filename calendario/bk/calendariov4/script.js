// script.js
console.log("script.js cargado");
// Lógica principal de la aplicación: variables globales, carga de datos, eventos y CRUD de tareas.

// --- Variables Globales ---
let fechaActual = new Date();
let tareas = {}; // Objeto para almacenar tareas por fecha: { "YYYY-MM-DD": [tarea1, tarea2] }
let profesionales = []; // Array para almacenar la lista de profesionales
let tareaSeleccionada = null; // Para almacenar la tarea que se está viendo/editando en el modal
let diaSeleccionadoElement = null; // Referencia al elemento DOM del día actualmente seleccionado en la vista de mes
let vistaActual = 'mes'; // 'mes', 'semana', 'dia'

// --- Elementos del DOM ---
// Estas variables se usarán para los Event Listeners y el manejo de UI
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

// Formulario de Añadir Tarea
const fechaInput = document.getElementById("fecha");
const duracionSelect = document.getElementById("duracion");
const horaSelect = document.getElementById("hora");
const profesionalSelect = document.getElementById("profesional");
const tareaInput = document.getElementById("descripcion");
const formulario = document.getElementById("formulario");

// Panel de Tareas del Día
const panelTareas = document.getElementById("panel-tareas");
const fechaPanelTareas = document.getElementById("fecha-panel-tareas");
const listaTareasDia = document.getElementById("lista-tareas-dia");

// Panel de Próximas Tareas
const listaProximasTareas = document.getElementById("lista-proximas-tareas");

// Filtro de Profesional
const filtroProfesionalSelect = document.getElementById("filtro-profesional");

// Vistas del Calendario
const viewMonthBtn = document.getElementById('view-month-btn');
const viewWeekBtn = document.getElementById('view-week-btn');
const viewDayBtn = document.getElementById('view-day-btn');
const dayPicker = document.getElementById('day-picker-input');

// Modal de Detalles/Edición de Tarea
const modalDetalles = document.getElementById("modal-detalles");
// Los elementos de detalle se accederán directamente por su ID
const editarFechaInput = document.getElementById("editar-fecha");
const editarHoraSelect = document.getElementById("editar-hora");
const editarDuracionSelect = document.getElementById("editar-duracion");
const editarProfesionalSelect = document.getElementById("editar-profesional");
const inputEditar = document.getElementById("editar-descripcion");

const guardarCambiosBtn = document.getElementById("guardar-cambios");
const eliminarTareaBtn = document.getElementById("eliminar-tarea");
const cancelarEdicionBtn = document.getElementById("cancelar-edicion");
const cerrarDetallesBtn = document.getElementById("cerrar-detalles");

// --- Funciones de Lógica de Negocio (CRUD de Tareas) ---

function añadirTarea(event) {
    event.preventDefault();

    const fecha = fechaInput.value;
    const duracion = parseInt(duracionSelect.value);
    const hora = horaSelect.value;
    const profesional = profesionalSelect.value;
    const descripcion = tareaInput.value.trim();

    if (!fecha || isNaN(duracion) || !hora || !profesional || !descripcion) {
        alert("Por favor, rellena todos los campos de la tarea.");
        return;
    }

    if (!tareas[fecha]) {
        tareas[fecha] = [];
    }

    const nuevaTarea = {
        id: generarIdUnicoTarea(), // Generar un ID único para la nueva tarea
        hora,
        duracion,
        profesional,
        descripcion,
    };

    tareas[fecha].push(nuevaTarea);
    guardarTareas(); // Simular guardar en el "servidor"
    formulario.reset(); // Limpiar el formulario
    renderizarTodoElCalendarioUI(); // Actualizar el calendario y las listas
}

function guardarCambiosTarea() {
    if (!tareaSeleccionada) return;

    const fechaOriginal = tareaSeleccionada.fecha;
    const tareaId = tareaSeleccionada.id;

    const nuevaFecha = editarFechaInput.value;
    const nuevaHora = editarHoraSelect.value;
    const nuevaDuracion = parseInt(editarDuracionSelect.value);
    const nuevoProfesional = editarProfesionalSelect.value;
    const nuevaDescripcion = inputEditar.value.trim();

    if (!nuevaFecha || !nuevaHora || isNaN(nuevaDuracion) || !nuevoProfesional || !nuevaDescripcion) {
        alert("Por favor, rellena todos los campos de la tarea editada.");
        return;
    }

    let tareaActualizada = null;

    // Si la fecha ha cambiado, mover la tarea
    if (fechaOriginal !== nuevaFecha) {
        // Eliminar de la fecha original
        if (tareas[fechaOriginal]) {
            const indiceOriginal = tareas[fechaOriginal].findIndex(t => t.id === tareaId);
            if (indiceOriginal !== -1) {
                tareaActualizada = tareas[fechaOriginal].splice(indiceOriginal, 1)[0];
            }
        }
        // Añadir a la nueva fecha
        if (tareaActualizada) {
            if (!tareas[nuevaFecha]) {
                tareas[nuevaFecha] = [];
            }
            tareas[nuevaFecha].push({
                ...tareaActualizada,
                fecha: nuevaFecha, // Actualizar la fecha interna de la tarea
                hora: nuevaHora,
                duracion: nuevaDuracion,
                profesional: nuevoProfesional,
                descripcion: nuevaDescripcion
            });
        }
    } else {
        // La fecha no ha cambiado, solo actualizar en el mismo array
        if (tareas[fechaOriginal]) {
            const indiceEncontrado = tareas[fechaOriginal].findIndex(t => t.id === tareaId);
            if (indiceEncontrado !== -1) {
                tareas[fechaOriginal][indiceEncontrado] = {
                    ...tareas[fechaOriginal][indiceEncontrado],
                    hora: nuevaHora,
                    duracion: nuevaDuracion,
                    profesional: nuevoProfesional,
                    descripcion: nuevaDescripcion
                };
            }
        }
    }

    guardarTareas();
    cerrarModales();
    renderizarTodoElCalendarioUI();
    // Vuelve a seleccionar el día para que se refresque el panel de tareas si es la vista de mes
    if (vistaActual === 'mes') {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        // Intentar seleccionar el día actual o el que esté ya seleccionado
        // Si el día estaba seleccionado y está en el mes actual, se re-selecciona
        if (diaSeleccionadoElement && new Date(diaSeleccionadoElement.dataset.date).getMonth() === fechaActual.getMonth() && new Date(diaSeleccionadoElement.dataset.date).getFullYear() === fechaActual.getFullYear()) {
             diaSeleccionadoElement = window.seleccionarDia(new Date(diaSeleccionadoElement.dataset.date), tareas, profesionales, filtroProfesionalSelect.value);
        } else if (new Date(nuevaFecha).getMonth() === fechaActual.getMonth() && new Date(nuevaFecha).getFullYear() === fechaActual.getFullYear()) {
            // Si la tarea editada o movida está en el mes actual, se selecciona ese día
            diaSeleccionadoElement = window.seleccionarDia(new Date(nuevaFecha), tareas, profesionales, filtroProfesionalSelect.value);
        } else {
            // Si no, se selecciona el día de hoy
            diaSeleccionadoElement = window.seleccionarDia(hoy, tareas, profesionales, filtroProfesionalSelect.value);
        }
    }
}

function eliminarTarea() {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        const fecha = tareaSeleccionada.fecha;
        const tareaId = tareaSeleccionada.id;

        if (tareas[fecha]) {
            tareas[fecha] = tareas[fecha].filter(tarea => tarea.id !== tareaId);
            if (tareas[fecha].length === 0) {
                delete tareas[fecha]; // Eliminar la clave de la fecha si no quedan tareas
            }
        }
        guardarTareas();
        cerrarModales();
        renderizarTodoElCalendarioUI();
        // Vuelve a seleccionar el día para que se refresque el panel de tareas si es la vista de mes
        if (vistaActual === 'mes') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            diaSeleccionadoElement = window.seleccionarDia(hoy, tareas, profesionales, filtroProfesionalSelect.value);
        }
    }
}

// --- Funciones de Carga/Guardado de Datos ---

// Función para cargar los profesionales desde un JSON
async function cargarProfesionales() {
    try {
        const response = await fetch('profesionales.json');
        profesionales = await response.json();
        // Llenar los select de profesionales
        [profesionalSelect, editarProfesionalSelect, filtroProfesionalSelect].forEach(select => {
            select.innerHTML = ''; // Limpiar opciones existentes
            // Añadir opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = (select.id === 'profesional' || select.id === 'editar-profesional') ? 'Selecciona un profesional' : 'Todos los profesionales';
            select.appendChild(defaultOption);

            profesionales.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nombre;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error al cargar profesionales:', error);
        profesionales = []; // Inicializar como array vacío si hay error
    }
}

// Función para cargar tareas desde el servidor (o archivo JSON)
async function cargarTareasDelServidor() {
    try {
        const response = await fetch('tareas.json');
        const data = await response.json();
        // Asegurarse de que cada tarea tenga un ID único
        tareas = {}; // Reiniciar tareas para asegurar que IDs nuevos se generen
        Object.keys(data).forEach(fecha => {
            tareas[fecha] = data[fecha].map(tarea => ({ ...tarea, id: tarea.id || generarIdUnicoTarea() }));
        });
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        tareas = {}; // Inicializar como objeto vacío si hay error
    }
}

// Función para guardar tareas (simulada)
async function guardarTareas() {
    try {
        // En un entorno real, enviarías esto a un backend
        console.log("Guardando tareas (simulado)...", JSON.stringify(tareas, null, 2));
        // alert("Tareas guardadas (simulado)!");
    } catch (error) {
        console.error('Error al guardar tareas:', error);
    }
}

// Función para generar un ID único para cada tarea
function generarIdUnicoTarea() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// --- Funciones de Inicialización de UI y Manejo de Modales ---

// Llenar el select de horas
function generarHoras() {
    horaSelect.innerHTML = '';
    editarHoraSelect.innerHTML = '';
    // HORA_INICIO_JORNADA y HORA_FIN_JORNADA vienen de calendar.js (window. porque están expuestas globalmente)
    for (let i = window.HORA_INICIO_JORNADA; i < window.HORA_FIN_JORNADA; i++) {
        const hora = String(i).padStart(2, '0') + ':00';
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        horaSelect.appendChild(option);

        const optionEditar = document.createElement('option');
        optionEditar.value = hora;
        optionEditar.textContent = hora;
        editarHoraSelect.appendChild(optionEditar);
    }
}

// Renderiza toda la UI del calendario (mes, tareas del día, próximas tareas)
function renderizarTodoElCalendarioUI() {
    // Estas funciones ahora reciben los datos necesarios como argumentos
    window.generarCalendario(fechaActual, tareas, profesionales, vistaActual, diaSeleccionadoElement, filtroProfesionalSelect.value);
    window.renderizarProximasTareas(tareas, profesionales, filtroProfesionalSelect.value);

    // Ocultar/mostrar panel de tareas del día según la vista
    if (vistaActual === 'semana' || vistaActual === 'dia') { // Panel de tareas oculto en vista de semana y día
        panelTareas.style.display = 'none';
    } else { // 'mes'
        panelTareas.style.display = 'block';
        // Si estamos en vista de mes y el día seleccionado no es nulo, se re-renderiza el panel de tareas
        if (diaSeleccionadoElement) {
            window.renderizarTareasDelDiaSeleccionado(diaSeleccionadoElement.dataset.date, tareas, profesionales, filtroProfesionalSelect.value);
        } else {
            // Si no hay día seleccionado (ej. al cambiar de semana a mes por primera vez), seleccionar el día actual
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            diaSeleccionadoElement = window.seleccionarDia(hoy, tareas, profesionales, filtroProfesionalSelect.value);
        }
    }
}

// Muestra los detalles de una tarea y permite editar/eliminar
// Esta función debe ser accesible globalmente desde calendar.js
window.mostrarDetallesTarea = function(fecha, tarea) {
    tareaSeleccionada = { fecha: fecha, id: tarea.id }; // Almacenar la tarea seleccionada

    document.getElementById("detalle-fecha").textContent = fecha;
    document.getElementById("detalle-hora").textContent = tarea.hora;
    document.getElementById("detalle-duracion").textContent = tarea.duracion;
    document.getElementById("detalle-profesional").textContent = profesionales.find(p => p.id === tarea.profesional)?.nombre || 'N/A';
    document.getElementById("detalle-descripcion").textContent = tarea.descripcion;

    // Llenar el formulario de edición con los datos de la tarea
    editarFechaInput.value = fecha;
    editarHoraSelect.value = tarea.hora;
    editarDuracionSelect.value = tarea.duracion;
    editarProfesionalSelect.value = tarea.profesional;
    inputEditar.value = tarea.descripcion;

    modalDetalles.style.display = "flex"; // Mostrar el modal de detalles
}

// Cierra el modal de detalles/edición
function cerrarModales() {
    modalDetalles.style.display = "none";
    tareaSeleccionada = null; // Limpiar la tarea seleccionada al cerrar el modal
}

// --- Event Listeners ---

prevMonthBtn.addEventListener("click", () => {
    if (vistaActual === 'mes') {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        diaSeleccionadoElement = null; // Reiniciar la selección de día al cambiar de mes
    } else if (vistaActual === 'semana') {
        fechaActual.setDate(fechaActual.getDate() - 7);
        diaSeleccionadoElement = null; // Reiniciar la selección de día al cambiar de semana
    } else { // vistaActual === 'dia'
        fechaActual.setDate(fechaActual.getDate() - 1);
        dayPicker.value = window.formatearFecha(fechaActual); // Sincronizar dayPicker
    }
    renderizarTodoElCalendarioUI();
});

nextMonthBtn.addEventListener("click", () => {
    if (vistaActual === 'mes') {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        diaSeleccionadoElement = null; // Reiniciar la selección de día al cambiar de mes
    } else if (vistaActual === 'semana') {
        fechaActual.setDate(fechaActual.getDate() + 7);
        diaSeleccionadoElement = null; // Reiniciar la selección de día al cambiar de semana
    } else { // vistaActual === 'dia'
        fechaActual.setDate(fechaActual.getDate() + 1);
        dayPicker.value = window.formatearFecha(fechaActual); // Sincronizar dayPicker
    }
    renderizarTodoElCalendarioUI();
});

formulario.addEventListener("submit", añadirTarea);

filtroProfesionalSelect.addEventListener('change', () => {
    renderizarTodoElCalendarioUI();
    // Si estamos en vista de mes y hay un día seleccionado, refrescar su panel de tareas
    if (vistaActual === 'mes') {
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        // Intentar seleccionar el día actual o el que esté ya seleccionado
        diaSeleccionadoElement = window.seleccionarDia(diaSeleccionadoElement ? new Date(diaSeleccionadoElement.dataset.date) : hoy, tareas, profesionales, filtroProfesionalSelect.value);
    }
});


// Event listeners para los botones de vista
viewMonthBtn.addEventListener('click', () => {
    vistaActual = 'mes';
    viewMonthBtn.classList.add('active');
    viewWeekBtn.classList.remove('active');
    viewDayBtn.classList.remove('active');
    renderizarTodoElCalendarioUI();
});

viewWeekBtn.addEventListener('click', () => {
    vistaActual = 'semana';
    viewMonthBtn.classList.remove('active');
    viewWeekBtn.classList.add('active');
    viewDayBtn.classList.remove('active');
    renderizarTodoElCalendarioUI();
});

viewDayBtn.addEventListener('click', () => {
    vistaActual = 'dia';
    viewMonthBtn.classList.remove('active');
    viewWeekBtn.classList.remove('active');
    viewDayBtn.classList.add('active');
    dayPicker.value = window.formatearFecha(fechaActual);
    renderizarTodoElCalendarioUI();
});

dayPicker.addEventListener('change', (event) => {
    const selectedDate = new Date(event.target.value);
    if (!isNaN(selectedDate.getTime())) { // Comprobar si la fecha es válida
        fechaActual = selectedDate;
        renderizarTodoElCalendarioUI(); // Volver a renderizar en la vista de día
    }
});

function mostrarTareasDelDia(fechaStr, todasLasTareas, todosLosProfesionales, filtroProfesional) {
    console.log("DEBUG: Entrando en mostrarTareasDelDia para:", fechaStr);
    fechaPanelTareas.textContent = fechaStr; // Actualiza la fecha en el título del panel
    listaTareasDia.innerHTML = ''; // Limpiar la lista actual

    const tareasDelDia = todasLasTareas[fechaStr] || [];
    let tareasFiltradas = tareasDelDia;

    if (filtroProfesional) {
        tareasFiltradas = tareasDelDia.filter(tarea => tarea.profesional === filtroProfesional);
    }

    if (tareasFiltradas.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay tareas para este día.';
        listaTareasDia.appendChild(li);
    } else {
        tareasFiltradas.sort((a, b) => {
            const horaA = window.parsearHoraAMinutos(a.hora);
            const horaB = window.parsearHoraAMinutos(b.hora);
            return horaA - horaB;
        });

        tareasFiltradas.forEach((tarea, index) => {
            const li = document.createElement('li');
            const profesionalNombre = window.obtenerProfesionalNombre(tarea.profesional, todosLosProfesionales);
            li.innerHTML = `
                <strong>${tarea.hora}</strong> - ${profesionalNombre}: <span class="math-inline">\{tarea\.descripcion\} \(</span>{tarea.duracion} min)
            `;
            li.addEventListener('click', () => {
                abrirModalEditarTarea(fechaStr, tarea.hora, tarea.profesional, tarea.descripcion, tarea.duracion, index);
            });
            listaTareasDia.appendChild(li);
        });
    }
    console.log("DEBUG: Tareas del día mostradas.");
}


// Event listeners para el modal de detalles/edición
guardarCambiosBtn.addEventListener("click", guardarCambiosTarea);
eliminarTareaBtn.addEventListener("click", eliminarTarea);
cancelarEdicionBtn.addEventListener("click", cerrarModales);
cerrarDetallesBtn.addEventListener("click", cerrarModales);


// --- Carga inicial al cargar la página ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("DEBUG: DOMContentLoaded disparado en script.js"); // Nuevo log
    if (typeof window.generarHoras === 'function') {
        window.generarHoras(); // <--- ¡CAMBIA ESTA LÍNEA!
        console.log("DEBUG: window.generarHoras() ha sido llamada."); // Nuevo log
    } else {
        console.error("DEBUG ERROR: La función generarHoras NO está definida en window. Asegúrate de que calendar.js se carga ANTES de script.js y que la exporta correctamente.");
    }
    // Cargar profesionales primero, luego tareas, y finalmente renderizar todo
    cargarProfesionales().then(() => {
        console.log("DEBUG: Profesionales cargados."); // Nuevo log
        return cargarTareasDelServidor();
    }).then(() => {
        console.log("DEBUG: Tareas cargadas y a punto de renderizar UI."); // Nuevo log
        renderizarTodoElCalendarioUI();
        // Inicializar la fecha en el input de fecha y el dayPicker
        fechaInput.value = window.formatearFecha(new Date());
        dayPicker.value = window.formatearFecha(new Date());

        // Asegurarse de que el botón de vista de mes esté activo por defecto al cargar
        viewMonthBtn.classList.add('active');

        // Seleccionar el día actual al inicio en vista de mes
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        diaSeleccionadoElement = window.seleccionarDia(hoy, tareas, profesionales, filtroProfesionalSelect.value);
        console.log("DEBUG: Inicialización completa del calendario."); // Nuevo log

    }).catch(error => {
        console.error("DEBUG ERROR: Error durante la inicialización:", error);
        alert("Hubo un error al cargar los datos iniciales.");
    });
});