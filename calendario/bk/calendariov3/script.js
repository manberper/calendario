// Variables globales
let fechaActual = new Date();
let tareas = {};
let profesionales = [];
let tareaSeleccionada = { fecha: null, hora: null, indiceEnArray: null };
let diaSeleccionadoElement = null;
let vistaActual = 'mes'; // Variable para controlar la vista actual

// Elementos del DOM
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const fechaInput = document.getElementById("fecha");
const duracionSelect = document.getElementById("duracion"); // Asegúrate de que esta variable existe
const horaSelect = document.getElementById("hora");
const profesionalSelect = document.getElementById("profesional");
const tareaInput = document.getElementById("descripcion");
const formulario = document.getElementById("formulario");
const panelTareas = document.getElementById("panel-tareas");
const listaProximasTareas = document.getElementById("lista-proximas-tareas");
const filtroProfesionalSelect = document.getElementById("filtro-profesional");
const listaTareasDia = document.getElementById("lista-tareas-dia");

// Modal de Editar Tarea
const modalTarea = document.getElementById("modal-tarea");
const inputEditar = document.getElementById("editar-descripcion");
const editarDuracionSelect = document.getElementById("editar-duracion");
const editarProfesionalSelect = document.getElementById("editar-profesional");
const btnGuardar = document.getElementById("guardar-cambios");
const btnEliminar = document.getElementById("eliminar-tarea");
const btnCancelar = document.getElementById("cancelar-edicion");
const editarFechaInput = document.getElementById("editar-fecha");
const editarHoraSelect = document.getElementById("editar-hora");

// Modal de Detalles de Tarea
const modalDetalles = document.getElementById("modal-detalles");
const detalleFechaSpan = document.getElementById("detalle-fecha");
const detalleHoraSpan = document.getElementById("detalle-hora");
const detalleDuracionSpan = document.getElementById("detalle-duracion");
const detalleProfesionalSpan = document.getElementById("detalle-profesional");
const detalleDescripcionSpan = document.getElementById("detalle-descripcion");
const cerrarDetallesBtn = document.getElementById("cerrar-detalles");
const editarTareaDesdeDetallesBtn = document.getElementById("editar-tarea-desde-detalles");

// Botones de vista
const viewMonthBtn = document.getElementById('view-month');
const viewWeekBtn = document.getElementById('view-week');
const viewDayBtn = document.getElementById('view-day');


// --- Funciones de Utilidad ---

function formatearFecha(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Enero es 0!
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function generarHoras() {
    horaSelect.innerHTML = "";
    editarHoraSelect.innerHTML = "";
    for (let i = 8; i < 21; i++) { // Horas de 8:00 a 20:00
        const hora = String(i).padStart(2, "0") + ":00";
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;
        horaSelect.appendChild(option);

        const editarOption = document.createElement("option");
        editarOption.value = hora;
        editarOption.textContent = hora;
        editarHoraSelect.appendChild(editarOption);
    }
}

async function cargarProfesionales() {
    try {
        // Realizar una llamada a fetch para obtener el JSON de profesionales
        const response = await fetch('profesionales.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        profesionales = await response.json(); // Asignar el array de profesionales directamente
        
        console.log("Profesionales cargados:", profesionales); // Para depuración
        cargarOpcionesProfesional(); // Llamar a esta función después de cargar los profesionales
    } catch (error) {
        console.error("Error al cargar profesionales:", error);
        alert("No se pudieron cargar los profesionales.");
    }
}

function cargarOpcionesProfesional() {
    profesionalSelect.innerHTML = '<option value="">Selecciona un profesional</option>'; // Opción por defecto
    editarProfesionalSelect.innerHTML = '<option value="">Selecciona un profesional</option>'; // Opción por defecto
    filtroProfesionalSelect.innerHTML = '<option value="">Todos los profesionales</option>'; // Opción por defecto

    profesionales.forEach(prof => {
        const option = document.createElement("option");
        option.value = prof.id;
        option.textContent = prof.nombre;
        profesionalSelect.appendChild(option);

        const editarOption = document.createElement("option");
        editarOption.value = prof.id;
        editarOption.textContent = prof.nombre;
        editarProfesionalSelect.appendChild(editarOption);

        const filtroOption = document.createElement("option");
        filtroOption.value = prof.id;
        filtroOption.textContent = prof.nombre;
        filtroProfesionalSelect.appendChild(filtroOption);
    });
    // Establecer la primera opción no vacía como seleccionada si existe
    if (profesionales.length > 0) {
        profesionalSelect.value = ''; // Asegurar que inicia con "Selecciona un profesional"
        editarProfesionalSelect.value = ''; // Asegurar que inicia con "Selecciona un profesional"
        filtroProfesionalSelect.value = ''; // Asegurar que inicia con "Todos los profesionales"
    }
}

async function cargarTareasDelServidor() {
    return new Promise(async (resolve, reject) => { // Asegúrate de que Promise recibe async function y reject
        try {
            const response = await fetch('tareas.json');
            if (!response.ok) {
                // Aquí se capturaría un 404, 500, etc.
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tareasCargadas = await response.json();
            
            // Convertir duraciones de string a number al cargar
            for (const fecha in tareasCargadas) {
                tareasCargadas[fecha] = tareasCargadas[fecha].map(tarea => ({
                    ...tarea,
                    duracion: parseInt(tarea.duracion) // Asegura que duración sea un número
                }));
            }
            tareas = tareasCargadas;
            console.log("Tareas cargadas (desde JSON):", tareas); // Debugging
            resolve(); // Resuelve la promesa una vez que las tareas se han cargado con éxito
        } catch (error) {
            console.error("Error al cargar tareas:", error);
            alert("No se pudieron cargar las tareas."); // Esto es lo que estás viendo
            reject(error); // Rechaza la promesa si hay un error
        }
    });
}


function guardarTareasEnServidor() {
    localStorage.setItem('tareasCalendario', JSON.stringify(tareas));
    renderizarTodoElCalendarioUI(); // Actualiza la UI después de guardar
}


function renderizarProximasTareas() {
    listaProximasTareas.innerHTML = "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    const tareasProximas = [];

    // Iterar sobre todas las fechas en el objeto tareas
    for (const fechaStr in tareas) {
        const fechaTarea = new Date(fechaStr + 'T00:00:00'); // Asegurarse de que la fecha se interprete como local
        
        // Solo considerar tareas a partir de hoy
        if (fechaTarea >= hoy) {
            tareas[fechaStr].forEach((tarea, index) => {
                // Crear un objeto Date completo para comparar horas también
                const [hora, minuto] = tarea.hora.split(':').map(Number);
                const fechaHoraTarea = new Date(fechaTarea);
                fechaHoraTarea.setHours(hora, minuto, 0, 0);

                // Si la tarea es hoy o en el futuro
                if (fechaHoraTarea >= new Date()) { // Comparamos con la fecha y hora actuales
                    tareasProximas.push({
                        fecha: fechaStr,
                        hora: tarea.hora,
                        descripcion: tarea.descripcion,
                        profesional: tarea.profesional,
                        duracion: tarea.duracion,
                        indice: index // Para poder editar/eliminar la tarea original
                    });
                }
            });
        }
    }

    // Ordenar las tareas por fecha y luego por hora
    tareasProximas.sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha}T${a.hora}`);
        const fechaHoraB = new Date(`${b.fecha}T${b.hora}`);
        return fechaHoraA - fechaHoraB;
    });

    // Mostrar solo las 5 próximas tareas
    tareasProximas.slice(0, 5).forEach(tarea => {
        const li = document.createElement("li");
        li.classList.add("tarea-card");
        li.dataset.fecha = tarea.fecha;
        li.dataset.hora = tarea.hora;
        li.dataset.indice = tarea.indice;

        li.innerHTML = `
            <p class="tarea-hora">${tarea.hora} - ${tarea.fecha.substring(5, 10).replace('-', '/')}</p>
            <p class="tarea-descripcion">${tarea.descripcion}</p>
            <p class="tarea-profesional">${profesionales.find(p => p.id === tarea.profesional)?.nombre || 'Desconocido'}</p>
        `;
        listaProximasTareas.appendChild(li);
    });

    if (tareasProximas.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay próximas tareas.";
        listaProximasTareas.appendChild(li);
    }
}

function renderizarTareasDelDiaSeleccionado(fecha) {
    listaTareasDia.innerHTML = "";
    if (!fecha) {
        listaTareasDia.innerHTML = "<p>Selecciona un día para ver sus tareas.</p>";
        return;
    }

    const tareasHoy = tareas[fecha] || [];
    const profesionalFiltroId = filtroProfesionalSelect.value;
    
    let tareasFiltradas = tareasHoy;
    if (profesionalFiltroId) {
        tareasFiltradas = tareasHoy.filter(tarea => tarea.profesional === profesionalFiltroId);
    }

    if (tareasFiltradas.length === 0) {
        listaTareasDia.innerHTML = `<p>No hay tareas para ${fecha} ${profesionalFiltroId ? `con el profesional seleccionado` : ''}.</p>`;
        return;
    }

    // Ordenar tareas por hora
    tareasFiltradas.sort((a, b) => a.hora.localeCompare(b.hora));

    tareasFiltradas.forEach((tarea, index) => {
        const li = document.createElement("li");
        li.classList.add("tarea-card");
        li.dataset.fecha = fecha;
        // Para editar/eliminar, necesitamos el índice original en el array de tareas[fecha]
        // No el índice en tareasFiltradas. Buscamos el índice original.
        const originalIndex = tareasHoy.indexOf(tarea); 
        li.dataset.indice = originalIndex;

        li.innerHTML = `
            <p class="tarea-hora">${tarea.hora} (${tarea.duracion} min)</p>
            <p class="tarea-descripcion">${tarea.descripcion}</p>
            <p class="tarea-profesional">${profesionales.find(p => p.id === tarea.profesional)?.nombre || 'Desconocido'}</p>
        `;
        listaTareasDia.appendChild(li);
    });
}

function abrirModalEdicion() {
    if (tareaSeleccionada.fecha !== null && tareaSeleccionada.indiceEnArray !== null) {
        const tareasDelDia = tareas[tareaSeleccionada.fecha];
        if (tareasDelDia && tareasDelDia[tareaSeleccionada.indiceEnArray]) {
            const tarea = tareasDelDia[tareaSeleccionada.indiceEnArray];
            editarFechaInput.value = tareaSeleccionada.fecha;
            editarHoraSelect.value = tarea.hora;
            inputEditar.value = tarea.descripcion;
            editarDuracionSelect.value = tarea.duracion; // Asegúrate de que este es un número
            editarProfesionalSelect.value = tarea.profesional;
            modalTarea.style.display = "flex";
            modalDetalles.style.display = "none"; // Asegurar que el modal de detalles se cierre
        } else {
            alert("Error: Tarea no encontrada para edición.");
        }
    } else {
        alert("No hay tarea seleccionada para editar.");
    }
}

function abrirModalDetalles(fecha, hora, descripcion, duracion, profesionalId, originalIndex) {
    tareaSeleccionada = { fecha: fecha, hora: hora, indiceEnArray: originalIndex };

    const profesionalNombre = profesionales.find(p => p.id === profesionalId)?.nombre || 'Desconocido';

    detalleFechaSpan.textContent = fecha;
    detalleHoraSpan.textContent = hora;
    detalleDuracionSpan.textContent = duracion;
    detalleProfesionalSpan.textContent = profesionalNombre;
    detalleDescripcionSpan.textContent = descripcion;

    modalDetalles.style.display = "flex";
}

// --- Event Listeners ---

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const fecha = fechaInput.value;
  const duracion = parseInt(duracionSelect.value); // Convertir a número
  const hora = horaSelect.value;
  const profesional = profesionalSelect.value;
  const descripcion = tareaInput.value;

  // Validar que se ha seleccionado un profesional
  if (!profesional) {
      alert("Por favor, selecciona un profesional.");
      return;
  }

  if (!tareas[fecha]) {
    tareas[fecha] = [];
  }

  // Verificar solapamiento de horas para el mismo profesional
  const [nuevaHora, nuevoMinuto] = hora.split(':').map(Number);
  const nuevaHoraInicioMs = new Date(`${fecha}T${hora}`).getTime();
  const nuevaHoraFinMs = nuevaHoraInicioMs + (duracion * 60 * 1000);

  const solapamiento = tareas[fecha].some(tareaExistente => {
      if (tareaExistente.profesional !== profesional) {
          return false; // No hay solapamiento si es otro profesional
      }

      const [existenteHora, existenteMinuto] = tareaExistente.hora.split(':').map(Number);
      const existenteHoraInicioMs = new Date(`${fecha}T${tareaExistente.hora}`).getTime();
      const existenteHoraFinMs = existenteHoraInicioMs + (tareaExistente.duracion * 60 * 1000);

      // Comprobar si hay solapamiento
      return (nuevaHoraInicioMs < existenteHoraFinMs && nuevaHoraFinMs > existenteHoraInicioMs);
  });

  if (solapamiento) {
      alert(`El profesional ${profesionales.find(p => p.id === profesional)?.nombre} ya tiene una tarea programada que se solapa con este horario. Por favor, elige otra hora o profesional.`);
      return;
  }

  tareas[fecha].push({
    hora,
    duracion,
    profesional,
    descripcion,
  });

  // Limpiar formulario
  fechaInput.value = "";
  horaSelect.value = "08:00";
  profesionalSelect.value = ""; // Vuelve a la opción por defecto "Selecciona un profesional"
  tareaInput.value = "";

  guardarTareasEnServidor();
});

// Delegación de eventos para las listas de tareas
panelTareas.addEventListener("click", (e) => {
    const tareaCard = e.target.closest(".tarea-card");
    if (tareaCard) {
        const fecha = tareaCard.dataset.fecha;
        const hora = tareaCard.dataset.hora;
        const index = parseInt(tareaCard.dataset.indice); // Índice original

        const tarea = tareas[fecha][index];
        if (tarea) {
            abrirModalDetalles(fecha, tarea.hora, tarea.descripcion, tarea.duracion, tarea.profesional, index);
        }
    }
});

listaProximasTareas.addEventListener("click", (e) => {
    const tareaCard = e.target.closest(".tarea-card");
    if (tareaCard) {
        const fecha = tareaCard.dataset.fecha;
        const hora = tareaCard.dataset.hora;
        const index = parseInt(tareaCard.dataset.indice); // Índice original

        const tarea = tareas[fecha][index];
        if (tarea) {
            abrirModalDetalles(fecha, tarea.hora, tarea.descripcion, tarea.duracion, tarea.profesional, index);
        }
    }
});


btnGuardar.addEventListener("click", () => {
  if (tareaSeleccionada.fecha !== null && tareaSeleccionada.indiceEnArray !== null) {
    const tareasDelDia = tareas[tareaSeleccionada.fecha];
    if (tareasDelDia && tareasDelDia[tareaSeleccionada.indiceEnArray]) {
        // Obtener la tarea original
        const tareaOriginal = tareasDelDia[tareaSeleccionada.indiceEnArray];

        // Crear la nueva tarea con los valores editados
        const nuevaTarea = {
            hora: editarHoraSelect.value,
            duracion: parseInt(editarDuracionSelect.value),
            profesional: editarProfesionalSelect.value,
            descripcion: inputEditar.value
        };

        // Validar que se ha seleccionado un profesional en la edición
        if (!nuevaTarea.profesional) {
            alert("Por favor, selecciona un profesional para la tarea editada.");
            return;
        }

        // Verificar solapamiento antes de guardar, excluyendo la tarea que estamos editando
        const [nuevaHora, nuevoMinuto] = nuevaTarea.hora.split(':').map(Number);
        const nuevaHoraInicioMs = new Date(`${tareaSeleccionada.fecha}T${nuevaTarea.hora}`).getTime();
        const nuevaHoraFinMs = nuevaHoraInicioMs + (nuevaTarea.duracion * 60 * 1000);

        const solapamiento = tareasDelDia.some((tareaExistente, idx) => {
            if (idx === tareaSeleccionada.indiceEnArray) {
                return false; // Ignorar la tarea que estamos editando
            }
            if (tareaExistente.profesional !== nuevaTarea.profesional) {
                return false; // No hay solapamiento si es otro profesional
            }

            const [existenteHora, existenteMinuto] = tareaExistente.hora.split(':').map(Number);
            const existenteHoraInicioMs = new Date(`${tareaSeleccionada.fecha}T${tareaExistente.hora}`).getTime();
            const existenteHoraFinMs = existenteHoraInicioMs + (tareaExistente.duracion * 60 * 1000);

            return (nuevaHoraInicioMs < existenteHoraFinMs && nuevaHoraFinMs > existenteHoraInicioMs);
        });

        if (solapamiento) {
            alert(`El profesional ${profesionales.find(p => p.id === nuevaTarea.profesional)?.nombre} ya tiene una tarea programada que se solapa con este horario. Por favor, elige otra hora o profesional.`);
            return;
        }

        // Si no hay solapamiento, actualizar la tarea
        tareasDelDia[tareaSeleccionada.indiceEnArray] = nuevaTarea;
        guardarTareasEnServidor();
        modalTarea.style.display = "none";
    } else {
        alert("Error: Tarea seleccionada no válida para guardar.");
    }
  }
});

btnEliminar.addEventListener("click", () => {
  if (tareaSeleccionada.fecha !== null && tareaSeleccionada.indiceEnArray !== null) {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        // Eliminar la tarea del array
        tareas[tareaSeleccionada.fecha].splice(tareaSeleccionada.indiceEnArray, 1);

        // Si no quedan tareas para esa fecha, eliminar la entrada de la fecha
        if (tareas[tareaSeleccionada.fecha].length === 0) {
            delete tareas[tareaSeleccionada.fecha];
        }
        guardarTareasEnServidor(); // Esto llamará a renderizarTodoElCalendarioUI
        modalTarea.style.display = "none"; // Cerrar el modal de edición
        modalDetalles.style.display = "none"; // Asegurar que el modal de detalles también se cierre
    } else {
        alert("La tarea a eliminar no se encontró.");
    }
  }
});

btnCancelar.addEventListener("click", () => {
  modalTarea.style.display = "none"; // Cerrar el modal de edición
});

cerrarDetallesBtn.addEventListener("click", () => {
    modalDetalles.style.display = "none";
});

editarTareaDesdeDetallesBtn.addEventListener("click", () => {
    abrirModalEdicion(); // Llama a la función para abrir el modal de edición
});

prevMonthBtn.addEventListener("click", () => {
  fechaActual.setMonth(fechaActual.getMonth() - 1);
  renderizarTodoElCalendarioUI();
});

nextMonthBtn.addEventListener("click", () => {
  fechaActual.setMonth(fechaActual.getMonth() + 1);
  renderizarTodoElCalendarioUI();
});

// Event listener para el filtro de profesionales
filtroProfesionalSelect.addEventListener('change', () => {
    renderizarTodoElCalendarioUI(); // Esta es la clave para que todo se actualice
});


// --- Carga inicial al cargar la página ---
document.addEventListener("DOMContentLoaded", () => {
    generarHoras();
    cargarProfesionales()
        .then(() => cargarTareasDelServidor()) // Encadenar las promesas correctamente
        .then(() => {
            renderizarTodoElCalendarioUI();
            fechaInput.value = formatearFecha(new Date());
        })
        .catch(error => {
            console.error("Error en la secuencia de inicialización:", error);
            // Si hay un error aquí, ya se habrá mostrado un alert en cargarTareasDelServidor
        });
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
    renderizarTodoElCalendarioUI();
});