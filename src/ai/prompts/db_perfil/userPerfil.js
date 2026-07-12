export const userPerfil = (data_to_analyze) => {
  const { pregunta, historial_reciente = [], respuestas_parciales = {} } = data_to_analyze;
  const partes = [];

  if (Object.keys(respuestas_parciales).length > 0) {
    partes.push(`RESPUESTAS YA CAPTURADAS:\n${JSON.stringify(respuestas_parciales)}`);
  }
  if (historial_reciente.length > 0) {
    const texto = historial_reciente
      .map((m) => `[${m.rol === "user" ? "Usuario" : "Agente"}]: ${m.contenido}`)
      .join("\n");
    partes.push(`CONVERSACIÓN RECIENTE:\n${texto}`);
  }
  partes.push(`MENSAJE ACTUAL DEL USUARIO:\n"${pregunta}"`);
  return partes.join("\n\n");
};