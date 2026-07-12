const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|replace|exec|execute|call|merge|attach|pragma|vacuum)\b/i;

const SYSTEM_METADATA =
  /\b(information_schema|pg_catalog|pg_shadow|pg_roles|pg_user|sqlite_master|sys\.)\b/i;

export const validarQuerySegura = (query) => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("La IA no generó una consulta válida.");
  }

  const limpia = query.trim().replace(/;\s*$/, "");

  if (limpia.includes(";")) {
    throw new Error("No se permite más de una sentencia SQL por consulta.");
  }

  if (!/^select\s/i.test(limpia)) {
    throw new Error("Solo se permiten consultas de lectura (SELECT).");
  }

  if (FORBIDDEN_KEYWORDS.test(limpia)) {
    throw new Error("La consulta contiene una operación no permitida.");
  }

  if (SYSTEM_METADATA.test(limpia)) {
    throw new Error("La consulta intenta acceder a metadatos del sistema.");
  }

  if (!/:userId\b/.test(limpia)) {
    throw new Error(
      "La consulta debe filtrar los datos usando el parámetro :userId (aislamiento por usuario)."
    );
  }

  return limpia;
};