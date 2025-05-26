// tasks.js - Lógica de visualización y filtrado de tareas

function mostrarTareasDelDia(fecha) {
    panelTareas.innerHTML = `<h3>Tareas para el ${fecha}</h3>`;
    const tareasDelDia = tareas[fecha];
    const profesionalFiltrado = filtroProfesionalSelect.value;

    if (tareasDelDia) {
        const horasOrdenadas = Object.keys(tareasDelDia).sort();
        let hayTareasFiltradas = false;

        horasOrdenadas.forEach((hora) => {
            tareasDelDia[hora].forEach((tarea, index) => {
                if (profesionalFiltrado === "" || tarea.profesional === profesionalFiltrado) {
                    hayTareasFiltradas = true;
                    const p = document.createElement("p");
                    p.innerHTML = `<span class="hora-tarea">${hora}</span>: ${tarea.texto} (${tarea.duracion} min) - ${tarea.profesional || 'Sin profesional'}`;
                    p.addEventListener("click", () => {
                        abrirModalDetalles(fecha, hora, tarea, index);
                    });
                    panelTareas.appendChild(p);
                }
            });
        });

        if (!hayTareasFiltradas) {
            panelTareas.innerHTML += `<p>No hay tareas programadas para este día ${profesionalFiltrado ? `con ${profesionalFiltrado}` : ''}.</p>`;
        }
    } else {
        panelTareas.innerHTML += `<p>No hay tareas programadas para este día.</p>`;
    }
}


function mostrarProximasTareas() {
    listaProximasTareas.innerHTML = "";

    const todasLasTareas = [];
    const profesionalFiltrado = filtroProfesionalSelect.value;

    for (const fecha in tareas) {
        for (const hora in tareas[fecha]) {
            tareas[fecha][hora].forEach(tarea => {
                if (profesionalFiltrado === "" || tarea.profesional === profesionalFiltrado) {
                    todasLasTareas.push({
                        fecha: fecha,
                        hora: hora,
                        ...tarea,
                        timestamp: new Date(`${fecha}T${hora}:00`).getTime(),
                    });
                }
            });
        }
    }

    todasLasTareas.sort((a, b) => a.timestamp - b.timestamp);

    const ahora = new Date().getTime();
    let tareasMostradas = 0;
    const maxTareas = 5; // Limitar a 5 tareas

    let hasUpcomingTasks = false;
    for (const tarea of todasLasTareas) {
        if (tarea.timestamp >= ahora && (profesionalFiltrado === "" || tarea.profesional === profesionalFiltrado)) {
            hasUpcomingTasks = true;
            break;
        }
    }

    if (hasUpcomingTasks) {
        listaProximasTareas.innerHTML = "<h3>Próximas Tareas</h3>";
    }

    for (const tarea of todasLasTareas) {
        if (tarea.timestamp >= ahora && tareasMostradas < maxTareas) {
            const p = document.createElement("p");
            p.innerHTML = `<span class="fecha-proxima">${tarea.fecha} ${tarea.hora}</span>: ${tarea.texto} (${tarea.duracion} min) - ${tarea.profesional || 'Sin profesional'}`;
            p.addEventListener("click", () => {
                const tareasEnHora = tareas[tarea.fecha][tarea.hora];
                const indexParaModal = tareasEnHora.findIndex(t => 
                    t.texto === tarea.texto && 
                    t.duracion === tarea.duracion && 
                    t.profesional === tarea.profesional
                );
                abrirModalDetalles(tarea.fecha, tarea.hora, tarea, indexParaModal);
            });
            listaProximasTareas.appendChild(p);
            tareasMostradas++;
        }
    }

    if (tareasMostradas === 0) {
        listaProximasTareas.innerHTML += `<p>No hay próximas tareas ${profesionalFiltrado ? `para ${profesionalFiltrado}` : ''}.</p>`;
    }
}