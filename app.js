import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const templates = {
  diagnostico: "Actúa como ingeniero de automatización industrial. Redacta un diagnóstico técnico claro, profesional y orientado a causa raíz con base en la información del ticket.",
  informe: "Redacta un informe técnico de servicio con secciones: antecedentes, actividades ejecutadas, hallazgos, diagnóstico, recomendaciones y estado final.",
  recomendaciones: "Genera recomendaciones técnicas priorizadas, con lenguaje ejecutivo y enfoque en continuidad operativa, seguridad y mantenibilidad."
};

const defaultTickets = [
  {
    ticketId: "TK-2026-001",
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
    ticketId: "TK-2026-002",
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
    ticketId: "TK-2026-003",
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

let tickets = [];
let selectedTicketId = null;
let currentUser = null;

const $ = (id) => document.getElementById(id);

function showMessage(message) {
  console.log(message);
}

function setAuthStatus(text) {
  $("authStatus").textContent = text;
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

function getSelectedTicket() {
  return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
}

function updateMetrics() {
  const total = tickets.length;
  const open = tickets.filter((t) => t.estado === "Abierto").length;
  const progress = tickets.filter((t) => t.estado === "En proceso").length;
  const closed = tickets.filter((t) => t.estado === "Cerrado").length;

  ["mTotal", "kpiTotal"].forEach((id) => $(id).textContent = total);
  ["mOpen", "kpiOpen"].forEach((id) => $(id).textContent = open);
  ["mProgress", "kpiProgress"].forEach((id) => $(id).textContent = progress);
  ["mClosed", "kpiClosed"].forEach((id) => $(id).textContent = closed);
}

function renderTickets() {
  const q = $("searchInput").value.toLowerCase().trim();
  const list = tickets.filter((t) =>
    [t.ticketId, t.cliente, t.contacto, t.equipo, t.ubicacion, t.estado, t.tecnico, t.descripcion]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  $("ticketList").innerHTML = list.map((t) => `
    <div class="ticket-item ${selectedTicketId === t.id ? "active" : ""}" data-id="${t.id}">
      <div class="ticket-top">
        <div>
          <div class="ticket-title">${t.ticketId}</div>
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

  document.querySelectorAll(".ticket-item").forEach((item) => {
    item.addEventListener("click", () => selectTicket(item.dataset.id));
  });

  renderDetail();
  updateMetrics();
}

function renderDetail() {
  const t = getSelectedTicket();
  if (!t) {
    $("ticketDetail").innerHTML = "<p>No hay tickets disponibles.</p>";
    return;
  }

  $("ticketDetail").innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <h2 style="margin:0 0 8px">${t.ticketId}</h2>
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

function loadReportFromTicket() {
  const t = getSelectedTicket();
  if (!t) return;
  $("rAntecedentes").value = t.antecedentes || "";
  $("rActividades").value = t.acciones || "";
  $("rHallazgos").value = t.hallazgos || "";
  $("rDiagnostico").value = t.diagnostico || "";
  $("rRecomendaciones").value = t.recomendaciones || "";
  $("rEstadoFinal").value = t.estadoFinal || "";
}

async function saveReportToTicket() {
  const t = getSelectedTicket();
  if (!t) return;

  const payload = {
    antecedentes: $("rAntecedentes").value,
    acciones: $("rActividades").value,
    hallazgos: $("rHallazgos").value,
    diagnostico: $("rDiagnostico").value,
    recomendaciones: $("rRecomendaciones").value,
    estadoFinal: $("rEstadoFinal").value,
    updatedAt: serverTimestamp()
  };

  await updateDoc(doc(db, "tickets", t.id), payload);
  await loadTickets();
  alert("Ticket actualizado correctamente.");
}

function generatePrompt() {
  const t = getSelectedTicket();
  if (!t) return;

  const key = $("templateSelect").value;
  const prompt = `${templates[key]}

DATOS DEL TICKET:
- Ticket: ${t.ticketId}
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

  $("promptBox").textContent = prompt;
}

function exportCurrentReport() {
  const t = getSelectedTicket();
  if (!t) {
    alert("No hay ticket seleccionado.");
    return;
  }

  const content = `INFORME TÉCNICO

Ticket: ${t.ticketId}
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
  a.download = `${t.ticketId}-informe.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function openModal() {
  $("ticketModal").classList.add("show");
  $("nFecha").value = new Date().toISOString().slice(0, 10);
}

function closeModal() {
  $("ticketModal").classList.remove("show");
}

function clearModal() {
  ["nCliente", "nContacto", "nEquipo", "nUbicacion", "nTecnico", "nDescripcion"].forEach((id) => {
    $(id).value = "";
  });
  $("nPrioridad").value = "Media";
  $("nEstado").value = "Abierto";
}

async function createTicket() {
  const cliente = $("nCliente").value.trim();
  const contacto = $("nContacto").value.trim();
  const equipo = $("nEquipo").value.trim();
  const ubicacion = $("nUbicacion").value.trim();
  const tecnico = $("nTecnico").value.trim();
  const prioridad = $("nPrioridad").value;
  const estado = $("nEstado").value;
  const fecha = $("nFecha").value;
  const descripcion = $("nDescripcion").value.trim();

  if (!cliente || !equipo || !tecnico || !descripcion) {
    alert("Completa cliente, equipo, técnico y descripción.");
    return;
  }

  const nextNumber = String(tickets.length + 1).padStart(3, "0");
  const payload = {
    ticketId: `TK-2026-${nextNumber}`,
    cliente,
    contacto,
    equipo,
    ubicacion,
    tecnico,
    prioridad,
    estado,
    fecha,
    descripcion,
    diagnostico: "Pendiente",
    acciones: "Pendiente",
    antecedentes: "",
    hallazgos: "",
    recomendaciones: "",
    estadoFinal: "",
    createdAt: serverTimestamp(),
    createdBy: currentUser?.email || "anonimo"
  };

  await addDoc(collection(db, "tickets"), payload);
  closeModal();
  clearModal();
  await loadTickets();
}

async function seedDemoData() {
  if (!confirm("Esto insertará la demo base en Firestore.")) return;

  for (const t of defaultTickets) {
    await addDoc(collection(db, "tickets"), {
      ...t,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.email || "anonimo"
    });
  }

  await loadTickets();
  alert("Demo cargada en Firestore.");
}

async function loadTickets() {
  const q = query(collection(db, "tickets"), orderBy("ticketId"));
  const snapshot = await getDocs(q);

  tickets = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));

  if (!selectedTicketId && tickets.length) selectedTicketId = tickets[0].id;
  if (selectedTicketId && !tickets.find((t) => t.id === selectedTicketId) && tickets.length) {
    selectedTicketId = tickets[0].id;
  }

  renderTickets();
  loadReportFromTicket();
}

function selectTicket(id) {
  selectedTicketId = id;
  renderTickets();
  loadReportFromTicket();
}

async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("No fue posible iniciar sesión: " + error.message);
  }
}

async function logoutUser() {
  await signOut(auth);
}

function bindEvents() {
  $("btnLogin").addEventListener("click", loginWithGoogle);
  $("btnLogout").addEventListener("click", logoutUser);
  $("btnNewTicket").addEventListener("click", openModal);
  $("btnExport").addEventListener("click", exportCurrentReport);
  $("btnSeed").addEventListener("click", seedDemoData);
  $("btnRefresh").addEventListener("click", loadTickets);
  $("btnCloseModal").addEventListener("click", closeModal);
  $("btnCreateTicket").addEventListener("click", createTicket);
  $("btnSaveReport").addEventListener("click", saveReportToTicket);
  $("btnLoadReport").addEventListener("click", loadReportFromTicket);
  $("btnGeneratePrompt").addEventListener("click", generatePrompt);
  $("searchInput").addEventListener("input", renderTickets);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  setAuthStatus(user ? `Autenticado: ${user.displayName || user.email}` : "No autenticado");
  try {
    await loadTickets();
  } catch (error) {
    console.error(error);
    $("ticketList").innerHTML = `<div class="ticket-item">Error cargando Firestore. Revisa firebase-config.js y las reglas.</div>`;
  }
});

bindEvents();
