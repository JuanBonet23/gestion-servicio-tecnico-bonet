const templates = {
  diagnostico: "Actúa como ingeniero de automatización industrial. Redacta un diagnóstico técnico claro, profesional y orientado a causa raíz con base en la información del ticket.",
  informe: "Redacta un informe técnico de servicio con secciones: antecedentes, actividades ejecutadas, hallazgos, diagnóstico, recomendaciones y estado final.",
  recomendaciones: "Genera recomendaciones técnicas priorizadas, con lenguaje ejecutivo y enfoque en continuidad operativa, seguridad y mantenibilidad."
};

const defaultTickets = [
  {
    id: "TK-2026-001",
    cliente: "Termotasajero TT1",
    contacto: "Carlos Pérez",
    equipo: "SCADA Planta Agua",
    ubicacion: "Sala de Control",
    prioridad: "Alta",
    estado: "Abierto",
    tecnico: "Juan Bonet",
    fecha: "2026-03-09",
    descripcion: "Falla en visualización de bomba de ayudante coagulante y operación remota no disponible.",
    diagnostico: "Pendiente",
    acciones: "Pendiente",
    antecedentes: "",
    hallazgos: "",
    recomendaciones: "",
    estadoFinal: ""
  },
  {
    id: "TK-2026-002",
    cliente: "Incubadora Santander",
    contacto: "Ana Martínez",
    equipo: "Sistema Marcación Diesel",
    ubicacion: "Skid de Inyección",
    prioridad: "Media",
    estado: "En proceso",
    tecnico: "Luis Romero",
    fecha: "2026-03-08",
    descripcion: "Revisión de registro histórico y generación de reporte de bache.",
    diagnostico: "Posible inconsistencia de timestamps en Node-RED/MySQL.",
    acciones: "Validación de timezone y ajuste de consultas históricas.",
    antecedentes: "",
    hallazgos: "",
    recomendaciones: "",
    estadoFinal: ""
  },
  {
    id: "TK-2026-003",
    cliente: "Petromil",
    contacto: "Laura Gómez",
    equipo: "PLC CompactLogix",
    ubicacion: "Tablero Principal",
    prioridad: "Baja",
    estado: "Cerrado",
    tecnico: "Andrés León",
    fecha: "2026-03-07",
    descripcion: "Soporte de comunicación Modbus TCP con estación Honeywell.",
    diagnostico: "Direcciones de registros incorrectas en mapeo inicial.",
    acciones: "Ajuste de direcciones y prueba punto a punto satisfactoria.",
    antecedentes: "",
    hallazgos: "",
    recomendaciones: "",
    estadoFinal: "Operación restablecida"
  }
];

let tickets = JSON.parse(localStorage.getItem("bonet_tickets") || "null") || defaultTickets;
let selectedTicketId = tickets[0]?.id || null;

function persist() {
  localStorage.setItem("bonet_tickets", JSON.stringify(tickets));
}

function getSelectedTicket() {
  return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
}

function statusClass(status) {
  if (status === "Abierto") return "status-open";
  if (status === "En proceso") return "status-progress";
  return "status-closed";
}

function priorityClass(priority) {
  if (priority === "Alta") return "prio-high";
  if (priority === "Media") return "prio-medium";
  return "prio-low";
}

function updateMetrics() {
  const total = tickets.length;
  const open = tickets.filter((t) => t.estado === "Abierto").length;
  const progress = tickets.filter((t) => t.estado === "En proceso").length;
  const closed = tickets.filter((t) => t.estado === "Cerrado").length;

  ["mTotal", "kpiTotal"].forEach((id) => document.getElementById(id).textContent = total);
  ["mOpen", "kpiOpen"].forEach((id) => document.getElementById(id).textContent = open);
  ["mProgress", "kpiProgress"].forEach((id) => document.getElementById(id).textContent = progress);
  ["mClosed", "kpiClosed"].forEach((id) => document.getElementById(id).textContent = closed);
}

function renderTickets() {
  const container = document.getElementById("ticketList");
  const q = document.getElementById("searchInput").value.toLowerCase().trim();

  const list = tickets.filter((t) =>
    [t.id, t.cliente, t.contacto, t.equipo, t.ubicacion, t.estado, t.tecnico, t.descripcion]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  container.innerHTML = list.map((t) => `
    <div class="ticket-item ${selectedTicketId === t.id ? "active" : ""}" onclick="selectTicket('${t.id}')">
      <div class="ticket-top">
        <div>
          <div class="ticket-title">${t.id}</div>
          <div class="ticket-sub">${t.cliente}</div>
          <div class="ticket-sub">${t.equipo}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <span class="badge ${statusClass(t.estado)}">${t.estado}</span>
          <span class="badge ${priorityClass(t.prioridad)}">${t.prioridad}</span>
        </div>
      </div>
      <div class="meta">
        <div><b>Técnico:</b> ${t.tecnico || "-"}</div>
        <div><b>Fecha:</b> ${t.fecha || "-"}</div>
        <div><b>Ubicación:</b> ${t.ubicacion || "-"}</div>
        <div><b>Contacto:</b> ${t.contacto || "-"}</div>
      </div>
    </div>
  `).join("");

  renderDetail();
  updateMetrics();
}

function selectTicket(id) {
  selectedTicketId = id;
  renderTickets();
  loadReportFromTicket();
}

function renderDetail() {
  const t = getSelectedTicket();
  const box = document.getElementById("ticketDetail");

  if (!t) {
    box.innerHTML = "<p>No hay tickets disponibles.</p>";
    return;
  }

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <h2 style="margin:0 0 8px">${t.id}</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
          <span class="badge ${statusClass(t.estado)}">${t.estado}</span>
          <span class="badge ${priorityClass(t.prioridad)}">Prioridad ${t.prioridad}</span>
        </div>
        <p style="margin:0;color:var(--muted);max-width:900px">${t.descripcion || ""}</p>
      </div>
    </div>

    <div class="detail-grid" style="margin-top:16px">
      <div class="mini"><span>Cliente</span><b>${t.cliente || "-"}</b></div>
      <div class="mini"><span>Contacto</span><b>${t.contacto || "-"}</b></div>
      <div class="mini"><span>Equipo</span><b>${t.equipo || "-"}</b></div>
      <div class="mini"><span>Ubicación</span><b>${t.ubicacion || "-"}</b></div>
    </div>

    <div class="section-title">Seguimiento técnico</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Técnico</th>
            <th>Diagnóstico preliminar</th>
            <th>Acciones ejecutadas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.fecha || "-"}</td>
            <td>${t.tecnico || "-"}</td>
            <td>${t.diagnostico || "-"}</td>
            <td>${t.acciones || "-"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function switchTab(tab, el) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
}

function openModal() {
  document.getElementById("ticketModal").classList.add("show");
  document.getElementById("nFecha").value = new Date().toISOString().slice(0, 10);
}

function closeModal() {
  document.getElementById("ticketModal").classList.remove("show");
}

function clearModal() {
  ["nCliente", "nContacto", "nEquipo", "nUbicacion", "nTecnico", "nDescripcion"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("nPrioridad").value = "Media";
  document.getElementById("nEstado").value = "Abierto";
}

function createTicket() {
  const cliente = document.getElementById("nCliente").value.trim();
  const contacto = document.getElementById("nContacto").value.trim();
  const equipo = document.getElementById("nEquipo").value.trim();
  const ubicacion = document.getElementById("nUbicacion").value.trim();
  const tecnico = document.getElementById("nTecnico").value.trim();
  const prioridad = document.getElementById("nPrioridad").value;
  const estado = document.getElementById("nEstado").value;
  const fecha = document.getElementById("nFecha").value;
  const descripcion = document.getElementById("nDescripcion").value.trim();

  if (!cliente || !equipo || !tecnico || !descripcion) {
    alert("Completa cliente, equipo, técnico y descripción.");
    return;
  }

  const next = tickets.length + 1;
  const id = "TK-2026-" + String(next).padStart(3, "0");

  const ticket = {
    id,
    cliente,
    contacto,
    equipo,
    ubicacion,
    prioridad,
    estado,
    tecnico,
    fecha,
    descripcion,
    diagnostico: "Pendiente",
    acciones: "Pendiente",
    antecedentes: "",
    hallazgos: "",
    recomendaciones: "",
    estadoFinal: ""
  };

  tickets.unshift(ticket);
  selectedTicketId = id;
  persist();
  renderTickets();
  closeModal();
  clearModal();
  loadReportFromTicket();
}

function loadReportFromTicket() {
  const t = getSelectedTicket();
  if (!t) return;

  document.getElementById("rAntecedentes").value = t.antecedentes || "";
  document.getElementById("rActividades").value = t.acciones || "";
  document.getElementById("rHallazgos").value = t.hallazgos || "";
  document.getElementById("rDiagnostico").value = t.diagnostico || "";
  document.getElementById("rRecomendaciones").value = t.recomendaciones || "";
  document.getElementById("rEstadoFinal").value = t.estadoFinal || "";
}

function saveReportToTicket() {
  const t = getSelectedTicket();
  if (!t) return;

  t.antecedentes = document.getElementById("rAntecedentes").value;
  t.acciones = document.getElementById("rActividades").value;
  t.hallazgos = document.getElementById("rHallazgos").value;
  t.diagnostico = document.getElementById("rDiagnostico").value;
  t.recomendaciones = document.getElementById("rRecomendaciones").value;
  t.estadoFinal = document.getElementById("rEstadoFinal").value;

  persist();
  renderTickets();
  alert("Ticket actualizado correctamente.");
}

function generatePrompt() {
  const t = getSelectedTicket();
  if (!t) return;

  const key = document.getElementById("templateSelect").value;
  const prompt = `${templates[key]}

DATOS DEL TICKET:
- Ticket: ${t.id}
- Cliente: ${t.cliente}
- Contacto: ${t.contacto}
- Equipo/Sistema: ${t.equipo}
- Ubicación: ${t.ubicacion}
- Prioridad: ${t.prioridad}
- Estado: ${t.estado}
- Técnico: ${t.tecnico}
- Fecha: ${t.fecha}
- Descripción: ${t.descripcion}
- Antecedentes: ${t.antecedentes || "N/A"}
- Actividades ejecutadas: ${t.acciones || "N/A"}
- Hallazgos: ${t.hallazgos || "N/A"}
- Diagnóstico preliminar: ${t.diagnostico || "N/A"}
- Recomendaciones previas: ${t.recomendaciones || "N/A"}
- Estado final: ${t.estadoFinal || "N/A"}

Instrucciones: redacta en tono profesional, claro, orientado al cliente y listo para ser incluido en informe técnico.`;

  document.getElementById("promptBox").textContent = prompt;
}

function exportCurrentReport() {
  const t = getSelectedTicket();
  if (!t) {
    alert("No hay ticket seleccionado.");
    return;
  }

  const content = `INFORME TÉCNICO

Ticket: ${t.id}
Cliente: ${t.cliente}
Contacto: ${t.contacto}
Equipo: ${t.equipo}
Ubicación: ${t.ubicacion}
Técnico: ${t.tecnico}
Fecha: ${t.fecha}
Estado: ${t.estado}

1. Antecedentes
${t.antecedentes || ""}

2. Actividades ejecutadas
${t.acciones || ""}

3. Hallazgos
${t.hallazgos || ""}

4. Diagnóstico
${t.diagnostico || ""}

5. Recomendaciones
${t.recomendaciones || ""}

6. Estado final
${t.estadoFinal || ""}
`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.id}-informe.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function seedDemoData() {
  if (confirm("Esto reemplazará los datos actuales por la demo base.")) {
    tickets = JSON.parse(JSON.stringify(defaultTickets));
    selectedTicketId = tickets[0].id;
    persist();
    renderTickets();
    loadReportFromTicket();
    document.getElementById("promptBox").textContent = "";
  }
}

renderTickets();
loadReportFromTicket();
