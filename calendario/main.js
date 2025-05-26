// main.js
// Punto de entrada principal de la aplicación.
// Define variables globales y coordina la inicialización.

// --- Variables Globales (expuestas a window si son usadas por otros scripts) ---
window.fechaActual = new Date();
window.tareas = {}; // Objeto para almacenar tareas por fecha: { "YYYY-MM-DD": [tarea1, tarea2] }
window.profesionales = []; // Array para almacenar la lista de profesionales
window.tareaSeleccionada = null; // Para almacenar la tarea que se está viendo/editando en el modal
window.diaSeleccionadoElement = null; // Referencia al elemento DOM del día actualmente seleccionado en la vista de mes
window.vistaActual = 'mes'; // 'mes', 'semana', 'dia'
window.MAX_PROXIMAS_TAREAS = 5; // Número máximo de próximas tareas a mostrar


// --- Elementos del DOM (Solo los que se usan directamente en main.js) ---
// Se declararán con `let` y se asignarán en el DOMContentLoaded para asegurar que existen.
let calendar;
let monthYear;
let prevMonthBtn;
let nextMonthBtn;
let viewMonthBtn;
let viewWeekBtn;
let viewDayBtn;
let dayPicker;
// Este filtro es usado por main.js para coordinar el calendario, por eso está aquí
let filtroProfesionalSelect;


// --- Funciones de Carga de Datos ---

/**
 * Carga las tareas desde tareas.json y las asigna a window.tareas.
 * Maneja casos de archivo no encontrado o JSON inválido.
 */
async function cargarTareas() {
    try {
        const response = await fetch('tareas.json');
        if (!response.ok) {
            console.warn(`tareas.json no encontrado o error: ${response.status}. Inicializando tareas como vacío.`);
            window.tareas = {}; // Aseguramos que sea un objeto vacío
            return;
        }
        const data = await response.json();
        if (typeof data === 'object' && data !== null) {
            window.tareas = data;
        } else {
            console.warn("tareas.json no contiene un objeto JSON válido. Inicializando tareas como vacío.");
            window.tareas = {};
        }
    } catch (error) {
        console.error("Error al cargar tareas.json:", error);
        window.tareas = {}; // Asegura que 'tareas' sea un objeto incluso si hay un error
    }
}

/**
 * Carga los profesionales desde profesionales.json y los asigna a window.profesionales.
 * Rellena un elemento <select> si se proporciona.
 * @param {HTMLSelectElement} [selectElement=null] - El elemento <select> a rellenar.
 * @param {string} [selectedId=null] - El ID del profesional a seleccionar por defecto.
 */
async function cargarProfesionales(selectElement = null, selectedId = null) {
    try {
        const response = await fetch('profesionales.json');
        if (!response.ok) {
            console.warn(`profesionales.json no encontrado o error: ${response.status}.`);
            window.profesionales = []; // Asegura que sea un array vacío
            return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            window.profesionales = data;
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Selecciona un profesional</option>';
                data.forEach(prof => {
                    const option = document.createElement('option');
                    option.value = prof.id;
                    option.textContent = prof.nombre;
                    selectElement.appendChild(option);
                });
                if (selectedId) {
                    selectElement.value = selectedId;
                }
            }
        } else {
            console.warn("profesionales.json no contiene un array JSON válido. Inicializando profesionales como vacío.");
            window.profesionales = [];
        }
    } catch (error) {
        console.error("Error al cargar profesionales.json:", error);
        window.profesionales = []; // Asegura que 'profesionales' sea un array incluso si hay un error
    }
}


/**
 * Guarda el estado actual de las tareas en el servidor (en tareas.json).
 * @param {object} tareasData - El objeto completo de tareas a guardar.
 */
window.guardarTareasEnServidor = async (tareasData) => {
    try {
        const response = await fetch('guardar_tarea.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tareasData) // Envía el objeto completo de tareas
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en la red o servidor: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(`Error del servidor: ${result.message}`);
        }
        console.log("Tareas guardadas exitosamente:", result.message);
    } catch (error) {
        console.error("Error en guardarTareasEnServidor:", error);
        throw error; // Propagar el error para que el llamador pueda manejarlo
    }
};


/**
 * Renderiza todo el calendario y los paneles de tareas basándose en el estado actual.
 * Esta función coordina las vistas de calendar.js y las actualizaciones de script.js.
 * Asegúrate de que las variables globales `tareas`, `profesionales`, `fechaActual`,
 * `vistaActual` y `filtroProfesionalSelect` estén definidas y actualizadas.
 */
window.renderizarTodoElCalendarioUI = () => {
    // Aseguramos que los datos estén cargados antes de renderizar
    if (!window.tareas || !window.profesionales) {
        console.warn("Datos de tareas o profesionales no cargados. Posponiendo renderizado.");
        return; // Salir si los datos no están listos
    }

    // Actualizar el dayPicker para que siempre muestre la fecha actual del calendario
    if (dayPicker) { // Comprobar si el elemento existe
        dayPicker.value = window.formatearFecha(window.fechaActual);
    }

    // Llamar a la función principal de calendar.js para renderizar la vista
    // Asegúrate de que `window.generarCalendario` esté expuesta por calendar.js
    if (typeof window.generarCalendario === 'function') {
        const filtroProfesionalId = filtroProfesionalSelect ? filtroProfesionalSelect.value : '';
        window.generarCalendario(window.fechaActual, window.vistaActual, window.tareas, window.profesionales, filtroProfesionalId);
    } else {
        console.error("La función generarCalendario no está definida en window.");
    }

    // Actualizar el panel de tareas del día
    // Asumiendo que mostrarTareasDelDia está en calendar.js y expuesta
    if (typeof window.mostrarTareasDelDia === 'function') {
        const filtro = filtroProfesionalSelect ? filtroProfesionalSelect.value : '';
        window.mostrarTareasDelDia(window.formatearFecha(window.fechaActual), window.tareas, window.profesionales, filtro);
    } else {
        console.warn("La función mostrarTareasDelDia no está definida en window.");
    }

    // Actualizar el panel de próximas tareas
    // Asumiendo que renderizarProximasTareas está en calendar.js y expuesta
    if (typeof window.renderizarProximasTareas === 'function') {
        window.renderizarProximasTareas(window.tareas, window.profesionales);
    } else {
        console.warn("La función renderizarProximasTareas no está definida en window.");
    }
};


// --- Inicialización de la aplicación ---
document.addEventListener("DOMContentLoaded", async () => {
    // Obtener referencias a los elementos del DOM que se usarán en main.js
    // Estos se declararon con `let` al inicio para poder asignarlos aquí.
    calendar = document.getElementById("calendar");
    monthYear = document.getElementById("monthYear");
    prevMonthBtn = document.getElementById("prevMonth");
    nextMonthBtn = document.getElementById("nextMonth");
    viewMonthBtn = document.getElementById('viewMonth');
    viewWeekBtn = document.getElementById('viewWeek');
    viewDayBtn = document.getElementById('viewDay');
    dayPicker = document.getElementById('dayPicker');
    filtroProfesionalSelect = document.getElementById('filtroProfesional');

    // Obtener referencias a los elementos del formulario de añadir tarea
    // Necesitamos estas referencias aquí para inicializar sus valores o cargar datos.
    const fechaInput = document.getElementById("fecha");
    const horaInput = document.getElementById("hora");
    const duracionSelect = document.getElementById("duracion");
    const profesionalSelect = document.getElementById("profesional");


    // Primero, cargamos los datos ASÍNCRONAMENTE y ESPERAMOS a que terminen.
    await cargarTareas();

    // Ahora que las tareas están cargadas, podemos cargar los profesionales en los selects
    // Aseguramos que los elementos existan antes de pasar a cargarProfesionales
    if (profesionalSelect) {
        await cargarProfesionales(profesionalSelect); // Select de añadir tarea
    }
    // window.editarProfesionalSelect viene de script.js, aseguramos que script.js ya se ejecutó
    if (window.editarProfesionalSelect) {
        await cargarProfesionales(window.editarProfesionalSelect); // Select del modal de edición
    }
    if (filtroProfesionalSelect) {
        await cargarProfesionales(filtroProfesionalSelect); // Select del filtro
    }

    // Una vez que los datos y los selects están cargados, renderizamos la UI
    window.renderizarTodoElCalendarioUI();

    // Inicializar la fecha del formulario de añadir tarea al día actual
    if (fechaInput) {
        fechaInput.value = window.formatearFecha(window.fechaActual);
        // Cargar horas iniciales para el formulario de añadir tarea
        // Aseguramos que los elementos existan y la función sea accesible.
        if (typeof window.cargarHorasDisponibles === 'function' && duracionSelect && profesionalSelect && horaInput) {
            window.cargarHorasDisponibles(fechaInput.value, duracionSelect.value, profesionalSelect.value, horaInput);
        }
    }

    // --- Event Listeners Globales (desde main.js) ---
    // Estos listeners se inicializan DESPUÉS de que los elementos del DOM se han obtenido.

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            window.fechaActual.setMonth(window.fechaActual.getMonth() - 1);
            window.renderizarTodoElCalendarioUI();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            window.fechaActual.setMonth(window.fechaActual.getMonth() + 1);
            window.renderizarTodoElCalendarioUI();
        });
    }

    if (viewMonthBtn) {
        viewMonthBtn.addEventListener('click', () => {
            window.vistaActual = 'mes';
            viewMonthBtn.classList.add('active');
            if (viewWeekBtn) viewWeekBtn.classList.remove('active');
            if (viewDayBtn) viewDayBtn.classList.remove('active');
            window.renderizarTodoElCalendarioUI();
        });
    }

    if (viewWeekBtn) {
        viewWeekBtn.addEventListener('click', () => {
            window.vistaActual = 'semana';
            if (viewMonthBtn) viewMonthBtn.classList.remove('active');
            viewWeekBtn.classList.add('active');
            if (viewDayBtn) viewDayBtn.classList.remove('active');
            window.renderizarTodoElCalendarioUI();
        });
    }

    if (viewDayBtn) {
        viewDayBtn.addEventListener('click', () => {
            window.vistaActual = 'dia';
            if (viewMonthBtn) viewMonthBtn.classList.remove('active');
            if (viewWeekBtn) viewWeekBtn.classList.remove('active');
            viewDayBtn.classList.add('active');
            window.renderizarTodoElCalendarioUI();
        });
    }

    if (dayPicker) {
        dayPicker.addEventListener('change', (event) => {
            const selectedDate = new Date(event.target.value + 'T00:00:00');
            if (!isNaN(selectedDate.getTime())) {
                window.fechaActual = selectedDate;
                window.renderizarTodoElCalendarioUI();
            } else {
                console.error("Fecha inválida seleccionada en el dayPicker.");
            }
        });
    }

    if (filtroProfesionalSelect) {
        filtroProfesionalSelect.addEventListener('change', () => {
            let fechaParaMostrar = window.formatearFecha(window.fechaActual);

            if (window.diaSeleccionadoElement) {
                const diaNumElement = window.diaSeleccionadoElement.querySelector('.dia-numero');
                if (diaNumElement) {
                    const ano = window.fechaActual.getFullYear();
                    const mes = String(window.fechaActual.getMonth() + 1).padStart(2, '0');
                    const dia = String(parseInt(diaNumElement.textContent)).padStart(2, '0');
                    fechaParaMostrar = `${ano}-${mes}-${dia}`;
                }
            }

            if (typeof window.mostrarTareasDelDia === 'function') {
                window.mostrarTareasDelDia(fechaParaMostrar, window.tareas, window.profesionales, filtroProfesionalSelect.value);
            } else {
                console.warn("La función mostrarTareasDelDia no está definida en window.");
            }

            window.renderizarTodoElCalendarioUI();
        });
    }
});