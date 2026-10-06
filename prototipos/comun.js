/*
 * Prototipos de Ronda — datos simulados y logica compartida por las dos propuestas.
 * Nada de esto toca la app real: todo vive en memoria y se reinicia al recargar.
 */
(function () {
  const R = (window.Ronda = {});
  const AHORA = Date.now();
  const H = 3600e3;
  const D = 24 * H;
  /** Una fecha a `dias` de hoy, a la hora `hora` en punto. */
  const dia = (dias, hora, min = 0) => {
    const d = new Date(AHORA + dias * D);
    d.setHours(hora, min, 0, 0);
    return d;
  };

  // ---------- Iconos (trazo, 24x24) ----------
  const I = {
    inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    puntos: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M17 20h4v-3"/>',
    regalo: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5h-4z"/>',
    libro: '<path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h14v-4"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.500 8 6.500"/>',
    usuarios: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.500 3-5.500 6.500-5.500s6.500 2 6.500 5.500"/><path d="M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c2.100.600 3.500 2.200 3.500 5.200"/>',
    campana: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    tablero: '<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
    mas: '<circle cx="5" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="19" cy="12" r="1.600"/>',
    sumar: '<path d="M12 5v14M5 12h14"/>',
    restar: '<path d="M5 12h14"/>',
    ok: '<path d="M4.500 12.500l5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    der: '<path d="M9 5l7 7-7 7"/>',
    izq: '<path d="M15 5l-7 7 7 7"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.800-3.800"/>',
    bajar: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lugar: '<path d="M12 21s7-6.200 7-11.500a7 7 0 1 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    salir: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
    editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>',
    pantalla: '<rect x="2.500" y="4" width="19" height="12.500" rx="2"/><path d="M8 20.500h8M12 16.500v4"/>',
    alerta: '<path d="M12 3.500 2.500 20h19z"/><path d="M12 10v4.500M12 17.300v.01"/>',
    enviar: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    birrete: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500M22 9v5"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3.500 6v.01M3.500 12v.01M3.500 18v.01"/>',
    vivo: '<circle cx="12" cy="12" r="2.500"/><path d="M7.500 7.500a6.400 6.400 0 0 0 0 9M16.500 7.500a6.400 6.400 0 0 1 0 9M4.500 4.500a10.600 10.600 0 0 0 0 15M19.500 4.500a10.600 10.600 0 0 1 0 15"/>',
    celular: '<rect x="6.500" y="2.500" width="11" height="19" rx="2.500"/><path d="M11 18h2"/>',
    escudo: '<path d="M12 3l8 3v6c0 4.500-3.300 8-8 9-4.700-1-8-4.500-8-9V6z"/><path d="M9 12l2.200 2.200L15.500 10"/>',
    ojo: '<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cambio: '<path d="M4 8h14l-3.500-3.500M20 16H6l3.500 3.500"/>',
  };
  R.ico = (n, cls = "") =>
    `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ""}</svg>`;

  // ---------- Fechas ----------
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  R.hora = (d) => {
    let h = d.getHours();
    const s = h >= 12 ? "p. m." : "a. m.";
    h = h % 12 || 12;
    return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${s}`;
  };
  R.dia = (d) => `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
  R.fecha = (d) => `${R.dia(d)} · ${R.hora(d)}`;
  R.mes = (d) => MESES[d.getMonth()];
  R.relativo = (d) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const otro = new Date(d); otro.setHours(0, 0, 0, 0);
    const n = Math.round((otro - hoy) / D);
    if (n === 0) return "hoy";
    if (n === 1) return "mañana";
    if (n === -1) return "ayer";
    return n > 0 ? `en ${n} días` : `hace ${-n} días`;
  };
  R.esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  R.iniciales = (n) => (n || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  R.pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  // ---------- Datos simulados ----------
  const docentes = [
    { id: "d1", nombre: "Ing. Roberto Castillo Paz", email: "rcastillo@ronda.test" },
    { id: "d2", nombre: "Inga. Patricia Morales Leiva", email: "" },
    { id: "d3", nombre: "Ing. Luis Fernando Aguilar", email: "" },
  ];
  const c = (codigo, nombre, ciclo, docenteId = null, seccion = "A") => ({ id: "c" + codigo, codigo, nombre, ciclo, docenteId, seccion, jornada: "Sábado" });
  const clases = [
    c("036", "Redes de Computadoras I", "8", "d1"), c("037", "Análisis de Sistemas II", "8"),
    c("038", "Bases de Datos II", "8"), c("039", "Ingeniería de Software", "8"), c("040", "Sistemas Operativos II", "8"),
    c("041", "Redes de Computadoras II", "9", "d1"), c("042", "Administración de Tecnologías de Información", "9"),
    c("043", "Inteligencia Artificial", "9", "d3"), c("044", "Proyecto de Graduación I", "9"), c("045", "Desarrollo Web", "9"),
    c("046", "Telecomunicaciones", "10", "d1"), c("047", "Seminario de Tecnologías de Información", "10", "d2"),
    c("048", "Aseguramiento de la Calidad de Software", "10", "d2"), c("049", "Proyecto de Graduación II", "10"),
    c("050", "Seguridad y Auditoría de Sistemas", "10", "d3"),
  ];
  const act = (id, nombre, lugar, tipo, puntos, estado, inicia, horas, extra = {}) => ({
    id, nombre, lugar, tipo, puntos, estado, inicia, termina: new Date(+inicia + horas * H),
    abre: new Date(+inicia - 0.5 * H), cierra: new Date(+inicia + horas * H), ventanaSeg: 60, corto: id.replace("a", "k"), descripcion: "", radioM: null, ...extra,
  });
  const actividades = [
    act("a1", "Conferencia de Ciberseguridad", "Auditorio central", "global", 1, "cerrada", dia(-28, 9), 3, { descripcion: "Panorama de amenazas actuales y cómo defenderse." }),
    act("a2", "Taller de Inteligencia Artificial", "Laboratorio 3", "global", 1, "cerrada", dia(-21, 10), 3, { descripcion: "Manos a la obra con modelos de lenguaje." }),
    act("a3", "Feria de Proyectos", "Plaza central", "global", 1, "cerrada", dia(-14, 8), 5, { descripcion: "Exposición de proyectos de todos los ciclos." }),
    act("a4", "Hackatón UMG", "Salón de usos múltiples", "extra", 2, "cerrada", dia(-7, 8), 9, { descripcion: "Jornada completa de programación en equipos.", radioM: 200 }),
    act("a5", "Charla de Emprendimiento Tecnológico", "Salón 201", "global", 1, "publicada", new Date(AHORA - 1 * H), 3, { descripcion: "De la idea al primer cliente.", radioM: 150 }),
    act("a6", "Congreso de Ingeniería en Sistemas", "Auditorio central", "global", 1, "publicada", dia(6, 9), 6, { descripcion: "Ponencias de egresados y empresas invitadas." }),
    act("a7", "Visita técnica a centro de datos", "Por definir", "global", 1, "borrador", dia(13, 8), 4),
  ];
  const m = (d, h, mi) => dia(d, h, mi);
  const alumnos = [
    { id: "u1", email: "alumno@ronda.test", clave: "alumno123", rol: "alumno", nombre: "Ana Lucía López Méndez", carne: "0908-22-10001", ciclo: "10", perfil: true,
      clases: ["c046", "c047", "c048", "c049", "c050"], asis: { a1: m(-28, 9, 12), a2: m(-21, 10, 4), a4: m(-7, 8, 21) }, extra: [{ claseId: "c048", puntos: 1, cuando: m(-6, 19, 40) }] },
    { id: "u2", email: "admin@ronda.test", clave: "admin123", rol: "admin", nombre: "Carlos Ruiz Santos", carne: "0908-21-00417", ciclo: "10", perfil: true,
      clases: ["c046", "c050"], asis: { a1: m(-28, 9, 2), a3: m(-14, 8, 30) }, extra: [] },
    { id: "u3", email: "nuevo@ronda.test", clave: "nuevo123", rol: "alumno", nombre: "", carne: "", ciclo: "", perfil: false, clases: [], asis: {}, extra: [] },
    { id: "u4", email: "kfernandez@ronda.test", rol: "alumno", nombre: "Kenneth Fernández Lemus", carne: "0908-23-07296", ciclo: "9", perfil: true,
      clases: ["c041", "c043", "c045"], asis: { a1: m(-28, 9, 20), a2: m(-21, 10, 9), a3: m(-14, 8, 44), a4: m(-7, 8, 15), a5: new Date(AHORA - 42 * 60e3) }, extra: [] },
    { id: "u5", email: "mgarcia@ronda.test", rol: "alumno", nombre: "María José García Tun", carne: "0908-22-11873", ciclo: "10", perfil: true,
      clases: ["c046", "c047", "c048"], asis: { a2: m(-21, 10, 15), a3: m(-14, 9, 1), a5: new Date(AHORA - 35 * 60e3) }, extra: [] },
    { id: "u6", email: "jperez@ronda.test", rol: "alumno", nombre: "José Andrés Pérez Coc", carne: "0908-24-03310", ciclo: "8", perfil: true,
      clases: ["c036", "c038", "c039"], asis: { a1: m(-28, 9, 31), a4: m(-7, 9, 2), a5: new Date(AHORA - 20 * 60e3) }, extra: [{ claseId: "c038", puntos: 2, cuando: m(-5, 12, 0) }] },
    { id: "u7", email: "svasquez@ronda.test", rol: "alumno", nombre: "Sofía Vásquez Ordóñez", carne: "0908-23-09954", ciclo: "9", perfil: true,
      clases: ["c041", "c042", "c043", "c044"], asis: { a1: m(-28, 9, 5), a2: m(-21, 10, 2), a3: m(-14, 8, 12) }, extra: [] },
    { id: "u8", email: "dmorales@ronda.test", rol: "alumno", nombre: "Diego Morales Xicará", carne: "0908-22-10488", ciclo: "10", perfil: true,
      clases: ["c047", "c049", "c050"], asis: { a3: m(-14, 10, 48) }, extra: [] },
    { id: "u9", email: "lramirez@ronda.test", rol: "alumno", nombre: "Lucía Ramírez Batz", carne: "0908-24-01122", ciclo: "8", perfil: true,
      clases: ["c036", "c037", "c040"], asis: { a2: m(-21, 10, 30) }, extra: [] },
  ];
  /** Los que "van llegando" mientras se mira la pantalla En vivo. */
  const colaEnVivo = ["u7", "u8", "u9"];
  const b = (min, alumnoId, actividadId, evento, resultado, extra = {}) => ({
    id: "b" + Math.random().toString(36).slice(2, 8), cuando: new Date(AHORA - min * 60e3), alumnoId, actividadId, evento, resultado,
    origen: evento === "marcaje" && resultado === "ok" ? "qr" : null, dispositivo: "d-" + alumnoId, ip: "190.56.12.8", ...extra,
  });
  const bitacora = [
    b(20, "u6", "a5", "marcaje", "ok"),
    b(26, "u8", "a5", "marcaje", "expirado", { senal: "Varios intentos fallidos seguidos" }),
    b(27, "u8", "a5", "marcaje", "expirado", { senal: "Varios intentos fallidos seguidos" }),
    b(29, "u8", "a5", "marcaje", "expirado", { senal: "Varios intentos fallidos seguidos" }),
    b(35, "u5", "a5", "marcaje", "ok"),
    b(36, "u9", "a5", "marcaje", "fuera_de_zona", { dispositivo: "d-u5", senal: "Mismo dispositivo que otro alumno" }),
    b(42, "u4", "a5", "marcaje", "ok"),
    b(60 * 24 * 5, "u6", null, "reparto_extra", null, { detalle: "2 puntos a Bases de Datos II" }),
    b(60 * 24 * 6, "u1", null, "reparto_extra", null, { detalle: "1 punto a Aseguramiento de la Calidad de Software" }),
    b(60 * 24 * 7, "u1", "a4", "marcaje", "ok"),
    b(60 * 24 * 9, "u7", null, "baja_clase", null, { detalle: "Quitó Desarrollo Web" }),
  ];

  const E = (R.E = {
    sesion: sessionStorage.getItem("ronda-sesion") || null,
    vistaAlumno: false, hoja: null, toast: null, kiosco: null, resultado: null, avisos: false,
    corteExtra: new Date(AHORA + 2 * D + 5 * H), ui: {}, nuevoEnVivo: null,
    docentes, clases, actividades, alumnos, bitacora,
  });

  // ---------- Consultas ----------
  R.yo = () => E.alumnos.find((a) => a.email === E.sesion) || null;
  R.clase = (id) => E.clases.find((x) => x.id === id);
  R.docente = (id) => E.docentes.find((x) => x.id === id);
  R.actividad = (id) => E.actividades.find((x) => x.id === id);
  R.alumno = (id) => E.alumnos.find((x) => x.id === id);
  R.estadoAct = (a) => {
    if (a.estado === "borrador") return "borrador";
    const t = Date.now();
    if (a.estado === "publicada" && t >= +a.abre && t <= +a.cierra) return "abierta";
    return t < +a.abre && a.estado === "publicada" ? "proxima" : "pasada";
  };
  /** Las que ve el alumno: nunca borradores. */
  R.visibles = () => E.actividades.filter((a) => a.estado !== "borrador").sort((x, y) => x.inicia - y.inicia);
  R.abierta = () => R.visibles().find((a) => R.estadoAct(a) === "abierta") || null;
  R.proxima = () => R.visibles().find((a) => R.estadoAct(a) === "proxima") || null;
  R.asistentes = (actId) => E.alumnos.filter((al) => al.asis[actId]).sort((x, y) => y.asis[actId] - x.asis[actId]);
  /** Los puntos no se guardan: se calculan desde asistencias y reparto, igual que en la app real. */
  R.puntos = (al) => {
    const pasadas = R.visibles().filter((a) => R.estadoAct(a) !== "proxima");
    const globales = pasadas.filter((a) => a.tipo === "global");
    const base = globales.filter((a) => al.asis[a.id]).reduce((s, a) => s + a.puntos, 0);
    const ganadoExtra = pasadas.filter((a) => a.tipo === "extra" && al.asis[a.id]).reduce((s, a) => s + a.puntos, 0);
    const repartido = al.extra.reduce((s, x) => s + x.puntos, 0);
    const porClase = al.clases.map((id) => {
      const extra = al.extra.filter((x) => x.claseId === id).reduce((s, x) => s + x.puntos, 0);
      return { clase: R.clase(id), base, extra, total: base + extra };
    });
    return { porClase, base, pasadas, globales, asistidas: pasadas.filter((a) => al.asis[a.id]).length, ganadoExtra, saldo: ganadoExtra - repartido };
  };

  // ---------- Motor ----------
  const acciones = {};
  R.on = (nombre, fn) => (acciones[nombre] = fn);
  R.ruta = () => location.hash.replace(/^#/, "") || "/";
  R.ir = (r) => { if (R.ruta() === r) R.repintar(); else location.hash = r; };
  R.toast = (texto, tipo = "ok") => {
    E.toast = { texto, tipo };
    clearTimeout(R._t);
    R._t = setTimeout(() => { E.toast = null; R.repintar(); }, 2800);
  };
  let rutaPintada = null;
  R.repintar = () => {
    const raiz = document.getElementById("app");
    const activo = document.activeElement;
    const foco = activo && activo.id ? { id: activo.id, a: activo.selectionStart, b: activo.selectionEnd } : null;
    const desliz = {};
    raiz.querySelectorAll("[data-desliz]").forEach((n) => (desliz[n.dataset.desliz] = n.scrollTop));
    const misma = rutaPintada === R.ruta();
    rutaPintada = R.ruta();
    raiz.innerHTML = R.pintar();
    if (misma) raiz.querySelectorAll("[data-desliz]").forEach((n) => { if (desliz[n.dataset.desliz]) n.scrollTop = desliz[n.dataset.desliz]; });
    if (foco) {
      const n = document.getElementById(foco.id);
      if (n) { n.focus(); try { n.setSelectionRange(foco.a, foco.b); } catch {} }
    }
    tic();
  };
  const val = (id) => (document.getElementById(id)?.value ?? "").trim();

  document.addEventListener("click", (ev) => {
    const n = ev.target.closest("[data-accion]");
    if (!n) return;
    if (n.dataset.solo && ev.target !== n) return; // fondo de una hoja: solo el clic directo la cierra
    ev.preventDefault();
    const fn = acciones[n.dataset.accion];
    if (fn && fn(n.dataset, n) !== false) R.repintar();
  });
  document.addEventListener("input", (ev) => {
    const n = ev.target;
    if (!n.dataset || !n.dataset.m) return;
    E.ui[n.dataset.m] = n.type === "checkbox" ? n.checked : n.value;
    if (n.dataset.vivo !== undefined) R.repintar();
  });
  document.addEventListener("change", (ev) => {
    const n = ev.target;
    if (n.dataset && n.dataset.cambio && acciones[n.dataset.cambio]) { acciones[n.dataset.cambio]({ ...n.dataset, valor: n.value }, n); R.repintar(); }
  });
  document.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fn = acciones[ev.target.dataset.envio];
    if (fn && fn(ev.target.dataset, ev.target) !== false) R.repintar();
  });
  window.addEventListener("hashchange", () => { E.hoja = null; E.resultado = null; R.repintar(); });

  // ---------- Acciones compartidas ----------
  const entrar = (al) => {
    E.sesion = al.email; E.vistaAlumno = false; E.ui = {};
    sessionStorage.setItem("ronda-sesion", al.email);
    R.ir(!al.perfil ? "/perfil" : al.rol === "admin" ? "/admin" : "/inicio");
  };
  R.on("ingresar", () => {
    const al = E.alumnos.find((a) => a.email === val("correo").toLowerCase() && a.clave && a.clave === val("clave"));
    if (!al) { E.ui.errorIngreso = "Correo o contraseña incorrectos. Probá con una de las cuentas de demostración."; return; }
    entrar(al);
  });
  R.on("demo", (d) => entrar(E.alumnos.find((a) => a.email === d.email)));
  R.on("salir", () => { E.sesion = null; E.hoja = null; sessionStorage.removeItem("ronda-sesion"); R.ir("/ingreso"); });
  R.on("registrar", () => {
    const correo = val("correo").toLowerCase();
    if (!/.+@.+\..+/.test(correo) || val("clave").length < 8) { E.ui.errorRegistro = "Escribí un correo válido y una contraseña de al menos 8 caracteres."; return; }
    let al = E.alumnos.find((a) => a.email === correo);
    if (!al) { al = { id: "u" + Date.now(), email: correo, clave: val("clave"), rol: "alumno", nombre: "", carne: "", ciclo: "", perfil: false, clases: [], asis: {}, extra: [] }; E.alumnos.push(al); }
    entrar(al);
  });
  R.on("recuperar", () => { E.ui.recuperado = true; });
  R.on("guardar-perfil", () => {
    const yo = R.yo();
    if (!val("p-nombre") || !/^\d{4}\s*-\s*\d{2}\s*-\s*\d{3,6}$/.test(val("p-carne"))) { E.ui.errorPerfil = "Revisá tu nombre y tu carné. El carné va como 0908-22-12345."; return; }
    Object.assign(yo, { nombre: val("p-nombre"), carne: val("p-carne").replace(/\s/g, ""), ciclo: val("p-ciclo"), perfil: true });
    E.ui = { ciclo: yo.ciclo };
    R.toast("Perfil guardado. Ahora elegí tus cursos.");
    R.ir("/cursos");
  });
  R.on("hoja", (d) => { E.hoja = { tipo: d.hoja, id: d.id || null }; });
  R.on("cerrar-hoja", () => { E.hoja = null; });
  R.on("ui", (d) => { E.ui[d.k] = d.v === "true" ? true : d.v === "false" ? false : d.v; });
  R.on("alternar", (d) => { E.ui[d.k] = !E.ui[d.k]; });
  R.on("escanear", (d) => { E.hoja = null; R.ir("/marcar/" + d.id); });
  R.on("marcar", (d) => {
    const yo = R.yo(); const a = R.actividad(d.id);
    let resultado = "ok";
    if (E.ui.simVencido) resultado = "expirado";
    else if (yo.asis[a.id]) resultado = "duplicado";
    else if (R.estadoAct(a) !== "abierta") resultado = "fuera_de_horario";
    else yo.asis[a.id] = new Date();
    E.bitacora.unshift({ id: "b" + Date.now(), cuando: new Date(), alumnoId: yo.id, actividadId: a.id, evento: "marcaje", resultado, origen: resultado === "ok" ? "qr" : null, dispositivo: "d-" + yo.id, ip: "190.56.12.8" });
    E.resultado = resultado;
  });
  R.on("reintentar", () => { E.resultado = null; E.ui.simVencido = false; });
  R.on("paso", (d) => { const k = d.k; const n = (E.ui[k] ?? 1) + Number(d.n); E.ui[k] = Math.max(1, Math.min(Number(d.max), n)); });
  R.on("repartir", () => {
    const yo = R.yo(); const p = R.puntos(yo);
    const claseId = E.ui.rClase || yo.clases[0]; const n = Math.min(E.ui.rPuntos ?? 1, p.saldo);
    if (!claseId || n < 1) return;
    yo.extra.push({ claseId, puntos: n, cuando: new Date() });
    E.ui.rPuntos = 1; E.hoja = null;
    R.toast(`${R.pl(n, "punto sumado", "puntos sumados")} a ${R.clase(claseId).nombre}`);
  });
  R.on("deshacer", (d) => { R.yo().extra.splice(Number(d.i), 1); R.toast("Reparto deshecho. El punto volvió a tu saldo."); });
  R.on("curso", (d) => {
    const yo = R.yo(); const i = yo.clases.indexOf(d.id);
    if (i >= 0) yo.clases.splice(i, 1); else yo.clases.push(d.id);
  });
  R.on("avisos", () => { E.avisos = !E.avisos; R.toast(E.avisos ? "Listo. Te avisamos de las actividades nuevas." : "Avisos apagados en este dispositivo."); });
  R.on("vista-alumno", (d) => { E.vistaAlumno = d.v === "1"; R.ir(E.vistaAlumno ? "/inicio" : "/admin"); });
  R.on("demo-toast", (d) => { R.toast(d.t); });
  // Administracion
  R.on("guardar-actividad", (d) => {
    const nombre = val("f-nombre");
    if (!nombre || !val("f-inicia")) { E.ui.errorAct = "Poné al menos el nombre y cuándo empieza."; return; }
    const inicia = new Date(val("f-inicia")); const tipo = val("f-tipo");
    const datos = { nombre, lugar: val("f-lugar") || null, tipo, puntos: Number(val("f-puntos")) || (tipo === "extra" ? 2 : 1), estado: val("f-estado"), inicia,
      termina: new Date(+inicia + 3 * H), abre: new Date(+inicia - 0.5 * H), cierra: new Date(+inicia + 3 * H), descripcion: val("f-desc"), radioM: Number(val("f-radio")) || null };
    if (d.id) Object.assign(R.actividad(d.id), datos);
    else E.actividades.push({ id: "a" + Date.now(), corto: Math.random().toString(36).slice(2, 4), ventanaSeg: 60, ...datos });
    E.hoja = null; E.ui.errorAct = null;
    R.toast(d.id ? "Cambios guardados." : "Actividad creada.");
  });
  R.on("estado-act", (d) => { R.actividad(d.id).estado = d.v; R.toast(d.v === "publicada" ? "Actividad publicada." : "Actividad cerrada."); });
  R.on("manual", (d) => {
    const q = val("mm-alumno").toLowerCase(); const nota = val("mm-nota");
    const al = q && E.alumnos.find((a) => a.perfil && (a.carne.includes(q) || a.email.includes(q) || a.nombre.toLowerCase().includes(q)));
    if (!al || !nota) { E.ui.errorManual = !al ? "No encontramos a ese alumno. Buscalo por carné, nombre o correo." : "La justificación es obligatoria: queda en la bitácora."; return; }
    if (al.asis[d.id]) { E.ui.errorManual = `${al.nombre} ya tiene asistencia en esta actividad.`; return; }
    al.asis[d.id] = new Date(); al.manual = { ...(al.manual || {}), [d.id]: nota };
    E.bitacora.unshift({ id: "b" + Date.now(), cuando: new Date(), alumnoId: al.id, actividadId: d.id, evento: "marcaje", resultado: "ok", origen: "manual", detalle: nota, dispositivo: "panel", ip: "190.56.12.8" });
    E.ui.errorManual = null; E.hoja = null; E.nuevoEnVivo = al.id;
    R.toast(`Asistencia manual registrada para ${al.nombre.split(" ")[0]}.`);
  });
  R.on("kiosco", (d) => { E.kiosco = d.id || null; E.hoja = null; });
  R.on("docente", (d) => { R.clase(d.id).docenteId = d.valor || null; R.toast(d.valor ? "Catedrático asignado." : "Clase sin catedrático."); });
  R.on("nuevo-docente", () => {
    if (!val("nd-nombre")) return false;
    E.docentes.push({ id: "d" + Date.now(), nombre: val("nd-nombre"), email: "" }); E.hoja = null; R.toast("Catedrático creado.");
  });
  R.on("inscripcion-admin", (d) => {
    const al = R.alumno(d.alumno); const i = al.clases.indexOf(d.id);
    if (i >= 0) al.clases.splice(i, 1); else al.clases.push(d.id);
  });
  R.on("aviso-revisar", () => {
    if (!(E.ui.avTitulo || "").trim() || !(E.ui.avMensaje || "").trim()) { E.ui.errorAviso = "Escribí el título y el mensaje."; return; }
    E.ui.errorAviso = null; E.ui.avPaso = 2;
  });
  R.on("aviso-enviar", () => { E.ui.avPaso = 1; E.ui.avTitulo = ""; E.ui.avMensaje = ""; R.toast("Aviso enviado a 2 dispositivos."); });

  // ---------- QR de demostracion y relojes ----------
  /** Dibuja algo con la forma de un QR. No codifica nada: es solo para que el kiosco se vea real. */
  R.qr = (lienzo, semilla) => {
    const n = 29; const ctx = lienzo.getContext("2d"); const t = lienzo.width / n;
    let s = semilla >>> 0;
    const azar = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, lienzo.width, lienzo.width);
    ctx.fillStyle = "#0b0f14";
    const enOjo = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!enOjo(x, y) && azar() > 0.52) ctx.fillRect(Math.floor(x * t), Math.floor(y * t), Math.ceil(t), Math.ceil(t));
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      ctx.fillStyle = "#0b0f14"; ctx.fillRect(ox * t, oy * t, 7 * t, 7 * t);
      ctx.fillStyle = "#fff"; ctx.fillRect((ox + 1) * t, (oy + 1) * t, 5 * t, 5 * t);
      ctx.fillStyle = "#0b0f14"; ctx.fillRect((ox + 2) * t, (oy + 2) * t, 3 * t, 3 * t);
    }
  };
  let cicloDibujado = null;
  function tic() {
    const ahora = Date.now(); const ciclo = Math.floor(ahora / 60000); const resta = 60 - Math.floor((ahora % 60000) / 1000);
    document.querySelectorAll("[data-cuenta]").forEach((n) => (n.textContent = resta));
    document.querySelectorAll("[data-barra]").forEach((n) => (n.style.width = (resta / 60) * 100 + "%"));
    document.querySelectorAll("canvas[data-qr]").forEach((n) => {
      if (n.dataset.listo !== String(ciclo)) { R.qr(n, ciclo * 7919 + n.dataset.qr.length * 31); n.dataset.listo = String(ciclo); cicloDibujado = ciclo; }
    });
  }
  setInterval(tic, 500);
  // En vivo: mientras se mira la pantalla, van "llegando" alumnos.
  setInterval(() => {
    const r = R.ruta();
    if (!r.startsWith("/admin/vivo/") || E.hoja || E.kiosco) return;
    const a = R.actividad(r.split("/")[3]);
    if (!a || R.estadoAct(a) !== "abierta" || !colaEnVivo.length) return;
    const al = R.alumno(colaEnVivo.shift());
    if (al.asis[a.id]) return;
    al.asis[a.id] = new Date(); E.nuevoEnVivo = al.id;
    E.bitacora.unshift({ id: "b" + Date.now(), cuando: new Date(), alumnoId: al.id, actividadId: a.id, evento: "marcaje", resultado: "ok", origen: "qr", dispositivo: "d-" + al.id, ip: "190.56.12.8" });
    R.repintar();
  }, 6000);

  /** Textos de resultado del marcaje: los de PLANIFICACION.md §7, tal cual. */
  R.textoResultado = (res, a, al) => ({
    ok: { titulo: "¡Asistencia registrada!", detalle: `${a.nombre} · ${R.hora(al.asis[a.id] || new Date())}`, bien: true },
    duplicado: { titulo: `Ya marcaste asistencia en esta actividad a las ${R.hora(al.asis[a.id] || new Date())}.`, detalle: "No hace falta que vuelvas a marcar.", bien: true },
    expirado: { titulo: "El código ya cambió. Escaneá otra vez el de la pantalla.", detalle: "El código del QR cambia cada minuto. Volvé a apuntar la cámara.", bien: false },
    fuera_de_horario: { titulo: "La actividad todavía no abre / ya cerró.", detalle: "Solo se puede marcar dentro del horario de la actividad.", bien: false },
  })[res];
  R.etiqueta = (v) => { if (v === "ok") return "Registrado"; const t = String(v || "").replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };

  R.arrancar = () => {
    // Parametros para abrir una pantalla ya armada (los usa comparar.html):
    // ?como=correo|nadie  &hoja=tipo:id  &res=ok|expirado  &kiosco=id  &vista=alumno
    const P = new URLSearchParams(location.search);
    if (P.get("como")) E.sesion = P.get("como") === "nadie" ? null : P.get("como");
    if (P.get("vista") === "alumno") E.vistaAlumno = true;
    if (P.get("hoja")) { const [tipo, id] = P.get("hoja").split(":"); E.hoja = { tipo, id: id || null }; }
    if (P.get("kiosco")) E.kiosco = P.get("kiosco");
    if (P.get("res") && R.yo()) { if (P.get("res") === "ok") R.yo().asis[R.ruta().split("/")[2]] = new Date(); E.resultado = P.get("res"); }
    if (!E.sesion && !["/ingreso", "/registro", "/recuperar"].includes(R.ruta())) location.hash = "/ingreso";
    R.repintar();
  };
})();
