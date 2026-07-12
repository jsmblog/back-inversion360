export const userDbQuery = (data_to_analyze) => {
  const {
    pregunta,
    historial_reciente = [],
    intencion_pendiente = null,
    resumen_contexto = null,
  } = data_to_analyze;

  const partes = [];

  if (resumen_contexto) {
    partes.push(`RESUMEN DE LA CONVERSACIÓN ANTERIOR:\n${resumen_contexto}`);
  }

  if (historial_reciente.length > 0) {
    const historialTexto = historial_reciente
      .map((m) => `[${m.rol === "user" ? "Usuario" : "Agente"}]: ${m.contenido}`)
      .join("\n");
    partes.push(`CONVERSACIÓN RECIENTE:\n${historialTexto}`);
  }

  if (intencion_pendiente) {
    partes.push(`INTENCIÓN PENDIENTE: ${intencion_pendiente}`);
  }

  partes.push(`MENSAJE ACTUAL DEL USUARIO:\n"${pregunta}"`);

  return partes.join("\n\n");
};