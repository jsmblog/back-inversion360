const REGLAS_PERFIL_VERSION = 1;

const PREGUNTAS = [
  { id: "edad", ponderacion: 2, opciones: { "<25": 5, "25-35": 4, "36-50": 3, ">50": 2 } },
  { id: "objetivo", ponderacion: 3, opciones: { "ahorro": 1, "retiro": 3, "crecimiento": 5 } },
  { id: "horizonte", ponderacion: 3, opciones: { "corto": 1, "medio": 3, "largo": 5 } },
  { id: "tolerancia_perdida", ponderacion: 4, opciones: { "vender": 1, "mantener": 3, "comprar": 5 } },
  { id: "ingresos", ponderacion: 2, opciones: { "bajo": 1, "medio": 3, "alto": 5 } },
  { id: "experiencia", ponderacion: 2, opciones: { "ninguna": 1, "basica": 3, "avanzada": 5 } },
];

const CATALOGO_INSTRUMENTOS = [
  { nombre: "Fondo AAA Renta Fija", categoria: "renta_fija", riesgo: "bajo" },
  { nombre: "Fondo BBB Bonos Corporativos", categoria: "renta_fija", riesgo: "medio" },
  { nombre: "Fondo CCC Acciones Globales", categoria: "renta_variable", riesgo: "alto" },
  { nombre: "Fondo DDD Tecnología", categoria: "renta_variable", riesgo: "alto" },
  { nombre: "Fondo EEE Mixto Defensivo", categoria: "mixto", riesgo: "bajo" },
  { nombre: "Fondo FFF Mixto Equilibrado", categoria: "mixto", riesgo: "medio" },
  { nombre: "Fondo GGG Mixto Agresivo", categoria: "mixto", riesgo: "alto" },
  { nombre: "Fondo HHH Liquidez", categoria: "efectivo", riesgo: "bajo" },
];

const ASIGNACIONES = {
  conservador: { renta_fija: 70, renta_variable: 20, efectivo: 10 },
  moderado: { renta_fija: 50, renta_variable: 40, efectivo: 10 },
  agresivo: { renta_fija: 20, renta_variable: 70, efectivo: 10 },
};

export function calcularPerfil(respuestas) {
  let scoreTotal = 0;
  let maxScore = 0;
  for (const p of PREGUNTAS) {
    const valor = respuestas[p.id];
    const puntaje = p.opciones[valor] || 0;
    scoreTotal += puntaje * p.ponderacion;
    maxScore += 5 * p.ponderacion;
  }
  const scoreNormalizado = (scoreTotal / maxScore) * 100; // 0-100

  let perfil;
  if (scoreNormalizado < 40) perfil = "conservador";
  else if (scoreNormalizado < 70) perfil = "moderado";
  else perfil = "agresivo";

  return { score: scoreNormalizado, perfil, version: REGLAS_PERFIL_VERSION };
}

export function generarPropuesta(perfil) {
  const asignacion = ASIGNACIONES[perfil];
  const instrumentosSeleccionados = [];
  // Elegir instrumentos según categoría
  for (const [categoria, porcentaje] of Object.entries(asignacion)) {
    const disponibles = CATALOGO_INSTRUMENTOS.filter(i => i.categoria === categoria);
    // Simple: tomar el primero de la categoría (o distribuir)
    if (disponibles.length > 0) {
      const instrumento = disponibles[0];
      instrumentosSeleccionados.push({
        nombre: instrumento.nombre,
        categoria: instrumento.categoria,
        porcentaje,
        riesgo: instrumento.riesgo,
      });
    }
  }
  // Riesgo esperado (promedio ponderado)
  const riesgoMap = { bajo: 1, medio: 3, alto: 5 };
  let riesgoPonderado = 0;
  for (const item of instrumentosSeleccionados) {
    riesgoPonderado += riesgoMap[item.riesgo] * (item.porcentaje / 100);
  }
  const riesgoEsperado = riesgoPonderado < 2 ? "bajo" : riesgoPonderado < 4 ? "medio" : "alto";

  return {
    instrumentos: instrumentosSeleccionados,
    riesgo_esperado: riesgoEsperado,
    version_reglas: REGLAS_PERFIL_VERSION,
  };
}