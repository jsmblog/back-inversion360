export const userDbAnswer = (data_to_analyze) => {
  const {
    pregunta_original,
    razon_query,
    query_valida,
    resultados = [],
    total_filas = 0,
    historial_reciente = [],
    intencion_pendiente = null,
    generar_resumen = false,
    resumen_anterior = null,
    rol = "usuario",
  } = data_to_analyze;

  const partes = [];

  partes.push(`ROL DEL USUARIO: ${rol}`);

  if (resumen_anterior) {
    partes.push(`RESUMEN PREVIO:\n${resumen_anterior}`);
  }

  if (historial_reciente.length > 0) {
    const historialTexto = historial_reciente
      .map((m) => `[${m.rol === "user" ? "Usuario" : "Agente"}]: ${m.contenido}`)
      .join("\n");
    partes.push(`CONVERSACIÓN RECIENTE:\n${historialTexto}`);
  }

  partes.push(`PREGUNTA ORIGINAL DEL USUARIO:\n"${pregunta_original}"`);
  partes.push(`RAZÓN DE LA CONSULTA: ${razon_query}`);
  partes.push(`QUERY VÁLIDA: ${query_valida}`);
  partes.push(`TOTAL DE FILAS: ${total_filas}`);
  partes.push(`RESULTADOS:\n${JSON.stringify(resultados)}`);

  if (intencion_pendiente) {
    partes.push(`INTENCIÓN PENDIENTE: ${intencion_pendiente}`);
  }

  partes.push(`GENERAR_RESUMEN: ${generar_resumen}`);

  return partes.join("\n\n");
};