export const userPropuesta = (data_to_analyze) => {
  const { pregunta, perfil, instrumentos, riesgo_esperado, historial_reciente = [] } = data_to_analyze;
  const partes = [];

  partes.push(`PERFIL DEL INVERSIONISTA: ${perfil}`);
  partes.push(`INSTRUMENTOS PROPUESTOS:\n${JSON.stringify(instrumentos)}`);
  partes.push(`RIESGO ESPERADO: ${riesgo_esperado}`);

  if (historial_reciente.length > 0) {
    const texto = historial_reciente
      .map((m) => `[${m.rol === "user" ? "Usuario" : "Agente"}]: ${m.contenido}`)
      .join("\n");
    partes.push(`CONVERSACIÓN RECIENTE:\n${texto}`);
  }
  partes.push(`MENSAJE ACTUAL DEL USUARIO:\n"${pregunta}"`);
  return partes.join("\n\n");
};