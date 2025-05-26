let fechaActual = new Date();
let tareas = {}; // Las tareas ahora contendrán un array para cada hora
let profesionales = [];
let tareaSeleccionada = { fecha: null, hora: null, indiceEnArray: null }; // Añadimos indiceEnArray
let diaSeleccionadoElement = null;

// Elementos del formulario
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora");
const profesionalSelect = document.getElementById("profesional");
const tareaInput = document.getElementById("descripcion");
const formulario = document.getElementById("formulario");
const panelTareas = document.getElementById("panel-tareas");
const listaProximasTareas = document.getElementById("lista-proximas-tareas");

// Modal de Editar Tarea
const modalTarea = document.getElementById("modal-tarea");
const inputEditar = document.getElementById("editar-descripcion");
const editarDuracionSelect = document.getElementById("editar-duracion");
const editarProfesionalSelect = document.getElementById("editar-profesional");
const btnGuardar = document.getElementById("guardar-cambios");
const btnEliminar = document.getElementById("eliminar-tarea");
const btnCancelar = document.getElementById("cancelar-edicion");

// Nuevo Modal de Detalles de Tarea
const modalDetalles = document.getElementById("modal-detalles");
const detalleFecha = document.getElementById("detalle-fecha");
const detalleHora = document.getElementById("detalle-hora");
const detalleDuracion = document.getElementById("detalle-duracion");
const detalleProfesional = document.getElementById("detalle-profesional");
const detalleDescripcion = document.getElementById("detalle-descripcion");
const cerrarDetallesBtn = document.getElementById("cerrar-detalles-btn");
const editarTareaDesdeDetallesBtn = document.getElementById("editar-tarea-desde-detalles");

// Filtro de profesional
const filtroProfesionalSelect = document.getElementById("filtroProfesional");

// --- Funciones de Carga Inicial ---

async function cargarTareas() {
    try {
        const response = await fetch("cargar.php");
        const data = await response.json();
        // Asegurarse de que las tareas estén en el formato correcto (array por hora)
        // Convertir el formato antiguo si se detecta (objeto directo bajo la hora)
        const convertedData = {};
        for (const fecha in data) {
            convertedData[fecha] = {};
            for (const hora in data[fecha]) {
                // Si lo que hay bajo la hora no es un array, lo convertimos a uno
                if (!Array.isArray(data[fecha][hora])) {
                    convertedData[fecha][hora] = [data[fecha][hora]];
                } else {
                    convertedData[fecha][hora] = data[fecha][hora];
                }
            }
        }
        tareas = convertedData;
        generarCalendario();
        mostrarProximasTareas();
    } catch (error) {
        console.error("Error al cargar tareas:", error);
        tareas = {};
    }
}

async function guardarTareasEnServidor() {
    try {
        const response = await fetch("guardar_tarea.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tareas),
        });
        const data = await response.json();
        if (data.status === "ok") {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'La tarea se ha guardado correctamente.',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: data.message || 'Hubo un problema al guardar la tarea.'
            });
        }
    } catch (error) {
        console.error("Error al guardar tareas:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor para guardar la tarea.'
        });
    }
}

async function cargarProfesionales() {
    try {
        const response = await fetch("profesionales.json");
        profesionales = await response.json();

        profesionalSelect.innerHTML = profesionales
            .map((prof) => `<option value="${prof}">${prof}</option>`)
            .join("");

        editarProfesionalSelect.innerHTML = profesionales
            .map((prof) => `<option value="${prof}">${prof}</option>`)
            .join("");

        filtroProfesionalSelect.innerHTML = '<option value="">Todos los Profesionales</option>' +
            profesionales.map((prof) => `<option value="${prof}">${prof}</option>`).join("");

    } catch (error) {
        console.error("Error al cargar profesionales:", error);
    }
}

function generarHoras() {
    horaSelect.innerHTML = "";
    for (let h = 8; h < 20; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hora = String(h).padStart(2, "0");
            const minuto = String(m).padStart(2, "0");
            const option = document.createElement("option");
            option.value = `${hora}:${minuto}`;
            option.textContent = `${hora}:${minuto}`;
            horaSelect.appendChild(option);
        }
    }
}

// --- Funciones del Calendario ---

function generarCalendario() {
    calendar.innerHTML = "";
    monthYear.textContent = fechaActual.toLocaleString("es", {
        month: "long",
        year: "numeric",
    });

    const primerDiaDelMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth(),
        1
    );
    const ultimoDiaDelMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() + 1,
        0
    );

    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    diasSemana.forEach((dia) => {
        const diaHeader = document.createElement("div");
        diaHeader.classList.add("dia-header");
        diaHeader.textContent = dia;
        calendar.appendChild(diaHeader);
    });

    for (let i = 0; i < primerDiaDelMes.getDay(); i++) {
        const div = document.createElement("div");
        div.classList.add("dia-vacio");
        calendar.appendChild(div);
    }

    for (let i = 1; i <= ultimoDiaDelMes.getDate(); i++) {
        const div = document.createElement("div");
        div.classList.add("dia");

        const fechaDia = `${fechaActual.getFullYear()}-${String(
            fechaActual.getMonth() + 1
        ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

        const today = new Date();
        const esDiaActual = (
            i === today.getDate() &&
            fechaActual.getMonth() === today.getMonth() &&
            fechaActual.getFullYear() === today.getFullYear()
        );

        if (esDiaActual) {
            div.classList.add("dia-actual");
            const hoyMarcador = document.createElement('span');
            hoyMarcador.classList.add('dia-actual-marcador');
            hoyMarcador.textContent = 'Hoy';
            div.appendChild(hoyMarcador);
        }

        // Resaltar días con tareas y añadir indicador de duración
        if (tareas[fechaDia] && Object.keys(tareas[fechaDia]).length > 0) {
            let hasAnyTask = false;
            for (const hora in tareas[fechaDia]) {
                if (tareas[fechaDia][hora] && tareas[fechaDia][hora].length > 0) {
                    hasAnyTask = true;
                    break;
                }
            }

            if (hasAnyTask) {
                div.classList.add("dia-con-tareas");

                let primeraDuracion = 0;
                const horasDelDia = Object.keys(tareas[fechaDia]).sort();
                if (horasDelDia.length > 0 && tareas[fechaDia][horasDelDia[0]].length > 0) {
                    primeraDuracion = parseInt(tareas[fechaDia][horasDelDia[0]][0].duracion);
                }

                const indicadorDuracion = document.createElement('div');
                indicadorDuracion.classList.add('duracion-indicador');
                if (primeraDuracion === 15) {
                    indicadorDuracion.classList.add('duracion-15');
                } else if (primeraDuracion === 30) {
                    indicadorDuracion.classList.add('duracion-30');
                } else if (primeraDuracion === 45) {
                    indicadorDuracion.classList.add('duracion-45');
                } else if (primeraDuracion === 60) {
                    indicadorDuracion.classList.add('duracion-60');
                } else {
                    indicadorDuracion.style.backgroundColor = '#f107a3';
                }
                div.appendChild(indicadorDuracion);
            }
        }
        
        const diaNumero = document.createElement('span');
        diaNumero.classList.add('dia-numero');
        diaNumero.textContent = i;
        div.appendChild(diaNumero);

        div.addEventListener("click", () => {
            if (diaSeleccionadoElement) {
                diaSeleccionadoElement.classList.remove("dia-seleccionado");
            }
            div.classList.add("dia-seleccionado");
            diaSeleccionadoElement = div;
            mostrarTareasDelDia(fechaDia);
        });

        calendar.appendChild(div);
    }
}

// --- Funciones de Tareas ---

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
    // Iterar para ver si hay AL MENOS UNA tarea próxima que cumpla el filtro
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
        // Solo mostrar si la tarea es futura y aún no hemos alcanzado el límite
        if (tarea.timestamp >= ahora && tareasMostradas < maxTareas) { // Aplicamos el límite aquí
            // El filtro ya se aplicó al recopilar todasLasTareas
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

// --- Funciones del Modal ---

function abrirModalDetalles(fecha, hora, tarea, index) {
    detalleFecha.textContent = fecha;
    detalleHora.textContent = hora;
    detalleDuracion.textContent = tarea.duracion;
    detalleProfesional.textContent = tarea.profesional || "No asignado";
    detalleDescripcion.textContent = tarea.texto;

    modalDetalles.style.display = "flex";

    tareaSeleccionada = {
        fecha: fecha,
        hora: hora,
        indiceEnArray: index,
    };

    inputEditar.value = tarea.texto;
    editarDuracionSelect.value = tarea.duracion;
    editarProfesionalSelect.value = tarea.profesional || "";
}

function abrirModalEdicion() {
    modalDetalles.style.display = "none";
    modalTarea.style.display = "flex";
}

// --- Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    fechaInput.min = `${year}-${month}-${day}`;
});

formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const fecha = fechaInput.value;
    const duracion = document.getElementById("duracion").value;
    const hora = horaSelect.value;
    const profesional = profesionalSelect.value;
    const descripcion = tareaInput.value.trim();

    if (!fecha || !duracion || !hora || !profesional || !descripcion) {
        Swal.fire({
            icon: 'error',
            title: 'Campos incompletos',
            text: 'Por favor, rellena todos los campos para añadir la tarea.'
        });
        return;
    }

    const fechaSeleccionada = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();

    if (fechaSeleccionada < ahora) {
        Swal.fire({
            icon: 'warning',
            title: 'Fecha u Hora en el Pasado',
            text: 'No puedes programar una tarea en el pasado. Por favor, selecciona una fecha y hora futuras.'
        });
        return;
    }

    if (!tareas[fecha]) {
        tareas[fecha] = {};
    }
    if (!tareas[fecha][hora]) {
        tareas[fecha][hora] = [];
    }

    const yaExisteProfesional = tareas[fecha][hora].some(t => t.profesional === profesional);
    if (yaExisteProfesional) {
        Swal.fire({
            icon: 'info',
            title: 'Profesional Ocupado',
            text: `El profesional ${profesional} ya tiene una tarea programada para el ${fecha} a las ${hora}.`
        });
        return;
    }

    tareas[fecha][hora].push({
        texto: descripcion,
        duracion: duracion,
        profesional: profesional,
    });

    guardarTareasEnServidor();
    generarCalendario();
    mostrarTareasDelDia(fecha);
    mostrarProximasTareas();
    formulario.reset();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    fechaInput.min = `${year}-${month}-${day}`;
});

btnGuardar.addEventListener("click", async () => {
    const nuevaDescripcion = inputEditar.value.trim();
    const nuevaDuracion = editarDuracionSelect.value;
    const nuevoProfesional = editarProfesionalSelect.value;
    const { fecha, hora, indiceEnArray } = tareaSeleccionada;

    if (nuevaDescripcion && nuevaDuracion && nuevoProfesional && indiceEnArray !== null) {
        if (tareas[fecha] && tareas[fecha][hora] && tareas[fecha][hora][indiceEnArray]) {
            const originalProfesional = tareas[fecha][hora][indiceEnArray].profesional;
            if (nuevoProfesional !== originalProfesional) {
                const profesionalYaOcupado = tareas[fecha][hora].some((tarea, idx) => 
                    idx !== indiceEnArray && tarea.profesional === nuevoProfesional
                );
                if (profesionalYaOcupado) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Profesional Ocupado',
                        text: `El profesional ${nuevoProfesional} ya tiene otra tarea a las ${hora} en esta fecha.`
                    });
                    return;
                }
            }

            tareas[fecha][hora][indiceEnArray] = {
                texto: nuevaDescripcion,
                duracion: nuevaDuracion,
                profesional: nuevoProfesional,
            };

            try {
                const response = await fetch("modificar_tarea.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        clave: fecha,
                        hora: hora,
                        indiceEnArray: indiceEnArray,
                        accion: "editar",
                        texto: tareas[fecha][hora][indiceEnArray],
                    }),
                });
                const data = await response.json();
                if (data.status === "ok") {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Tarea modificada correctamente.',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    generarCalendario();
                    mostrarTareasDelDia(fecha);
                    mostrarProximasTareas();
                    modalTarea.style.display = "none";
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al modificar',
                        text: data.message || 'Hubo un problema al modificar la tarea.'
                    });
                }
            } catch (error) {
                console.error("Error al modificar tarea:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor para modificar la tarea.'
                });
            }
        }
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Vacíos o Tarea No Seleccionada',
            text: "Por favor, rellena todos los campos de edición y asegúrate de que una tarea esté seleccionada."
        });
    }
});

btnEliminar.addEventListener("click", () => {
    const { fecha, hora, indiceEnArray } = tareaSeleccionada;

    if (fecha && hora && indiceEnArray !== null) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch("modificar_tarea.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            clave: fecha,
                            hora: hora,
                            indiceEnArray: indiceEnArray,
                            accion: "borrar",
                        }),
                    });
                    const data = await response.json();
                    if (data.status === "ok") {
                        if (tareas[fecha] && tareas[fecha][hora]) {
                            tareas[fecha][hora].splice(indiceEnArray, 1);
                            
                            if (tareas[fecha][hora].length === 0) {
                                delete tareas[fecha][hora];
                            }
                            if (Object.keys(tareas[fecha]).length === 0) {
                                delete tareas[fecha];
                            }
                        }
                        Swal.fire(
                            '¡Eliminada!',
                            'La tarea ha sido eliminada.',
                            'success'
                        );
                        generarCalendario();
                        mostrarTareasDelDia(fecha);
                        mostrarProximasTareas();
                        modalTarea.style.display = "none";
                        modalDetalles.style.display = "none";
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al eliminar',
                            text: data.message || 'Hubo un problema al eliminar la tarea.'
                        });
                    }
                } catch (error) {
                    console.error("Error al eliminar tarea:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor para eliminar la tarea.'
                    });
                }
            }
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se ha seleccionado una tarea para eliminar.'
        });
    }
});

btnCancelar.addEventListener("click", () => {
    modalTarea.style.display = "none";
});

cerrarDetallesBtn.addEventListener("click", () => {
    modalDetalles.style.display = "none";
});

editarTareaDesdeDetallesBtn.addEventListener("click", () => {
    abrirModalEdicion();
});

prevMonthBtn.addEventListener("click", () => {
    fechaActual.setMonth(fechaActual.getMonth() - 1);
    generarCalendario();
    if (diaSeleccionadoElement) {
        diaSeleccionadoElement.classList.remove("dia-seleccionado");
        diaSeleccionadoElement = null;
    }
    panelTareas.innerHTML = "<h3>Selecciona un día para ver tareas</h3>";
});

nextMonthBtn.addEventListener("click", () => {
    fechaActual.setMonth(fechaActual.getMonth() + 1);
    generarCalendario();
    if (diaSeleccionadoElement) {
        diaSeleccionadoElement.classList.remove("dia-seleccionado");
        diaSeleccionadoElement = null;
    }
    panelTareas.innerHTML = "<h3>Selecciona un día para ver tareas</h3>";
});

filtroProfesionalSelect.addEventListener('change', () => {
    if (diaSeleccionadoElement) {
        const diaNum = parseInt(diaSeleccionadoElement.querySelector('.dia-numero').textContent);
        const fechaSeleccionada = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
        mostrarTareasDelDia(fechaSeleccionada);
    } else {
        mostrarProximasTareas();
    }
});

// --- Carga inicial ---
document.addEventListener("DOMContentLoaded", () => {
    generarHoras();
    cargarProfesionales();
    cargarTareas();
});