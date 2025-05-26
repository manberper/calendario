// La función generarCalendario se asume que usa las variables globales definidas en script.js
// y el objeto 'tareas' también definido globalmente.

function generarCalendario() {
    monthYear.textContent = fechaActual.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
    });

    calendar.innerHTML = ""; // Limpiar el calendario antes de renderizar

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día para comparación

    const profesionalFiltroId = filtroProfesionalSelect.value; // Obtener el filtro activo

    // Añadir nombres de los días de la semana SOLO si no es vista de día
    // MODIFICADO: Esta sección ahora es condicional
    if (vistaActual !== 'dia') {
        const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        nombresDias.forEach(diaNombre => {
            const div = document.createElement('div');
            div.classList.add('nombre-dia');
            div.textContent = diaNombre;
            calendar.appendChild(div);
        });
    }

    // Ocultar/mostrar panel de tareas del día según la vista
    // NOTA: Para la vista 'dia', este panel ahora se manejará con el calendario mismo
    if (vistaActual === 'dia') {
        panelTareas.style.display = 'none'; // Ocultar el panel separado para la vista de día
    } else {
        panelTareas.style.display = 'block'; // Mostrarlo para mes y semana
    }

    // --- Lógica para diferentes vistas ---

    if (vistaActual === 'mes') {
        calendar.classList.add('calendar-month-view');
        calendar.classList.remove('calendar-week-view', 'calendar-day-view'); // Quita las clases de otras vistas

        const primerDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const ultimoDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        // Ajustar el día de inicio de la semana para que Lunes sea 0
        const diaInicioSemana = (primerDiaDelMes.getDay() === 0) ? 6 : primerDiaDelMes.getDay() - 1; // 0 = Lunes, 6 = Domingo

        for (let i = 0; i < diaInicioSemana; i++) {
            const div = document.createElement('div');
            div.classList.add('dia', 'disabled');
            calendar.appendChild(div);
        }

        for (let dia = 1; dia <= ultimoDiaDelMes.getDate(); dia++) {
            const div = document.createElement('div');
            div.classList.add('dia');
            const fechaDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
            div.dataset.date = formatearFecha(fechaDia); // Guarda la fecha en formato YYYY-MM-DD

            const diaNumeroSpan = document.createElement('span');
            diaNumeroSpan.classList.add('dia-numero');
            diaNumeroSpan.textContent = dia;
            div.appendChild(diaNumeroSpan); // Añadir el span del número del día

            // Lógica para el indicador "Hoy"
            if (fechaDia.toDateString() === hoy.toDateString()) {
                div.classList.add('hoy');
                const hoyTextSpan = document.createElement('span');
                hoyTextSpan.classList.add('hoy-text');
                hoyTextSpan.textContent = 'Hoy';
                diaNumeroSpan.appendChild(hoyTextSpan); // Añadir "Hoy" como parte del dia-numero
            }

            const tareasDelDia = tareas[formatearFecha(fechaDia)] || [];
            if (tareasDelDia.length > 0) {
                // Filtrar tareas por profesional si hay filtro activo
                const tareasFiltradas = profesionalFiltroId
                    ? tareasDelDia.filter(tarea => tarea.profesional === profesionalFiltroId)
                    : tareasDelDia;

                if (tareasFiltradas.length > 0) {
                    const indicadorTarea = document.createElement('span');
                    indicadorTarea.classList.add('indicador-tarea');
                    div.appendChild(indicadorTarea);
                }
            }


            // Añadir el evento click para seleccionar el día
            div.addEventListener('click', () => {
                if (diaSeleccionadoElement) {
                    diaSeleccionadoElement.classList.remove('dia-seleccionado');
                }
                div.classList.add('dia-seleccionado');
                diaSeleccionadoElement = div;
                renderizarTareasDelDiaSeleccionado(div.dataset.date);
            });
            calendar.appendChild(div);
        }
    } else if (vistaActual === 'semana') {
        calendar.classList.add('calendar-week-view');
        calendar.classList.remove('calendar-month-view', 'calendar-day-view'); // Quita las clases de otras vistas

        // Obtener el primer día de la semana actual (lunes)
        const diaSemanaActual = fechaActual.getDay();
        const lunesDeSemana = new Date(fechaActual);
        lunesDeSemana.setDate(fechaActual.getDate() - (diaSemanaActual === 0 ? 6 : diaSemanaActual - 1)); // Ajustar para Lunes=0

        for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(lunesDeSemana);
            fechaDia.setDate(lunesDeSemana.getDate() + i);

            const div = document.createElement('div');
            div.classList.add('dia');
            div.dataset.date = formatearFecha(fechaDia);

            const diaNumeroSpan = document.createElement('span');
            diaNumeroSpan.classList.add('dia-numero');
            diaNumeroSpan.textContent = fechaDia.getDate();
            div.appendChild(diaNumeroSpan);

            // Lógica para el indicador "Hoy"
            if (fechaDia.toDateString() === hoy.toDateString()) {
                div.classList.add('hoy');
                const hoyTextSpan = document.createElement('span');
                hoyTextSpan.classList.add('hoy-text');
                hoyTextSpan.textContent = 'Hoy';
                diaNumeroSpan.appendChild(hoyTextSpan);
            }

            // Contenedor para las tareas resumen
            const tareasResumenContainer = document.createElement('div');
            tareasResumenContainer.classList.add('tareas-resumen-semana');
            div.appendChild(tareasResumenContainer);

            const tareasDelDia = tareas[formatearFecha(fechaDia)] || [];
            const tareasFiltradas = profesionalFiltroId
                ? tareasDelDia.filter(tarea => tarea.profesional === profesionalFiltroId)
                : tareasDelDia;

            if (tareasFiltradas.length > 0) {
                // Mostrar solo las primeras 2-3 tareas para no desbordar
                for (let j = 0; j < Math.min(tareasFiltradas.length, 3); j++) {
                    const tarea = tareasFiltradas[j];
                    const tareaItem = document.createElement('p');
                    tareaItem.classList.add('tarea-resumen-item');
                    tareaItem.innerHTML = `<span class="tarea-resumen-hora">${tarea.hora}</span> ${tarea.descripcion}`;
                    tareasResumenContainer.appendChild(tareaItem);
                }
                if (tareasFiltradas.length > 3) {
                    const masTareas = document.createElement('p');
                    masTareas.classList.add('mas-tareas-indicador');
                    masTareas.textContent = `+${tareasFiltradas.length - 3} más`;
                    tareasResumenContainer.appendChild(masTareas);
                }
            } else {
                const noTareas = document.createElement('p');
                noTareas.textContent = 'No hay tareas';
                noTareas.style.opacity = 0.6;
                tareasResumenContainer.appendChild(noTareas);
            }

            div.addEventListener('click', () => {
                if (diaSeleccionadoElement) {
                    diaSeleccionadoElement.classList.remove('dia-seleccionado');
                }
                div.classList.add('dia-seleccionado');
                diaSeleccionadoElement = div;
                renderizarTareasDelDiaSeleccionado(div.dataset.date);
            });

            calendar.appendChild(div);
        }
    } else if (vistaActual === 'dia') {
        calendar.classList.add('calendar-day-view');
        calendar.classList.remove('calendar-month-view', 'calendar-week-view'); // Quita las clases de otras vistas

        const diaSeleccionado = new Date(fechaActual); // Usamos la fechaActual para la vista de día

        // Crear slots de 24 horas
        for (let h = 0; h < 24; h++) {
            const hora = String(h).padStart(2, '0') + ':00';
            const horaSlot = document.createElement('div');
            horaSlot.classList.add('hora-slot');

            const horaLabel = document.createElement('span');
            horaLabel.classList.add('hora-label');
            horaLabel.textContent = hora;
            horaSlot.appendChild(horaLabel);

            const tareasHoraContainer = document.createElement('div');
            tareasHoraContainer.classList.add('tareas-hora-container');
            horaSlot.appendChild(tareasHoraContainer);

            // Obtener y mostrar las tareas para esta hora específica
            const fechaString = formatearFecha(diaSeleccionado);
            const tareasDelDia = tareas[fechaString] || [];
            const tareasDeEstaHora = tareasDelDia.filter(tarea => {
                // Asumiendo que la hora de la tarea es "HH:MM"
                const [tareaHoraStr, tareaMinStr] = tarea.hora.split(':');
                const tareaHoraNum = parseInt(tareaHoraStr);
                const tareaMinNum = parseInt(tareaMinStr);
            
                // Calcular el final de la tarea
                const finTareaHoraNum = tareaHoraNum + Math.floor((tareaMinNum + parseInt(tarea.duracion)) / 60);
                const finTareaMinNum = (tareaMinNum + parseInt(tarea.duracion)) % 60;
            
                // Convertir la hora del slot y la hora de la tarea a minutos para fácil comparación
                const slotMinutos = h * 60;
                const tareaInicioMinutos = tareaHoraNum * 60 + tareaMinNum;
                const tareaFinMinutos = finTareaHoraNum * 60 + finTareaMinNum;
            
                // La tarea se superpone si su inicio está en el slot o su fin está en el slot, o el slot está dentro de la tarea
                return (tareaInicioMinutos >= slotMinutos && tareaInicioMinutos < (slotMinutos + 60)) ||
                       (tareaFinMinutos > slotMinutos && tareaFinMinutos <= (slotMinutos + 60)) ||
                       (tareaInicioMinutos < slotMinutos && tareaFinMinutos > (slotMinutos + 60));
            }).filter(tarea => profesionalFiltroId ? tarea.profesional === profesionalFiltroId : true); // Aplicar filtro de profesional

            tareasDeEstaHora.sort((a, b) => { // Ordenar por hora de inicio
                const [aHour, aMin] = a.hora.split(':').map(Number);
                const [bHour, bMin] = b.hora.split(':').map(Number);
                return (aHour * 60 + aMin) - (bHour * 60 + bMin);
            });

            tareasDeEstaHora.forEach(tarea => {
                const tareaCard = document.createElement('div');
                tareaCard.classList.add('tarea-card');
                tareaCard.innerHTML = `
                    <p class="tarea-hora">${tarea.hora} - ${tarea.profesional}</p>
                    <p class="tarea-descripcion">${tarea.descripcion}</p>
                `;
                tareaCard.addEventListener('click', (event) => {
                    event.stopPropagation(); // Evitar que el click en la tarjeta active el slot
                    mostrarModalEditarTarea(tarea, formatearFecha(diaSeleccionado));
                });
                tareasHoraContainer.appendChild(tareaCard);
            });
            
            // Evento para añadir nueva tarea al hacer clic en el slot de hora
            horaSlot.addEventListener('click', () => {
                // Almacenar la fecha actual en la variable global para el formulario
                fechaInput.value = formatearFecha(diaSeleccionado);
                horaSelect.value = hora;
                // Puedes desplazar el scroll al formulario si está fuera de vista
                formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            calendar.appendChild(horaSlot);
        }
    }
    // Después de generar el calendario, renderizar las próximas tareas
    renderizarProximasTareas();
}


// Función unificada para renderizar todo lo necesario en la UI
function renderizarTodoElCalendarioUI() {
    generarCalendario(); // Regenera el calendario con la vista y el filtro actual
    // La función generarCalendario ahora es responsable de llamar a renderizarProximasTareas()
    // y renderizarTareasDelDiaSeleccionado() (para la vista de día o cuando se selecciona un día).
    // Si no estás en vista de día, asegúrate de que renderizarTareasDelDiaSeleccionado se llame
    // con el día seleccionado actualmente, o con la fecha de hoy si no hay día seleccionado.
    
    // Si no hay un día seleccionado (o si se cambia de mes/semana), mostrar tareas del día de hoy
    // MODIFICADO: Solo renderizar tareas del día seleccionado si no estamos en vista 'dia'
    // porque en vista 'dia', las tareas se muestran directamente en los slots de hora.
    if (vistaActual !== 'dia') { 
        if (!diaSeleccionadoElement) {
            renderizarTareasDelDiaSeleccionado(formatearFecha(new Date()));
        } else {
            // Mantener la selección del día si estamos en vista mes/semana
            renderizarTareasDelDiaSeleccionado(diaSeleccionadoElement.dataset.date);
        }
    } else {
        // En vista de día, limpia el panel de tareas o asegúrate de que no se use para evitar duplicidades
        // El panel de tareas no debe mostrarse cuando la vista es 'dia'
        panelTareas.style.display = 'none'; 
        // No llamamos a renderizarTareasDelDiaSeleccionado() para la vista 'dia'
        // ya que las tareas se manejan directamente en los slots del calendario.
    }
}