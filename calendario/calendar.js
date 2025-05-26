// calendar.js
// Contiene las funciones de renderizado del calendario (mes, semana, día).
// Utiliza variables globales y funciones de utilidad expuestas por main.js.

// --- Constantes para la jornada laboral y slots (DEFINIDAS SÓLO AQUÍ) ---
const HORA_INICIO_JORNADA = 9; // 9 AM
const HORA_FIN_JORNADA = 18; // 6 PM (hora final exclusiva, es decir, hasta las 17:59)
const INTERVALO_MINUTOS_SLOT = 60; // Intervalos de una hora para los slots (ej. 60 para cada hora, 30 para media hora)


// --- Funciones de utilidad para el calendario (internas, algunas expuestas a window) ---

// Función auxiliar para obtener el inicio de la semana (Lunes)
function getStartOfWeek(date) {
    const d = new Date(date); // Creamos una copia para no modificar la fecha original
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // Calculamos la diferencia de días para llegar al lunes.
    // Si es domingo (0), restamos 6 días para ir al lunes anterior.
    // Si no es domingo, restamos (día_actual - 1) para ir al lunes de esta semana.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
}

// Formatear una fecha a 'YYYY-MM-DD' (Expuesta globalmente para uso en main.js y script.js)
window.formatearFecha = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Parsear una fecha 'YYYY-MM-DD' a un objeto Date (Expuesta globalmente)
window.parsearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Parsear una hora 'HH:MM' a minutos desde la medianoche (Expuesta globalmente)
window.parsearHoraAMinutos = (horaStr) => {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return (horas * 60) + minutos;
};


/**
 * Carga las horas disponibles en un select dado, considerando la fecha, duración y profesional.
 * Ahora esta función vive en calendar.js porque usa HORA_INICIO_JORNADA, etc.
 * @param {string} fecha - La fecha seleccionada (YYYY-MM-DD).
 * @param {number} duracion - La duración de la tarea en minutos.
 * @param {string} profesionalId - El ID del profesional seleccionado.
 * @param {HTMLSelectElement} selectElement - El elemento <select> donde se cargarán las horas.
 * @param {string} [selectedTime=null] - Una hora preseleccionada (HH:MM) si se está editando una tarea.
 */
window.cargarHorasDisponibles = (fecha, duracion, profesionalId, selectElement, selectedTime = null) => {
    const targetSelect = selectElement;

    if (!targetSelect) {
        console.error("Error: el elemento select para las horas disponibles no fue proporcionado o es nulo.");
        return;
    }

    targetSelect.innerHTML = ''; // Limpiar opciones anteriores

    // Si falta algún parámetro, no podemos calcular las horas, añadir una opción por defecto
    if (!fecha || !duracion || !profesionalId) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Selecciona fecha, duración y profesional';
        targetSelect.appendChild(option);
        return;
    }

    const tareasDelDia = window.tareas[fecha] || [];
    const horasOcupadas = new Set(); // Para almacenar las horas ocupadas por el profesional

    // Calcular horas ocupadas por este profesional para este día
    tareasDelDia.forEach(tarea => {
        if (tarea.profesional === profesionalId) {
            const inicioTareaMinutos = window.parsearHoraAMinutos(tarea.hora);
            const finTareaMinutos = inicioTareaMinutos + tarea.duracion;
            // Marcar cada slot de 15 minutos que la tarea ocupa
            for (let m = inicioTareaMinutos; m < finTareaMinutos; m += 15) { // Usamos 15 min como granularidad
                horasOcupadas.add(m);
            }
        }
    });

    // Generar slots de horas disponibles
    let horasGeneradas = false;
    for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
        for (let m = 0; m < 60; m += 15) { // Slots cada 15 minutos
            const slotMinutos = h * 60 + m;
            const finSlotMinutos = slotMinutos + parseInt(duracion); // Asegurarse de que duracion es número

            // Asegurarse de que el slot no excede el fin de la jornada
            if (finSlotMinutos > HORA_FIN_JORNADA * 60) {
                continue;
            }

            let disponible = true;
            // Verificar si algún segmento del slot requerido está ocupado
            for (let i = slotMinutos; i < finSlotMinutos; i += 15) {
                if (horasOcupadas.has(i)) {
                    disponible = false;
                    break;
                }
            }

            if (disponible) {
                const horaStr = String(h).padStart(2, '0');
                const minutoStr = String(m).padStart(2, '0');
                const tiempoSlot = `${horaStr}:${minutoStr}`;

                const option = document.createElement('option');
                option.value = tiempoSlot;
                option.textContent = tiempoSlot;
                targetSelect.appendChild(option);
                horasGeneradas = true;
            }
        }
    }

    if (!horasGeneradas) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay horas disponibles para esta combinación.';
        targetSelect.appendChild(option);
    }

    // Seleccionar la hora previamente seleccionada si existe
    if (selectedTime) {
        targetSelect.value = selectedTime;
    } else {
        // Si no hay ninguna hora seleccionada, intentar seleccionar la primera disponible
        if (targetSelect.options.length > 0) {
            targetSelect.value = targetSelect.options[0].value;
        }
    }
};


/**
 * Renderiza los slots de tiempo para la vista de semana o día.
 * @param {HTMLElement} container - El contenedor donde se añadirán los slots.
 * @param {string} view - La vista actual ('semana' o 'dia').
 */
function renderizarTimeSlots(container, view) {
    // Limpiar el contenedor
    container.innerHTML = '';
    container.classList.add('calendar-time-slots-grid');

    // Añadir celda vacía para la esquina superior izquierda
    const cornerDiv = document.createElement('div');
    container.appendChild(cornerDiv); // Celda vacía para la columna de la hora

    // Añadir cabeceras de días (solo si es vista de semana)
    if (view === 'semana') {
        // En la vista de semana, las cabeceras de los días se renderizan en otro lugar.
        // Aquí solo necesitamos asegurarnos de que la cuadrícula se alinee correctamente.
        // Esto puede depender de cómo estén estructurados tus CSS.
        // Si tienes 7 columnas para los días, la primera es para las horas.
    } else if (view === 'dia') {
        // Para la vista de día, también es 1 columna para el día más la de las horas.
    }


    // Generar las horas del día
    for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
        // Celda para la hora (columna izquierda)
        const timeHeader = document.createElement('div');
        timeHeader.classList.add('time-slot-header');
        const hour = String(h).padStart(2, '0');
        timeHeader.textContent = `${hour}:00`;
        container.appendChild(timeHeader);

        // Añadir una celda vacía para cada día de la semana o para el día único.
        // Esto es para que las tareas se puedan posicionar absolutamente dentro de ellas.
        // Para la vista de semana, necesitas 7 de estas por cada hora.
        const numColumns = view === 'semana' ? 7 : 1;
        for (let i = 0; i < numColumns; i++) {
            const slot = document.createElement('div');
            slot.classList.add('time-slot');
            container.appendChild(slot);
        }
    }
}


/**
 * Renderiza las tareas para la vista de día/semana.
 * @param {HTMLElement} container - El contenedor de la vista.
 * @param {Date} fechaInicio - La fecha de inicio de la vista (para semana, es el lunes; para día, es el día).
 * @param {string} view - La vista actual ('semana' o 'dia').
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 * @param {string} filtroProfesionalId - El ID del profesional para filtrar.
 */
function renderizarTareasEnVista(container, fechaInicio, view, tareas, profesionales, filtroProfesionalId) {
    const diasEnVista = view === 'semana' ? 7 : 1;
    const columnaHoraAncho = 40; // Ancho de la columna de las horas en px (ajusta a tu CSS)
    const slotHeight = 60; // Altura de un slot de 60 minutos en px (ajusta a tu CSS)

    // Ajusta esto si tu slotHeight en CSS es diferente o si es dinámico.
    // Por ejemplo, si tienes --slot-height en CSS.
    // Puedes intentar leer el valor de una variable CSS si es necesario:
    // const rootStyles = getComputedStyle(document.documentElement);
    // const slotHeight = parseFloat(rootStyles.getPropertyValue('--slot-height'));

    for (let i = 0; i < diasEnVista; i++) {
        const currentDay = new Date(fechaInicio);
        currentDay.setDate(fechaInicio.getDate() + i);
        const fechaStr = window.formatearFecha(currentDay);
        const tareasDelDia = tareas[fechaStr] || [];

        // Filtrar tareas por profesional si hay filtro
        const tareasFiltradas = filtroProfesionalId
            ? tareasDelDia.filter(tarea => tarea.profesional === filtroProfesionalId)
            : tareasDelDia;

        tareasFiltradas.forEach((tarea, tareaIndex) => {
            const inicioTareaMinutos = window.parsearHoraAMinutos(tarea.hora);
            const duracionMinutos = tarea.duracion;

            // Calcular posición y tamaño
            const topPx = ((inicioTareaMinutos - (HORA_INICIO_JORNADA * 60)) / 60) * slotHeight;
            const heightPx = (duracionMinutos / 60) * slotHeight;

            const tareaDiv = document.createElement('div');
            tareaDiv.classList.add('task-event');
            tareaDiv.style.position = 'absolute';
            tareaDiv.style.top = `${topPx}px`;
            tareaDiv.style.height = `${heightPx}px`;
            tareaDiv.style.width = 'calc(100% - 5px)'; // Un poco menos para padding/margen

            // Calcular la columna donde va la tarea
            const columnIndex = i + 1; // +1 porque la primera columna es para las horas
            tareaDiv.style.gridColumn = columnIndex;
            tareaDiv.style.gridRow = `${Math.floor((inicioTareaMinutos - (HORA_INICIO_JORNADA * 60)) / INTERVALO_MINUTOS_SLOT) + 1} / span ${Math.ceil(duracionMinutos / INTERVALO_MINUTOS_SLOT)}`;


            const profesionalObj = profesionales.find(p => p.id === tarea.profesional);
            const profesionalNombre = profesionalObj ? profesionalObj.nombre : "Desconocido";

            tareaDiv.innerHTML = `
                <span class="task-time">${tarea.hora} - ${window.formatearHoraAMinutos(tarea.hora) + tarea.duracion < HORA_FIN_JORNADA * 60 ? `${String(Math.floor((window.parsearHoraAMinutos(tarea.hora) + tarea.duracion) / 60)).padStart(2, '0')}:${String((window.parsearHoraAMinutos(tarea.hora) + tarea.duracion) % 60).padStart(2, '0')}` : 'Fin'}</span>
                <span class="task-description">${tarea.descripcion}</span>
                <span class="task-profesional">${profesionalNombre}</span>
            `;
            // Añadir el listener para abrir el modal al hacer clic en la tarea
            tareaDiv.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el clic se propague al día del calendario
                if (typeof window.mostrarDetallesTarea === 'function') {
                    window.mostrarDetallesTarea(fechaStr, tarea, tareaIndex);
                } else {
                    console.error("La función mostrarDetallesTarea no está disponible.");
                }
            });
            container.appendChild(tareaDiv);
        });
    }
}


/**
 * Renderiza la vista de mes del calendario.
 * @param {Date} fecha - La fecha actual del calendario.
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 * @param {string} filtroProfesionalId - El ID del profesional para filtrar.
 */
function renderizarVistaMes(fecha, tareas, profesionales, filtroProfesionalId) {
    const calendar = document.getElementById("calendar");
    const monthYearElement = document.getElementById("monthYear");
    const dayPicker = document.getElementById('dayPicker'); // Asegurarse de que se obtenga aquí también

    if (!calendar || !monthYearElement || !dayPicker) {
        console.error("Elementos del DOM del calendario no encontrados para la vista de mes.");
        return;
    }

    calendar.innerHTML = ''; // Limpiar el calendario
    calendar.classList.remove('calendar-week', 'calendar-day'); // Limpiar clases de otras vistas
    calendar.classList.add('calendar-month'); // Añadir clase de vista de mes

    const year = fecha.getFullYear();
    const month = fecha.getMonth(); // 0-indexed

    monthYearElement.textContent = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calcular el día de la semana del primer día del mes (0=Domingo, 1=Lunes)
    // Para que el lunes sea el primer día de la semana, ajustamos:
    // Si es domingo (0), queremos que sea el 6to día (para restar 6 y llegar al lunes anterior)
    // Si es lunes (1), queremos que sea el 0mo día (para restar 0 y empezar en el lunes)
    const startDay = (firstDayOfMonth.getDay() === 0) ? 6 : firstDayOfMonth.getDay() - 1; // 0=Lunes, 1=Martes... 6=Domingo

    // Días de la semana (Lunes a Domingo)
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Rellenar días del mes anterior si es necesario
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day', 'inactive');
        dayDiv.textContent = prevMonthLastDay - i;
        calendar.appendChild(dayDiv);
    }

    // Rellenar días del mes actual
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = i;

        const currentDay = new Date(year, month, i);
        const fechaStr = window.formatearFecha(currentDay);

        // Marcar el día actual
        if (currentDay.toDateString() === window.fechaActual.toDateString()) {
            dayDiv.classList.add('hoy');
            if (window.diaSeleccionadoElement) { // Limpiar selección anterior
                 window.diaSeleccionadoElement.classList.remove('dia-seleccionado');
            }
            dayDiv.classList.add('dia-seleccionado');
            window.diaSeleccionadoElement = dayDiv; // Actualizar el elemento del día seleccionado
        }

        // Marcar días con tareas
        if (tareas[fechaStr]) {
            // Filtrar las tareas por el profesional si hay filtro
            const tareasFiltradas = filtroProfesionalId
                ? tareas[fechaStr].filter(t => t.profesional === filtroProfesionalId)
                : tareas[fechaStr];

            if (tareasFiltradas.length > 0) {
                const badge = document.createElement('span');
                badge.classList.add('task-badge');
                badge.textContent = tareasFiltradas.length;
                dayDiv.appendChild(badge);
            }
        }

        // Evento para seleccionar un día
        dayDiv.addEventListener('click', () => {
            // Eliminar clase de selección del día anterior
            if (window.diaSeleccionadoElement) {
                window.diaSeleccionadoElement.classList.remove('dia-seleccionado');
            }
            dayDiv.classList.add('dia-seleccionado');
            window.diaSeleccionadoElement = dayDiv; // Guardar el nuevo elemento seleccionado

            // Actualizar la fecha actual del calendario y mostrar tareas del día
            window.fechaActual.setDate(i);
            window.fechaActual.setMonth(month);
            window.fechaActual.setFullYear(year);

            // Asegurarse de que el dayPicker se actualiza
            dayPicker.value = window.formatearFecha(window.fechaActual);

            window.mostrarTareasDelDia(fechaStr, tareas, profesionales, filtroProfesionalId);
        });

        calendar.appendChild(dayDiv);
    }

    // Rellenar días del mes siguiente si es necesario
    const totalCells = startDay + lastDayOfMonth.getDate();
    const remainingCells = 42 - totalCells; // 6 semanas * 7 días
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day', 'inactive');
        dayDiv.textContent = i;
        calendar.appendChild(dayDiv);
    }
}


/**
 * Renderiza la vista de semana del calendario.
 * @param {Date} fecha - La fecha actual (usada para determinar la semana).
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 * @param {string} filtroProfesionalId - El ID del profesional para filtrar.
 */
function renderizarVistaSemana(fecha, tareas, profesionales, filtroProfesionalId) {
    const calendar = document.getElementById("calendar");
    const monthYearElement = document.getElementById("monthYear"); // No visible en vista semana
    const dayPicker = document.getElementById('dayPicker');

    if (!calendar || !monthYearElement || !dayPicker) {
        console.error("Elementos del DOM del calendario no encontrados para la vista de semana.");
        return;
    }

    calendar.innerHTML = '';
    calendar.classList.remove('calendar-month', 'calendar-day');
    calendar.classList.add('calendar-week');

    monthYearElement.classList.add('no-display'); // Ocultar el título de mes/año

    const startOfWeek = getStartOfWeek(fecha);

    // Cabeceras de días (Lunes a Domingo)
    const weekHeaders = document.createElement('div');
    weekHeaders.classList.add('calendar-week-headers');
    weekHeaders.innerHTML = '<div class="time-header-corner"></div>'; // Esquina para la columna de la hora

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dayHeaderDiv = document.createElement('div');
        dayHeaderDiv.classList.add('dia-semana-completo');

        // Marcar el día actual
        if (currentDay.toDateString() === window.fechaActual.toDateString()) {
            dayHeaderDiv.classList.add('hoy');
        }

        dayHeaderDiv.innerHTML = `
            <span class="nombre-dia">${currentDay.toLocaleString('es-ES', { weekday: 'long' })}</span>
            <span class="dia-numero">${currentDay.getDate()}</span>
            ${currentDay.toDateString() === new Date().toDateString() ? '<span class="hoy-text">Hoy</span>' : ''}
        `;
        weekHeaders.appendChild(dayHeaderDiv);

        // Evento para seleccionar un día en la cabecera de la semana
        dayHeaderDiv.addEventListener('click', () => {
            // Aquí puedes cambiar a la vista de día para la fecha seleccionada
            window.fechaActual = currentDay; // Actualizar la fecha actual
            window.vistaActual = 'dia'; // Cambiar a vista de día
            // Resetear clases de botones de vista para reflejar el cambio
            document.getElementById('viewMonth').classList.remove('active');
            document.getElementById('viewWeek').classList.remove('active');
            document.getElementById('viewDay').classList.add('active');
            window.renderizarTodoElCalendarioUI(); // Volver a renderizar
        });
    }
    calendar.appendChild(weekHeaders);

    // Renderizar slots de tiempo y tareas
    const timeSlotsContainer = document.createElement('div');
    timeSlotsContainer.classList.add('calendar-time-slots-grid'); // Contenedor para slots y tareas
    renderizarTimeSlots(timeSlotsContainer, 'semana'); // Añade los divisores de hora y los "slots" donde irán las tareas
    renderizarTareasEnVista(timeSlotsContainer, startOfWeek, 'semana', tareas, profesionales, filtroProfesionalId);
    calendar.appendChild(timeSlotsContainer);

    // Asegurarse de que el día seleccionado en el panel de tareas sea el primer día de la semana
    // o el día que ya estaba seleccionado si cae dentro de esta semana.
    // Para simplificar, actualizaremos el panel de tareas con el día actual si no hay día seleccionado
    // o el primer día de la semana si no se ha seleccionado nada.
    window.mostrarTareasDelDia(window.formatearFecha(window.fechaActual), tareas, profesionales, filtroProfesionalId);
}


/**
 * Renderiza la vista de día del calendario.
 * @param {Date} fecha - La fecha del día a renderizar.
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 * @param {string} filtroProfesionalId - El ID del profesional para filtrar.
 */
function renderizarVistaDia(fecha, tareas, profesionales, filtroProfesionalId) {
    const calendar = document.getElementById("calendar");
    const monthYearElement = document.getElementById("monthYear");
    const dayPicker = document.getElementById('dayPicker');

    if (!calendar || !monthYearElement || !dayPicker) {
        console.error("Elementos del DOM del calendario no encontrados para la vista de día.");
        return;
    }

    calendar.innerHTML = '';
    calendar.classList.remove('calendar-month', 'calendar-week');
    calendar.classList.add('calendar-day');

    monthYearElement.classList.add('no-display'); // Ocultar el título de mes/año

    // Cabecera del día único
    const dayHeaderDiv = document.createElement('div');
    dayHeaderDiv.classList.add('calendar-day-header-single');
    dayHeaderDiv.innerHTML = '<div class="time-header-corner"></div>'; // Esquina para la columna de la hora

    const currentDay = new Date(fecha);
    const dayContentDiv = document.createElement('div');
    dayContentDiv.classList.add('dia-semana-completo');

    // Marcar el día actual
    if (currentDay.toDateString() === new Date().toDateString()) {
        dayContentDiv.classList.add('hoy');
    }

    dayContentDiv.innerHTML = `
        <span class="nombre-dia">${currentDay.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        ${currentDay.toDateString() === new Date().toDateString() ? '<span class="hoy-text">Hoy</span>' : ''}
    `;
    dayHeaderDiv.appendChild(dayContentDiv);
    calendar.appendChild(dayHeaderDiv);

    // Renderizar slots de tiempo y tareas
    const timeSlotsContainer = document.createElement('div');
    timeSlotsContainer.classList.add('calendar-time-slots-grid');
    renderizarTimeSlots(timeSlotsContainer, 'dia');
    renderizarTareasEnVista(timeSlotsContainer, fecha, 'dia', tareas, profesionales, filtroProfesionalId);
    calendar.appendChild(timeSlotsContainer);

    // Asegurarse de que el panel de tareas muestre las tareas de este día
    window.mostrarTareasDelDia(window.formatearFecha(fecha), tareas, profesionales, filtroProfesionalId);
}


/**
 * Muestra las tareas para un día específico en el panel lateral.
 * @param {string} fechaStr - La fecha del día a mostrar (YYYY-MM-DD).
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 * @param {string} filtroProfesionalId - El ID del profesional para filtrar.
 */
window.mostrarTareasDelDia = (fechaStr, tareas, profesionales, filtroProfesionalId) => {
    const fechaPanelTareas = document.getElementById("fecha-panel-tareas");
    const listaTareas = document.getElementById("lista-tareas");

    if (!fechaPanelTareas || !listaTareas) {
        console.error("Elementos del DOM del panel de tareas no encontrados.");
        return;
    }

    const fechaObj = window.parsearFecha(fechaStr);
    fechaPanelTareas.textContent = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaTareas.innerHTML = ''; // Limpiar la lista de tareas

    const tareasDelDia = tareas[fechaStr] || [];

    // Filtrar tareas por profesional si hay filtro
    const tareasFiltradas = filtroProfesionalId
        ? tareasDelDia.filter(tarea => tarea.profesional === filtroProfesionalId)
        : tareasDelDia;

    if (tareasFiltradas.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay tareas para este día.';
        listaTareas.appendChild(li);
        return;
    }

    // Ordenar tareas por hora
    tareasFiltradas.sort((a, b) => {
        const horaA = window.parsearHoraAMinutos(a.hora);
        const horaB = window.parsearHoraAMinutos(b.hora);
        return horaA - horaB;
    });

    tareasFiltradas.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.classList.add('tarea-item');
        const profesionalObj = profesionales.find(p => p.id === tarea.profesional);
        const profesionalNombre = profesionalObj ? profesionalObj.nombre : "Desconocido";

        li.innerHTML = `
            <span>${tarea.hora} - ${profesionalNombre}</span>
            <span class="descripcion-tarea">${tarea.descripcion}</span>
        `;
        li.addEventListener('click', () => {
            if (typeof window.mostrarDetallesTarea === 'function') {
                window.mostrarDetallesTarea(fechaStr, tarea, index);
            } else {
                console.error("La función mostrarDetallesTarea no está disponible.");
            }
        });
        listaTareas.appendChild(li);
    });
};

/**
 * Renderiza las próximas tareas en el panel lateral.
 * @param {object} tareas - El objeto completo de tareas.
 * @param {Array} profesionales - El array de profesionales.
 */
window.renderizarProximasTareas = (tareas, profesionales) => {
    const listaProximasTareas = document.getElementById("lista-proximas-tareas");
    if (!listaProximasTareas) {
        console.error("Elemento DOM de próximas tareas no encontrado.");
        return;
    }
    listaProximasTareas.innerHTML = ''; // Limpiar la lista

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer a medianoche para comparaciones de fecha

    let todasLasTareasFuturas = [];

    for (const fechaStr in tareas) {
        const fechaTarea = window.parsearFecha(fechaStr);
        fechaTarea.setHours(0, 0, 0, 0); // Alinear a medianoche

        // Incluir tareas de hoy que aún no han pasado
        // O tareas de fechas futuras
        if (fechaTarea >= hoy) {
            tareas[fechaStr].forEach(tarea => {
                const [hora, minuto] = tarea.hora.split(':').map(Number);
                const fechaHoraTarea = new Date(fechaTarea.getFullYear(), fechaTarea.getMonth(), fechaTarea.getDate(), hora, minuto);

                // Si la tarea es hoy, verificar que no haya pasado ya
                if (fechaTarea.toDateString() === hoy.toDateString()) {
                    if (fechaHoraTarea > new Date()) { // Si la hora de la tarea es en el futuro
                        todasLasTareasFuturas.push({ fecha: fechaStr, ...tarea });
                    }
                } else {
                    // Si la tarea es en un día futuro, siempre se añade
                    todasLasTareasFuturas.push({ fecha: fechaStr, ...tarea });
                }
            });
        }
    }

    // Ordenar todas las tareas futuras cronológicamente
    todasLasTareasFuturas.sort((a, b) => {
        const fechaA = window.parsearFecha(a.fecha);
        const fechaB = window.parsearFecha(b.fecha);

        if (fechaA.getTime() !== fechaB.getTime()) {
            return fechaA.getTime() - fechaB.getTime();
        }

        const horaA = window.parsearHoraAMinutos(a.hora);
        const horaB = window.parsearHoraAMinutos(b.hora);
        return horaA - horaB;
    });

    // Mostrar solo un número limitado de próximas tareas
    const tareasAMostrar = todasLasTareasFuturas.slice(0, window.MAX_PROXIMAS_TAREAS); // MAX_PROXIMAS_TAREAS viene de main.js

    if (tareasAMostrar.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay próximas tareas.';
        listaProximasTareas.appendChild(li);
        return;
    }

    tareasAMostrar.forEach(tarea => {
        const li = document.createElement('li');
        li.classList.add('proxima-tarea-item');
        const profesionalObj = profesionales.find(p => p.id === tarea.profesional);
        const profesionalNombre = profesionalObj ? profesionalObj.nombre : "Desconocido";

        const fechaDisplay = new Date(tarea.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

        li.innerHTML = `
            <span class="proxima-tarea-fecha">${fechaDisplay}</span>
            <span class="proxima-tarea-hora">${tarea.hora}</span>
            <span class="proxima-tarea-profesional">${profesionalNombre}</span>
            <span class="proxima-tarea-descripcion">${tarea.descripcion}</span>
        `;
        listaProximasTareas.appendChild(li);
    });
};


// Exportar las funciones principales para que main.js pueda usarlas
window.generarCalendario = (fecha, vista, tareas, profesionales, filtroProfesionalId) => {
    const monthYearElement = document.getElementById("monthYear");
    // Asegurarse de que el elemento existe antes de manipularlo
    if (monthYearElement) {
        if (vista === 'mes') {
            monthYearElement.classList.remove('no-display'); // Asegurarse de que el título se muestre en vista mes
        } else {
            monthYearElement.classList.add('no-display'); // Ocultar el título en otras vistas
        }
    }

    // Resetear clases del contenedor principal del calendario para evitar conflictos
    const calendarContainer = document.getElementById("calendar");
    if (calendarContainer) {
        calendarContainer.className = ''; // Limpiar todas las clases para aplicar las nuevas
    }


    if (vista === 'mes') {
        renderizarVistaMes(fecha, tareas, profesionales, filtroProfesionalId);
    } else if (vista === 'semana') {
        renderizarVistaSemana(fecha, tareas, profesionales, filtroProfesionalId);
    } else if (vista === 'dia') {
        renderizarVistaDia(fecha, tareas, profesionales, filtroProfesionalId);
    }
};

// Otras funciones ya están expuestas directamente a `window` o son internas.