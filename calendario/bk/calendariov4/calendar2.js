// calendar.js
console.log("calendar.js cargado");

// --- Constantes para la jornada laboral y slots ---
const HORA_INICIO_JORNADA = 9; // 9 AM
const HORA_FIN_JORNADA = 18; // 6 PM (hora final exclusiva, es decir, hasta las 17:59)
const INTERVALO_MINUTOS = 60; // Intervalos de una hora para los slots (ej. 60 para cada hora, 30 para media hora)

// Convierte una cadena de hora "HH:MM" a minutos desde la medianoche
function parsearHoraAMinutos(horaStr) {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas * 60 + minutos;
}

// Formatear fecha a YYYY-MM-DD
function formatearFecha(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `<span class="math-inline">\{year\}\-</span>{month}-${day}`;
}

// Función auxiliar para obtener el nombre del profesional por su ID
function obtenerProfesionalNombre(profesionalId, allProfessionals) {
    const profesional = allProfessionals.find(p => p.id === profesionalId);
    return profesional ? profesional.nombre : 'Desconocido';
}

// Función para generar las horas en los selectores de hora
function generarHoras() {
    console.log("DEBUG: Entrando en generarHoras()..."); // ESTE LOG
    console.log(`DEBUG: HORA_INICIO_JORNADA: ${HORA_INICIO_JORNADA}`); // ESTE LOG
    console.log(`DEBUG: HORA_FIN_JORNADA: ${HORA_FIN_JORNADA}`); // ESTE LOG
    console.log(`DEBUG: INTERVALO_MINUTOS: ${INTERVALO_MINUTOS}`); // ESTE LOG


    const horaSelects = [
        document.getElementById("hora"), // Selector del formulario principal
        document.getElementById("editar-hora") // Selector del modal de edición
    ];

    console.log("DEBUG: Selectores encontrados:", horaSelects); // ESTE LOG

    horaSelects.forEach((select, index) => {
        if (select) { // Asegurarse de que el elemento existe
            select.innerHTML = ""; // Limpiar opciones existentes
            let optionVacia = document.createElement("option");
            optionVacia.value = "";
            optionVacia.textContent = "Selecciona una hora";
            optionVacia.disabled = true;
            optionVacia.selected = true;
            select.appendChild(optionVacia);
            console.log(`DEBUG: Selector ${index} (ID: ${select.id}) encontrado y primera opción añadida.`); // ESTE LOG
        } else {
            console.warn(`DEBUG: Selector ${index} no encontrado en el DOM.`); // ESTE LOG
        }
    });

    if (HORA_INICIO_JORNADA >= HORA_FIN_JORNADA || INTERVALO_MINUTOS <= 0) {
        console.error("DEBUG: Las constantes de tiempo son inválidas. Revisa HORA_INICIO_JORNADA, HORA_FIN_JORNADA, INTERVALO_MINUTOS."); // ESTE LOG
        return; // Salir de la función si las constantes no son válidas
    }


    for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
        for (let m = 0; m < 60; m += INTERVALO_MINUTOS) {
            const hora = String(h).padStart(2, "0");
            const minutos = String(m).padStart(2, "0");
            const tiempo = `<span class="math-inline">\{hora\}\:</span>{minutos}`;

            horaSelects.forEach(select => {
                if (select) {
                    let option = document.createElement("option");
                    option.value = tiempo;
                    option.textContent = tiempo;
                    select.appendChild(option);
                }
            });
        }
    }
    console.log("DEBUG: Finalizado generarHoras(). Comprueba los desplegables."); // ESTE LOG
}

// Función principal para generar y renderizar el calendario
function generarCalendario(currentDate, allTasks, allProfessionals, currentView, selectedDayElementRef, filtroProfesionalId) {
    const calendar = document.getElementById("calendar");
    const monthYear = document.getElementById("monthYear");
    const panelTareas = document.getElementById("panel-tareas");
    const dayPicker = document.getElementById('day-picker-input');

    const fechaParaDia = new Date(currentDate);

    monthYear.textContent = currentDate.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
    });

    calendar.innerHTML = ""; // Limpiar el calendario antes de renderizar

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día para comparación

    // Añadir nombres de los días de la semana
    if (currentView === 'mes' || currentView === 'semana') {
        const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        nombresDias.forEach(nombre => {
            const div = document.createElement("div");
            div.classList.add("nombre-dia");
            div.textContent = nombre;
            calendar.appendChild(div);
        });
    }

    if (currentView === 'mes') {
        calendar.classList.add('calendar-month-view');
        calendar.classList.remove('calendar-week-view', 'calendar-day-view');
        panelTareas.style.display = 'block'; // Mostrar el panel de tareas en vista de mes

        const primerDiaMes = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const ultimoDiaMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const diasEnMes = ultimoDiaMes.getDate();

        const primerDiaSemana = primerDiaMes.getDay();

        const mesAnteriorUltimoDia = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        for (let i = primerDiaSemana - 1; i >= 0; i--) {
            const div = document.createElement("div");
            div.classList.add("dia", "disabled");
            div.textContent = mesAnteriorUltimoDia - i;
            calendar.appendChild(div);
        }

        for (let i = 1; i <= diasEnMes; i++) {
            const diaFecha = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const diaFechaStr = formatearFecha(diaFecha);
            const div = document.createElement("div");
            div.classList.add("dia");
            div.dataset.date = diaFechaStr;

            const numeroDiaSpan = document.createElement("span");
            numeroDiaSpan.classList.add("dia-numero");
            numeroDiaSpan.textContent = i;

            if (diaFechaStr === formatearFecha(hoy)) {
                div.classList.add("hoy");
                const hoyText = document.createElement("span");
                hoyText.classList.add("hoy-text");
                hoyText.textContent = "Hoy";
                numeroDiaSpan.appendChild(hoyText);
            }
            div.appendChild(numeroDiaSpan);

            const tareasDelDia = allTasks[diaFechaStr];
            if (tareasDelDia && tareasDelDia.length > 0) {
                const tareasFiltradas = filtroProfesionalId ?
                    tareasDelDia.filter(t => t.profesional === filtroProfesionalId) :
                    tareasDelDia;
                if (tareasFiltradas.length > 0) {
                    const indicador = document.createElement("div");
                    indicador.classList.add("indicador-tarea");
                    div.appendChild(indicador);
                }
            }

            // CAMBIO: Asegurarse de que el click en el día pasa el elemento y no solo la fecha string
            div.addEventListener('click', () => {
                window.seleccionarDia(diaFecha, allTasks, allProfessionals, filtroProfesionalId);
            });

            calendar.appendChild(div);
        }

        const totalCeldas = primerDiaSemana + diasEnMes;
        const celdasFaltantes = 42 - totalCeldas;
        for (let i = 1; i <= celdasFaltantes; i++) {
            const div = document.createElement("div");
            div.classList.add("dia", "disabled");
            div.textContent = i;
            calendar.appendChild(div);
        }

    } else if (currentView === 'semana') {
        calendar.classList.add('calendar-week-view');
        calendar.classList.remove('calendar-month-view', 'calendar-day-view');
        panelTareas.style.display = 'none';

        const inicioSemana = window.getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const diaIteracion = new Date(inicioSemana);
            diaIteracion.setDate(inicioSemana.getDate() + i);
            const diaFechaStr = formatearFecha(diaIteracion);

            const diaColumna = document.createElement("div");
            diaColumna.classList.add("dia-semana-completo");
            diaColumna.dataset.date = diaFechaStr;

            if (diaFechaStr === formatearFecha(hoy)) {
                diaColumna.classList.add("hoy");
            }

            const diaHeader = document.createElement("div");
            diaHeader.classList.add("dia-semana-header");

            const nombreDia = diaIteracion.toLocaleString("es-ES", { weekday: 'short' });
            const numeroDia = diaIteracion.getDate();

            diaHeader.innerHTML = `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)} <span class="dia-numero">${numeroDia}</span>`;
            if (diaFechaStr === formatearFecha(hoy)) {
                diaHeader.innerHTML += ` <span class="hoy-text">Hoy</span>`;
            }
            diaColumna.appendChild(diaHeader);

            const jornadaContainer = document.createElement("div");
            jornadaContainer.classList.add("jornada-container");

            for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
                const hora = h.toString().padStart(2, '0') + ":00";
                const horaSlot = document.createElement("div");
                horaSlot.classList.add("hora-slot-semana");
                horaSlot.dataset.hora = hora;
                horaSlot.dataset.date = diaFechaStr; // CAMBIO: Añadir fecha al slot

                const horaLabel = document.createElement("div");
                horaLabel.classList.add("hora-label-semana");
                horaLabel.textContent = hora;
                horaSlot.appendChild(horaLabel);

                const tareasHoraContainer = document.createElement("div");
                tareasHoraContainer.classList.add("tareas-hora-container-semana");
                horaSlot.appendChild(tareasHoraContainer);

                const tareasDelDia = allTasks[diaFechaStr] || [];
                tareasDelDia.forEach((tarea, index) => {
                    const [tareaHoraStr, tareaMinStr] = tarea.hora.split(':');
                    const tareaHora = parseInt(tareaHoraStr);
                    const tareaMinutos = parseInt(tareaMinStr);
                    const duracionMinutos = tarea.duracion;

                    const inicioSlot = h * 60;
                    const finSlot = (h + (INTERVALO_MINUTOS / 60)) * 60;
                    const inicioTarea = tareaHora * 60 + tareaMinutos;
                    const finTarea = inicioTarea + duracionMinutos;

                    if (
                        (inicioTarea >= inicioSlot && inicioTarea < finSlot) ||
                        (finTarea > inicioSlot && finTarea <= finSlot) ||
                        (inicioTarea < inicioSlot && finTarea > finSlot)
                    ) {
                        if (!filtroProfesionalId || tarea.profesional === filtroProfesionalId) {
                            const tareaCard = document.createElement("div");
                            tareaCard.classList.add("tarea-card-semana");
                            tareaCard.innerHTML = `
                                <p><strong>${tarea.hora}</strong> - ${obtenerProfesionalNombre(tarea.profesional, allProfessionals)}</p>
                                <p class="tarea-descripcion">${tarea.descripcion}</p>
                                <p class="duracion-text">${tarea.duracion} min</p>
                            `;
                            // CAMBIO: Almacenar datos para el modal
                            tareaCard.dataset.fecha = diaFechaStr;
                            tareaCard.dataset.hora = tarea.hora;
                            tareaCard.dataset.profesional = tarea.profesional;
                            tareaCard.dataset.descripcion = tarea.descripcion;
                            tareaCard.dataset.duracion = tarea.duracion;
                            tareaCard.dataset.indice = index;

                            // CAMBIO: Event Listener para abrir el modal
                            tareaCard.addEventListener('click', (event) => {
                                event.stopPropagation(); // Evitar que el clic en la tarjeta propague al slot o al día
                                window.abrirModalEditarTarea(
                                    tareaCard.dataset.fecha,
                                    tareaCard.dataset.hora,
                                    tareaCard.dataset.profesional,
                                    tareaCard.dataset.descripcion,
                                    parseInt(tareaCard.dataset.duracion),
                                    parseInt(tareaCard.dataset.indice)
                                );
                            });

                            tareasHoraContainer.appendChild(tareaCard);
                        }
                    }
                });

                // CAMBIO: Event Listener para los slots de hora vacíos para añadir nueva tarea
                horaSlot.addEventListener('click', (event) => {
                    // Si el click no fue en una tarea (o su descendiente), selecciona el slot
                    if (!event.target.closest('.tarea-card-semana')) {
                        const clickedDate = horaSlot.dataset.date;
                        const clickedHour = horaSlot.dataset.hora;
                        // Aquí puedes setear los valores en el formulario de añadir tarea
                        document.getElementById("fecha").value = clickedDate;
                        document.getElementById("hora").value = clickedHour;
                        console.log(`Slot de ${clickedDate} a las ${clickedHour} clicado para añadir tarea.`);
                        // Opcional: Scrollear al formulario si no está visible
                        document.getElementById("formulario-container").scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });

                jornadaContainer.appendChild(horaSlot);
            }
            diaColumna.appendChild(jornadaContainer);
            calendar.appendChild(diaColumna);
        }
        dayPicker.value = formatearFecha(currentDate);

    } else if (currentView === 'dia') {
        calendar.classList.add('calendar-day-view');
        calendar.classList.remove('calendar-month-view', 'calendar-week-view');
        panelTareas.style.display = 'none';

        const diaColumna = document.createElement("div");
        diaColumna.classList.add("dia-semana-completo");
        diaColumna.dataset.date = formatearFecha(fechaParaDia);

        if (formatearFecha(fechaParaDia) === formatearFecha(hoy)) {
            diaColumna.classList.add("hoy");
        }

        const diaHeader = document.createElement("div");
        diaHeader.classList.add("dia-semana-header");

        const nombreDia = fechaParaDia.toLocaleString("es-ES", { weekday: 'long' });
        const numeroDia = fechaParaDia.getDate();
        const nombreMes = fechaParaDia.toLocaleString("es-ES", { month: 'long' });

        diaHeader.innerHTML = `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}, ${numeroDia} de ${nombreMes}`;
        if (formatearFecha(fechaParaDia) === formatearFecha(hoy)) {
            diaHeader.innerHTML += ` <span class="hoy-text">Hoy</span>`;
        }
        diaColumna.appendChild(diaHeader);

        const jornadaContainer = document.createElement("div");
        jornadaContainer.classList.add("jornada-container");

        for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
            const hora = h.toString().padStart(2, '0') + ":00";
            const horaSlot = document.createElement("div");
            horaSlot.classList.add("hora-slot");
            horaSlot.dataset.hora = hora;
            horaSlot.dataset.date = formatearFecha(fechaParaDia);

            const horaLabel = document.createElement("div");
            horaLabel.classList.add("hora-label");
            horaLabel.textContent = hora;
            horaSlot.appendChild(horaLabel);

            const tareasHoraContainer = document.createElement("div");
            tareasHoraContainer.classList.add("tareas-hora-container");
            horaSlot.appendChild(tareasHoraContainer);

            const tareasDelDia = allTasks[formatearFecha(fechaParaDia)] || [];

            tareasDelDia.forEach((tarea, index) => {
                const [tareaHoraStr, tareaMinStr] = tarea.hora.split(':');
                const tareaHora = parseInt(tareaHoraStr);
                const tareaMinutos = parseInt(tareaMinStr);
                const duracionMinutos = tarea.duracion;

                const inicioSlot = h * 60;
                const finSlot = (h + (INTERVALO_MINUTOS / 60)) * 60;
                const inicioTarea = tareaHora * 60 + tareaMinutos;
                const finTarea = inicioTarea + duracionMinutos;

                if (
                    (inicioTarea >= inicioSlot && inicioTarea < finSlot) ||
                    (finTarea > inicioSlot && finTarea <= finSlot) ||
                    (inicioTarea < inicioSlot && finTarea > finSlot)
                ) {
                    if (!filtroProfesionalId || tarea.profesional === filtroProfesionalId) {
                        const tareaCard = document.createElement("div");
                        tareaCard.classList.add("tarea-card");
                        tareaCard.innerHTML = `
                            <p class="tarea-hora"><strong>${tarea.hora}</strong> - ${obtenerProfesionalNombre(tarea.profesional, allProfessionals)}</p>
                            <p class="tarea-descripcion">${tarea.descripcion}</p>
                            <p class="duracion-text">${tarea.duracion} min</p>
                        `;
                        // CAMBIO: Almacenar datos para el modal
                        tareaCard.dataset.fecha = formatearFecha(fechaParaDia);
                        tareaCard.dataset.hora = tarea.hora;
                        tareaCard.dataset.profesional = tarea.profesional;
                        tareaCard.dataset.descripcion = tarea.descripcion;
                        tareaCard.dataset.duracion = tarea.duracion;
                        tareaCard.dataset.indice = index;

                        // CAMBIO: Event Listener para abrir el modal
                        tareaCard.addEventListener('click', (event) => {
                            event.stopPropagation(); // Evitar que el clic en la tarjeta propague al slot
                            window.abrirModalEditarTarea(
                                tareaCard.dataset.fecha,
                                tareaCard.dataset.hora,
                                tareaCard.dataset.profesional,
                                tareaCard.dataset.descripcion,
                                parseInt(tareaCard.dataset.duracion),
                                parseInt(tareaCard.dataset.indice)
                            );
                        });

                        tareasHoraContainer.appendChild(tareaCard);
                    }
                }
            });

            // CAMBIO: Event Listener para los slots de hora vacíos para añadir nueva tarea
            horaSlot.addEventListener('click', (event) => {
                // Si el click no fue en una tarea (o su descendiente), selecciona el slot
                if (!event.target.closest('.tarea-card')) {
                    const clickedDate = horaSlot.dataset.date;
                    const clickedHour = horaSlot.dataset.hora;
                    // Aquí puedes setear los valores en el formulario de añadir tarea
                    document.getElementById("fecha").value = clickedDate;
                    document.getElementById("hora").value = clickedHour;
                    console.log(`Slot de ${clickedDate} a las ${clickedHour} clicado para añadir tarea.`);
                    // Opcional: Scrollear al formulario si no está visible
                    document.getElementById("formulario-container").scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            jornadaContainer.appendChild(horaSlot);
        }
        diaColumna.appendChild(jornadaContainer);
        calendar.appendChild(diaColumna);
        dayPicker.value = formatearFecha(fechaParaDia);
    }
}


function seleccionarDia(date, allTasks, allProfessionals, filtroProfesionalId) {
    const calendarElement = document.getElementById("calendar");
    const hoyStr = formatearFecha(new Date());
    const fechaStr = formatearFecha(date);

    let diaASeleccionar = calendarElement.querySelector(`.dia[data-date=\"${fechaStr}\"]`) ||
                         calendarElement.querySelector(`.dia-semana-completo[data-date=\"${fechaStr}\"]`);

    if (window.diaSeleccionadoElement) { // Limpiar selección anterior si existe
        window.diaSeleccionadoElement.classList.remove('dia-seleccionado');
    }

    if (diaASeleccionar) {
        diaASeleccionar.classList.add('dia-seleccionado');
        window.diaSeleccionadoElement = diaASeleccionar; // Actualizar la referencia global
        renderizarTareasDelDiaSeleccionado(fechaStr, allTasks, allProfessionals, filtroProfesionalId);
        // Establecer la fecha en el formulario de añadir tarea
        document.getElementById("fecha").value = fechaStr;
    } else {
        // Esto puede pasar si se intenta seleccionar un día de un mes que no está visible
        // o si la vista no es de mes/semana/día.
        console.warn(`No se encontró el elemento DOM para la fecha ${fechaStr} en la vista actual.`);
        window.renderizarTareasDelDiaSeleccionado(fechaStr, allTasks, allProfessionals, filtroProfesionalId); // Intentar renderizar aunque no haya elemento visual
    }
}


function renderizarTareasDelDiaSeleccionado(fecha, allTasks, allProfessionals, filtroProfesionalId) {
    const listaTareasDia = document.getElementById("lista-tareas-dia");
    const fechaPanelTareas = document.getElementById("fecha-panel-tareas");

    const tareasDelDia = allTasks[fecha] || [];
    listaTareasDia.innerHTML = "";
    fechaPanelTareas.textContent = fecha;

    if (tareasDelDia.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay tareas para este día.";
        listaTareasDia.appendChild(li);
    } else {
        // Filtrar si hay un profesional seleccionado en el filtro
        const tareasFiltradas = filtroProfesionalId ?
            tareasDelDia.filter(t => t.profesional === filtroProfesionalId) :
            tareasDelDia;

        if (tareasFiltradas.length === 0 && filtroProfesionalId) {
            const li = document.createElement("li");
            li.textContent = `No hay tareas para este día con el profesional seleccionado.`;
            listaTareasDia.appendChild(li);
            return;
        }

        tareasFiltradas.sort((a, b) => a.hora.localeCompare(b.hora));
        tareasFiltradas.forEach((tarea, index) => {
            const profesionalNombre = obtenerProfesionalNombre(tarea.profesional, allProfessionals);
            const li = document.createElement("li");
            li.innerHTML = `
                <p class="tarea-hora">${tarea.hora} - ${profesionalNombre}</p>
                <p class="tarea-descripcion">${tarea.descripcion}</p>
                <p class="duracion-text">${tarea.duracion} min</p>
            `;
            // Almacenar información de la tarea en el elemento de la lista para fácil acceso
            // CAMBIO: Se debe usar el índice de la tarea original en `allTasks[fecha]` para editar/eliminar correctamente.
            // Para obtener el índice original, necesitamos encontrar la tarea en el array original.
            const originalIndex = allTasks[fecha].findIndex(t =>
                t.hora === tarea.hora &&
                t.descripcion === tarea.descripcion &&
                t.profesional === tarea.profesional &&
                t.duracion === tarea.duracion
            );


            li.dataset.fecha = fecha;
            li.dataset.hora = tarea.hora;
            li.dataset.profesional = tarea.profesional;
            li.dataset.descripcion = tarea.descripcion;
            li.dataset.duracion = tarea.duracion;
            li.dataset.indice = originalIndex; // Almacena el índice original

            li.addEventListener('click', () => {
                window.abrirModalEditarTarea(fecha, tarea.hora, tarea.profesional, tarea.descripcion, tarea.duracion, originalIndex);
            });
            listaTareasDia.appendChild(li);
        });
    }
}

function renderizarProximasTareas(allTasks, allProfessionals) {
    const listaProximasTareas = document.getElementById("lista-proximas-tareas");
    listaProximasTareas.innerHTML = "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const todasLasFechas = Object.keys(allTasks).sort();

    let contadorProximas = 0;
    const MAX_PROXIMAS_TAREAS = 5;

    for (const fechaStr of todasLasFechas) {
        const fechaDia = new Date(fechaStr);
        fechaDia.setHours(0, 0, 0, 0);

        if (fechaDia >= hoy) {
            const tareasDelDia = allTasks[fechaStr] || [];
            tareasDelDia.sort((a, b) => a.hora.localeCompare(b.hora));

            for (let i = 0; i < tareasDelDia.length; i++) {
                const tarea = tareasDelDia[i];
                if (fechaDia.getTime() === hoy.getTime()) {
                    const [horaTarea, minTarea] = tarea.hora.split(':').map(Number);
                    const horaActual = new Date().getHours();
                    const minActual = new Date().getMinutes();
                    if (horaTarea < horaActual || (horaTarea === horaActual && minActual < minActual)) {
                        continue;
                    }
                }

                const profesionalNombre = obtenerProfesionalNombre(tarea.profesional, allProfessionals);
                const li = document.createElement("li");
                li.innerHTML = `
                    <p class="tarea-hora">${fechaStr} ${tarea.hora} - ${profesionalNombre}</p>
                    <p class="tarea-descripcion">${tarea.descripcion}</p>
                    <p class="duracion-text">${tarea.duracion} min</p>
                `;
                // Almacenar índice original
                li.dataset.fecha = fechaStr;
                li.dataset.hora = tarea.hora;
                li.dataset.profesional = tarea.profesional;
                li.dataset.descripcion = tarea.descripcion;
                li.dataset.duracion = tarea.duracion;
                li.dataset.indice = i; // Almacena el índice original

                li.addEventListener('click', () => {
                    window.abrirModalEditarTarea(fechaStr, tarea.hora, tarea.profesional, tarea.descripcion, tarea.duracion, i);
                });

                listaProximasTareas.appendChild(li);
                contadorProximas++;
                if (contadorProximas >= MAX_PROXIMAS_TAREAS) {
                    return;
                }
            }
        }
    }

    if (contadorProximas === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay próximas tareas.";
        listaProximasTareas.appendChild(li);
    }
}

// Función auxiliar para obtener el inicio de la semana (Lunes)
function getStartOfWeek(date) {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(date.getFullYear(), date.getMonth(), diff);
}

// Exportar las funciones para que script.js pueda usarlas (opcional, pero buena práctica)
// Si no quieres exportar, asegúrate de que script.js las llame globalmente
window.generarCalendario = generarCalendario;
window.seleccionarDia = seleccionarDia;
window.renderizarProximasTareas = renderizarProximasTareas;
window.generarHoras = generarHoras;
window.parsearHoraAMinutos = parsearHoraAMinutos;
window.formatearFecha = formatearFecha;
window.obtenerProfesionalNombre = obtenerProfesionalNombre;