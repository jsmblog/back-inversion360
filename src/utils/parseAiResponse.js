export const cleanJsonString = (raw) => {
  let s = raw.trim();

  // Quita fences de markdown tipo ```json ... ``` o ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Caso: el modelo devolvió el JSON como un string doblemente encodeado
  // (ej: "\"{ \\\"foo\\\": 1 }\"" en vez de { "foo": 1 })
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      const parsedOnce = JSON.parse(s);
      // Solo lo aceptamos si el resultado sigue pareciendo JSON de objeto;
      // si no, mantenemos el string original para no perder contenido válido.
      s = typeof parsedOnce === 'string' ? parsedOnce : s;
    } catch {
      s = s.slice(1, -1);
    }
  }

  // Se queda solo con el primer objeto JSON completo del texto,
  // descartando preámbulos/explicaciones que el modelo pudiera añadir.
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1);
  }

  return s.trim();
};

export const parseAIResponse = (response) => {
  try {
    if (typeof response !== 'string' || !response.trim()) {
      return { isValid: false, error: 'Respuesta vacía o no textual del proveedor de IA.', raw: response };
    }

    const clean = cleanJsonString(response);
    const parsed = JSON.parse(clean);

    return { isValid: true, parsed };
  } catch (error) {
    return { isValid: false, error: error.message, raw: response };
  }
};