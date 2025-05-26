let fechaActual = new Date();
let tareas = {};
let profesionales = []; // Nuevo: Array para almacenar los profesionales
let tareaSeleccionada = { fecha: null, hora: null };
let diaSeleccionadoElement = null;

// Elementos del formulario
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const horaSelect = document.getElementById("hora");
const profesionalSelect = document.getElementById("profesional"); // Nuevo: select de profesionales
const tareaInput = document.getElementById("descripcion");
const formulario = document.getElementById("formulario");
const panelTareas = document.getElementById("panel-tareas");
const listaProximasTareas = document.getElementById("lista-proximas-tareas");

// Modal de Editar Tarea (existente)
const modalTarea = document.getElementById("modal-tarea");
const inputEditar = document.getElementById("editar-descripcion");
const editarDuracionSelect = document.getElementById("editar-duracion");
const editarProfesionalSelect = document.getElementById("editar-profesional"); // Nuevo: select de profesional en edición
const btnGuardar = document.getElementById("guardar-cambios");
const btnEliminar = document.getElementById("eliminar-tarea");
const btnCancelar = document.getElementById("cancelar-edicion");

// Nuevo Modal de Detalles de Tarea
const modalDetalles = document.getElementById("modal-detalles");
const detalleFechaSpan = document.getElementById("detalle-fecha");
const detalleHoraSpan = document.getElementById("detalle-hora");
const detalleDuracionSpan = document.getElementById("detalle-duracion");
const detalleProfesionalSpan = document.getElementById("detalle-profesional");
const detalleDescripcionSpan = document.getElementById("detalle-descripcion");
const cerrarDetallesBtn = document.getElementById("cerrar-detalles");


// Función para cargar los profesionales desde profesionales.json
function cargarProfesionales() {
    fetch("profesionales.json")
        .then(response => response.json())
        .then(data => {
            profesionales = data;
            llenarSelectProfesionales(profesionalSelect); // Llenar el select del formulario
            llenarSelectProfesionales(editarProfesionalSelect); // Llenar el select del modal de edición
        })
        .catch(error => console.error("Error al cargar profesionales:", error));
}

// Función para llenar un select con los profesionales
function llenarSelectProfesionales(selectElement) {
    selectElement.innerHTML = "";

    // Añadir la opción predeterminada "Pulse para seleccionar"
    const defaultOption = document.createElement("option");
    defaultOption.value = ""; // Valor vacío
    defaultOption.textContent = "Pulse para seleccionar";
    defaultOption.selected = true; // Seleccionada por defecto
    defaultOption.disabled = true; // Opcional: Deshabilitar para que no pueda ser seleccionada si no hay otra opción
    selectElement.appendChild(defaultOption);

    if (profesionales.length === 0) {
        // Si no hay profesionales, la opción por defecto ya está ahí.
        // Podríamos cambiar su texto si quisiéramos, por ejemplo, "No hay profesionales cargados".
        // defaultOption.textContent = "No hay profesionales disponibles";
        selectElement.disabled = true; // Deshabilitar si no hay profesionales
    } else {
        selectElement.disabled = false;
        profesionales.forEach(profesional => {
            const option = document.createElement("option");
            option.value = profesional;
            option.textContent = profesional;
            selectElement.appendChild(option);
        });
    }
}


function generarCalendario() {
  calendar.innerHTML = "";
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const diaInicio = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

  const nombreMes = fechaActual.toLocaleString("es-ES", { month: "long" });
  monthYear.textContent = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anio}`;

  const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  nombresDias.forEach((dia) => {
    const div = document.createElement("div");
    div.className = "nombre-dia";
    div.textContent = dia;
    calendar.appendChild(div);
  });

  for (let i = 0; i < diaInicio; i++) {
    const div = document.createElement("div");
    div.className = "dia vacio";
    calendar.appendChild(div);
  }

  const hoy = new Date();
  const hoyAnio = hoy.getFullYear();
  const hoyMes = hoy.getMonth();
  const hoyDia = hoy.getDate();

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const div = document.createElement("div");
    div.className = "dia";
    const diaTexto = d.toString().padStart(2, "0");
    const mesTexto = (mes + 1).toString().padStart(2, "0");
    const claveFecha = `${anio}-${mesTexto}-${diaTexto}`;

    div.textContent = d;
    div.dataset.fecha = claveFecha;

    if (d === hoyDia && mes === hoyMes && anio === hoyAnio) {
      div.classList.add("dia-actual");
    }

    if (tareas[claveFecha]) {
      div.classList.add("con-tarea");
    }

    div.addEventListener("click", () => {
        if (diaSeleccionadoElement) {
            diaSeleccionadoElement.classList.remove("dia-seleccionado");
        }
        div.classList.add("dia-seleccionado");
        diaSeleccionadoElement = div;

        mostrarTareas(claveFecha);
    });

    calendar.appendChild(div);
  }
}

function generarHoras() {
  const horaSelect = document.getElementById("hora");
  horaSelect.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hora = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    }
  }
}
document.addEventListener("DOMContentLoaded", generarHoras);


function mostrarTareas(fecha) {
  panelTareas.innerHTML = `<h3>Tareas para ${fecha}</h3>`;

  if (tareas[fecha]) {
    const horas = Object.keys(tareas[fecha]).sort();

    horas.forEach((hora) => {
      // Ahora cada tarea incluye 'profesional'
      const { texto, duracion, profesional } = tareas[fecha][hora];
      const div = document.createElement("div");
      div.className = "tarea-item";
      const duracionTexto = duracion ? ` (${duracion}m)` : "";
      const profesionalTexto = profesional ? `<br><span>${profesional}</span>` : ''; // Mostrar profesional si existe

      div.innerHTML = `
        <div>
            <strong>${hora}${duracionTexto}</strong> : ${texto}
            ${profesionalTexto}
        </div>
        <div>
            <button class="detalles-btn" data-fecha="${fecha}" data-hora="${hora}">ℹ️</button>
            <button class="editar-btn" data-fecha="${fecha}" data-hora="${hora}">✏️</button>
        </div>
      `;
      panelTareas.appendChild(div);
    });

    // Event listener para el botón de editar (ya existente)
    document.querySelectorAll(".editar-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const fecha = btn.dataset.fecha;
            const hora = btn.dataset.hora;
            const tarea = tareas[fecha][hora];

            tareaSeleccionada = { fecha, hora };

            inputEditar.value = tarea.texto || "";
            editarDuracionSelect.value = tarea.duracion || "60";
            // Asignar el profesional actual de la tarea al select del modal de edición
            editarProfesionalSelect.value = tarea.profesional || profesionales[0] || "";
            
            modalTarea.dataset.fecha = fecha;
            modalTarea.dataset.hora = hora;
            modalTarea.style.display = "flex";
        });
    });

    // Nuevo Event listener para el botón de detalles
    document.querySelectorAll(".detalles-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const fecha = btn.dataset.fecha;
            const hora = btn.dataset.hora;
            const tarea = tareas[fecha][hora];
            
            // Rellenar el modal de detalles
            detalleFechaSpan.textContent = fecha;
            detalleHoraSpan.textContent = hora;
            detalleDuracionSpan.textContent = tarea.duracion || "N/A";
            detalleProfesionalSpan.textContent = tarea.profesional || "No asignado";
            detalleDescripcionSpan.textContent = tarea.texto || "Sin descripción";

            modalDetalles.style.display = "flex";
        });
    });

  } else {
    panelTareas.innerHTML += "<p>No hay tareas para este día.</p>";
  }
}

function guardarTareasEnServidor() {
  fetch("guardar_tarea.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tareas),
  })
    .then((res) => res.json())
    .then(() => {
        generarCalendario();
        mostrarProximasTareas();
        // Si hay un día seleccionado, recargar sus tareas para que el profesional se vea
        if (diaSeleccionadoElement) {
            const fechaSel = diaSeleccionadoElement.dataset.fecha;
            mostrarTareas(fechaSel);
        }
    });
}

function cargarTareas() {
  fetch("tareas.json")
    .then((res) => res.json())
    .then((data) => {
      tareas = data;
      generarCalendario();
      mostrarProximasTareas();

      const hoy = new Date();
      const anio = hoy.getFullYear();
      const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
      const dia = hoy.getDate().toString().padStart(2, '0');
      const claveHoy = `${anio}-${mes}-${dia}`;
      
      const diaElementoHoy = calendar.querySelector(`.dia[data-fecha="${claveHoy}"]`);
      if (diaElementoHoy) {
          diaElementoHoy.click();
      } else {
          panelTareas.innerHTML = "<h3>Selecciona un día para ver tareas</h3>";
      }
    })
    .catch(error => console.error("Error al cargar tareas:", error)); // Añadir catch para depuración
}

function mostrarProximasTareas() {
    listaProximasTareas.innerHTML = ""; // Limpiar la lista actual
    const ahora = new Date();
    const tareasOrdenadas = [];

    // Recorrer todas las tareas y crear un array con objetos Date para facilitar la comparación
    for (const fecha in tareas) {
        for (const hora in tareas[fecha]) {
            const [anio, mes, dia] = fecha.split("-");
            const [h, m] = hora.split(":");
            const fechaHoraTarea = new Date(anio, mes - 1, dia, h, m); // mes-1 porque los meses son 0-indexados
            
            // Solo añadir tareas que aún no han pasado
            if (fechaHoraTarea >= ahora) {
                tareasOrdenadas.push({
                    fecha: fecha,
                    hora: hora,
                    texto: tareas[fecha][hora].texto,
                    duracion: tareas[fecha][hora].duracion,
                    profesional: tareas[fecha][hora].profesional, // Incluir profesional
                    timestamp: fechaHoraTarea.getTime() // Para ordenar fácilmente
                });
            }
        }
    }

    // Ordenar las tareas por fecha y hora
    tareasOrdenadas.sort((a, b) => a.timestamp - b.timestamp);

    // Mostrar las próximas 10 tareas
    const proximas10 = tareasOrdenadas.slice(0, 10);

    if (proximas10.length > 0) {
        proximas10.forEach(tarea => {
            const div = document.createElement("div");
            div.className = "proxima-tarea-item";
            const [anio, mes, dia] = tarea.fecha.split("-");
            const fechaFormateada = `${dia}/${mes}/${anio}`;
            const profesionalTexto = tarea.profesional ? ` (${tarea.profesional})` : '';
            
            div.innerHTML = `
                <div>
                    <strong>${tarea.hora} - ${tarea.texto}</strong>
                    <span>${fechaFormateada} (${tarea.duracion}m)${profesionalTexto}</span>
                </div>
                <button class="detalles-btn" data-fecha="${tarea.fecha}" data-hora="${tarea.hora}">ℹ️</button>
            `;
            listaProximasTareas.appendChild(div);
        });

        // **NUEVO: Añadir event listeners para los botones de detalles en "Próximas Tareas"**
        document.querySelectorAll("#lista-proximas-tareas .detalles-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const fecha = btn.dataset.fecha;
                const hora = btn.dataset.hora;
                const tarea = tareas[fecha][hora];
                
                // Rellenar el modal de detalles (la misma lógica que en mostrarTareas)
                detalleFechaSpan.textContent = fecha;
                detalleHoraSpan.textContent = hora;
                detalleDuracionSpan.textContent = tarea.duracion || "N/A";
                detalleProfesionalSpan.textContent = tarea.profesional || "No asignado";
                detalleDescripcionSpan.textContent = tarea.texto || "Sin descripción";

                modalDetalles.style.display = "flex";
            });
        });

    } else {
        listaProximasTareas.innerHTML = "<p>No hay próximas tareas.</p>";
    }
}


formulario.addEventListener("submit", function (e) {
  e.preventDefault();
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const duracion = document.getElementById("duracion").value;
  const profesional = document.getElementById("profesional").value;
  const texto = tareaInput.value.trim();

  // La validación ahora asegura que profesional no sea un string vacío ("")
  if (!fecha || !hora || !duracion || !texto || !profesional) {
      alert("Por favor, rellena todos los campos.");
      return;
  }

  if (!tareas[fecha]) tareas[fecha] = {};
  tareas[fecha][hora] = {
    texto: texto,
    duracion: duracion,
    profesional: profesional
  };

  guardarTareasEnServidor();
  formulario.reset();
  // Restablecer el select de profesional a su valor por defecto ("")
  profesionalSelect.value = ""; // Esto seleccionará "Pulse para seleccionar"
});

btnGuardar.addEventListener("click", () => {
  const nuevaDescripcion = inputEditar.value.trim();
  const nuevaDuracion = editarDuracionSelect.value;
  const nuevoProfesional = editarProfesionalSelect.value; // Obtener el nuevo profesional
  const { fecha, hora } = tareaSeleccionada;

  if (nuevaDescripcion && fecha && hora && nuevoProfesional) { // Validar también el profesional
    tareas[fecha][hora] = {
      texto: nuevaDescripcion,
      duracion: nuevaDuracion,
      profesional: nuevoProfesional // Guardar el profesional actualizado
    };
    guardarTareasEnServidor();
    // mostrarTareas(fecha); // Esto ya se llama dentro de guardarTareasEnServidor al final de la promesa
    modalTarea.style.display = "none";
  } else {
      alert("Por favor, rellena todos los campos de edición.");
  }
});


btnEliminar.addEventListener("click", () => {
  const { fecha, hora } = tareaSeleccionada;
  if (fecha && hora) {
    delete tareas[fecha][hora];
    if (Object.keys(tareas[fecha]).length === 0) {
      delete tareas[fecha];
    }
    guardarTareasEnServidor();
    modalTarea.style.display = "none";
  }
});

btnCancelar.addEventListener("click", () => {
  modalTarea.style.display = "none";
});

// Event listener para cerrar el modal de detalles
cerrarDetallesBtn.addEventListener("click", () => {
    modalDetalles.style.display = "none";
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

document.addEventListener("DOMContentLoaded", () => {
  cargarProfesionales(); // Cargar los profesionales al inicio
  cargarTareas(); // Y luego cargar las tareas
});