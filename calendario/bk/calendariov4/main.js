// main.js - Variables globales y funciones de utilidad

// Variables globales
let fechaActual = new Date();
let tareas = {}; // Las tareas ahora contendrán un array para cada hora
let profesionales = [];
let tareaSeleccionada = { fecha: null, hora: null, indiceEnArray: null }; // Añadimos indiceEnArray
let diaSeleccionadoElement = null;
let vistaActual = 'mes'; // 'mes', 'semana', 'dia'

// Elementos del DOM (accesibles globalmente o pasados a funciones)
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

// --- Funciones de Carga y Guardado (comunes a todas las vistas) ---

async function cargarTareas() {
    try {
        const response = await fetch("cargar.php");
        const data = await response.json();
        const convertedData = {};
        for (const fecha in data) {
            convertedData[fecha] = {};
            for (const hora in data[fecha]) {
                if (!Array.isArray(data[fecha][hora])) {
                    convertedData[fecha][hora] = [data[fecha][hora]];
                } else {
                    convertedData[fecha][hora] = data[fecha][hora];
                }
            }
        }
        tareas = convertedData;
        // Llama a generarCalendario y mostrarProximasTareas desde la función de inicialización
        // para asegurar que las tareas estén cargadas antes de renderizar
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

// --- Funciones del Modal (comunes a todas las vistas) ---

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

// --- Event Listeners del Formulario y Modales (comunes) ---

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    fechaInput.min = `${year}-${month}-${day}`;
});

formulario.addEventListener("submit", async (e) => {
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

    await guardarTareasEnServidor(); // Esperar a que se guarde antes de regenerar
    generarCalendario(fechaActual, vistaActual); // Regenerar calendario con la vista actual
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
                    generarCalendario(fechaActual, vistaActual); // Regenerar calendario con la vista actual
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
                        generarCalendario(fechaActual, vistaActual); // Regenerar calendario con la vista actual
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

// Listener para el filtro de profesional (se mantiene aquí porque afecta a las tareas)
filtroProfesionalSelect.addEventListener('change', () => {
    // Al cambiar el filtro, volvemos a mostrar las tareas del día actual
    if (diaSeleccionadoElement) {
        const diaNum = parseInt(diaSeleccionadoElement.querySelector('.dia-numero').textContent);
        const fechaSeleccionada = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
        mostrarTareasDelDia(fechaSeleccionada);
    } else {
        // Si no hay día seleccionado (ej. al inicio), aplicamos el filtro a las "próximas tareas"
        mostrarProximasTareas();
    }
});

// Función de inicialización principal (llamada al final de este archivo)
async function inicializarApp() {
    generarHoras();
    await cargarProfesionales();
    await cargarTareas(); // Asegurarse de que las tareas estén cargadas antes de generar el calendario
    generarCalendario(fechaActual, vistaActual); // Renderizar el calendario con la vista inicial
    mostrarProximasTareas(); // Mostrar las próximas tareas al inicio
}

document.addEventListener("DOMContentLoaded", inicializarApp);