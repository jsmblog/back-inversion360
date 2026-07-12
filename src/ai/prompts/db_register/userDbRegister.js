export const userDbRegister = (data_to_analyze) => {
  const {
    pregunta,
    historial_reciente = [],
    datos_parciales = null, // lo guardamos en sesión
  } = data_to_analyze;

  const partes = [];

  if (datos_parciales) {
    partes.push(`DATOS YA PROPORCIONADOS:\n${JSON.stringify(datos_parciales, null, 2)}`);
  }

  if (historial_reciente.length > 0) {
    const historialTexto = historial_reciente
      .map((m) => `[${m.rol === "user" ? "Usuario" : "Agente"}]: ${m.contenido}`)
      .join("\n");
    partes.push(`CONVERSACIÓN RECIENTE:\n${historialTexto}`);
  }

  partes.push(`MENSAJE ACTUAL DEL USUARIO:\n"${pregunta}"`);

  return partes.join("\n\n");
};