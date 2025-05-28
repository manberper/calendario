// La función generarCalendario se asume que usa las variables globales definidas en script.js
// y el objeto 'tareas' también definido globalmente.

function generarCalendario() {
    // 1. Limpiar el contenido del calendario y definir el texto del encabezado
    calendar.innerHTML = ""; // Limpiar el calendario antes de renderizar

    // --- LÓGICA PARA ACTUALIZAR EL ENCABEZADO ---
    let textoCabecera = ''; 
    if (vistaActual === 'mes') {
        const opcionesMes = { year: 'numeric', month: 'long' };
        textoCabecera = fechaActual.toLocaleDateString('es-ES', opcionesMes);
    } else if (vistaActual === 'semana') {
        // Calcular el inicio de la semana (Lunes)
        const inicioSemana = new Date(fechaActual);
        // getDay() devuelve 0 para Domingo, 1 para Lunes, etc.
        // Si es Domingo (0), queremos ir 6 días atrás para el Lunes de la semana anterior.
        // Si es otro día, (diaActual - 1) nos da la diferencia para llegar al Lunes.
        const diaDeLaSemana = inicioSemana.getDay(); 
        const diferenciaDias = (diaDeLaSemana === 0) ? -6 : 1 - diaDeLaSemana; 
        inicioSemana.setDate(inicioSemana.getDate() + diferenciaDias);

        // Calcular el final de la semana (Domingo)
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(finSemana.getDate() + 6); 

        const opcionesFechaCorta = { day: 'numeric', month: 'long' };
        const opcionesAnio = { year: 'numeric' };

        const fechaInicioStr = inicioSemana.toLocaleDateString('es-ES', opcionesFechaCorta);
        const fechaFinStr = finSemana.toLocaleDateString('es-ES', opcionesFechaCorta);
        const anioStr = finSemana.toLocaleDateString('es-ES', opcionesAnio);

        textoCabecera = `Semana del ${fechaInicioStr} al ${fechaFinStr} de ${anioStr}`;

    } else if (vistaActual === 'dia') {
        const opcionesDia = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        textoCabecera = fechaActual.toLocaleDateString('es-ES', opcionesDia);
    }
    
    // Asignar el texto al elemento 'monthYear' (que es tu monthYear.textContent)
    // Capitalizar la primera letra para una mejor presentación
    monthYear.textContent = textoCabecera.charAt(0).toUpperCase() + textoCabecera.slice(1);

    // --- FIN LÓGICA PARA ACTUALIZAR EL ENCABEZADO ---

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 

    const profesionalFiltroId = filtroProfesionalSelect.value; 

    if (vistaActual !== 'dia') {
        const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        nombresDias.forEach(diaNombre => {
            const div = document.createElement('div');
            div.classList.add('nombre-dia');
            div.textContent = diaNombre;
            calendar.appendChild(div);
        });
    }

    if (vistaActual === 'dia') {
        panelTareas.style.display = 'none'; 
    } else {
        panelTareas.style.display = 'block'; 
    }

    if (vistaActual === 'mes') {
        calendar.classList.add('calendar-month-view');
        calendar.classList.remove('calendar-week-view', 'calendar-day-view'); 

        const primerDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const ultimoDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        const diaInicioSemana = (primerDiaDelMes.getDay() === 0) ? 6 : primerDiaDelMes.getDay() - 1; 

        for (let i = 0; i < diaInicioSemana; i++) {
            const div = document.createElement('div');
            div.classList.add('dia', 'disabled');
            calendar.appendChild(div);
        }

        for (let dia = 1; dia <= ultimoDiaDelMes.getDate(); dia++) {
            const div = document.createElement('div');
            div.classList.add('dia');
            const fechaDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
            div.dataset.date = formatearFecha(fechaDia); 

            const diaNumeroSpan = document.createElement('span');
            diaNumeroSpan.classList.add('dia-numero');
            diaNumeroSpan.textContent = dia;
            div.appendChild(diaNumeroSpan); 

            if (fechaDia.toDateString() === hoy.toDateString()) {
                div.classList.add('hoy');
                const hoyTextSpan = document.createElement('span');
                hoyTextSpan.classList.add('hoy-text');
                hoyTextSpan.textContent = 'Hoy';
                diaNumeroSpan.appendChild(hoyTextSpan); 
            }

            const tareasDelDia = tareas[formatearFecha(fechaDia)] || [];
            if (tareasDelDia.length > 0) {
                const tareasFiltradas = profesionalFiltroId
                    ? tareasDelDia.filter(tarea => tarea.profesional === profesionalFiltroId)
                    : tareasDelDia;

                if (tareasFiltradas.length > 0) {
                    const indicadorTarea = document.createElement('span');
                    indicadorTarea.classList.add('indicador-tarea');
                    div.appendChild(indicadorTarea);
                }
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
    } else if (vistaActual === 'semana') {
        calendar.classList.add('calendar-week-view');
        calendar.classList.remove('calendar-month-view', 'calendar-day-view'); 

        const diaSemanaActual = fechaActual.getDay();
        const lunesDeSemana = new Date(fechaActual);
        lunesDeSemana.setDate(fechaActual.getDate() - (diaSemanaActual === 0 ? 6 : diaSemanaActual - 1)); 

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

            if (fechaDia.toDateString() === hoy.toDateString()) {
                div.classList.add('hoy');
                const hoyTextSpan = document.createElement('span');
                hoyTextSpan.classList.add('hoy-text');
                hoyTextSpan.textContent = 'Hoy';
                diaNumeroSpan.appendChild(hoyTextSpan);
            }

            const tareasResumenContainer = document.createElement('div');
            tareasResumenContainer.classList.add('tareas-resumen-semana');
            div.appendChild(tareasResumenContainer);

            const tareasDelDia = tareas[formatearFecha(fechaDia)] || [];
            const tareasFiltradas = profesionalFiltroId
                ? tareasDelDia.filter(tarea => tarea.profesional === profesionalFiltroId)
                : tareasDelDia;

            if (tareasFiltradas.length > 0) {
                // Iteramos sobre TODAS las tareas filtradas
                for (let j = 0; j < tareasFiltradas.length; j++) { 
                    const tarea = tareasFiltradas[j];
                    const tareaItem = document.createElement('p');
                    tareaItem.classList.add('tarea-resumen-item');
                    tareaItem.innerHTML = `<span class="tarea-resumen-hora">${tarea.hora}</span> ${tarea.descripcion}`;
                    tareasResumenContainer.appendChild(tareaItem);
                }
            } else {
                // Este bloque se mantiene para cuando no hay tareas
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
        calendar.classList.remove('calendar-month-view', 'calendar-week-view'); 

        const diaSeleccionado = new Date(fechaActual); 

        for (let h = 8; h < 20; h++) {
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

            const fechaString = formatearFecha(diaSeleccionado);
            const tareasDelDia = tareas[fechaString] || [];
            const tareasDeEstaHora = tareasDelDia.filter(tarea => {
                const [tareaHoraStr, tareaMinStr] = tarea.hora.split(':');
                const tareaHoraNum = parseInt(tareaHoraStr);
                const tareaMinNum = parseInt(tareaMinStr);
                
                const finTareaHoraNum = tareaHoraNum + Math.floor((tareaMinNum + parseInt(tarea.duracion)) / 60);
                const finTareaMinNum = (tareaMinNum + parseInt(tarea.duracion)) % 60;
                
                const slotMinutos = h * 60;
                const tareaInicioMinutos = tareaHoraNum * 60 + tareaMinNum;
                const tareaFinMinutos = finTareaHoraNum * 60 + finTareaMinNum;
                
                return (tareaInicioMinutos >= slotMinutos && tareaInicioMinutos < (slotMinutos + 60)) ||
                       (tareaFinMinutos > slotMinutos && tareaFinMinutos <= (slotMinutos + 60)) ||
                       (tareaInicioMinutos < slotMinutos && tareaFinMinutos > (slotMinutos + 60));
            }).filter(tarea => profesionalFiltroId ? tarea.profesional === profesionalFiltroId : true); 

            tareasDeEstaHora.sort((a, b) => { 
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
                    event.stopPropagation();
                    const fechaString = formatearFecha(diaSeleccionado);
                    const indice = tareas[fechaString].findIndex(t => 
                        t.hora === tarea.hora && 
                        t.duracion === tarea.duracion && 
                        t.profesional === tarea.profesional && 
                        t.descripcion === tarea.descripcion
                    );

                    if (indice !== -1) {
                         abrirModalDetalles(fechaString, tarea.hora, tarea.descripcion, tarea.duracion, tarea.profesional, indice);
                    } else {
                        console.error("Tarea no encontrada para mostrar detalles en la vista de día.");
                        alert("No se pudo preparar la tarea para mostrar detalles.");
                    }
                });
                tareasHoraContainer.appendChild(tareaCard);
            });
            
            horaSlot.addEventListener('click', () => {
                fechaInput.value = formatearFecha(diaSeleccionado);
                horaSelect.value = hora;
                formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            calendar.appendChild(horaSlot);
        }
    }
    renderizarProximasTareas();
}


// Función unificada para renderizar todo lo necesario en la UI
function renderizarTodoElCalendarioUI() {
    generarCalendario(); // Regenera el calendario con la vista y el filtro actual

    if (vistaActual !== 'dia') { 
        if (!diaSeleccionadoElement) {
            renderizarTareasDelDiaSeleccionado(formatearFecha(new Date()));
        } else {
            // Mantener la selección del día si estamos en vista mes/semana
            renderizarTareasDelDiaSeleccionado(diaSeleccionadoElement.dataset.date);
        }
    } else {
        panelTareas.style.display = 'none'; 
    }
}