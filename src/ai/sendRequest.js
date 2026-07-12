import { parseMultipart } from "./parseMultipart.js";
import { handleError } from "./handleError.js";
import { execute } from "./execute.js";

export const sendRequestToAI = async (req, res) => {

  let data_to_analyze;

  try {
    const { fields } = await parseMultipart(req);
    const { mod, data_to_analyze: raw } = fields;

    if (!raw) return res.status(400).json({ error: "No se recibió datos para analizar" });
    if (!mod) return res.status(400).json({ error: "Se requiere un modo para ejecutar la IA" });

    try {
      data_to_analyze = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "data_to_analyze debe ser un JSON válido" });
    }

    const resultado = await execute(mod, data_to_analyze);
    return res.status(200).json({ response: resultado.parsed });
  } catch (err) {
    return handleError(err, res, err.provider || data_to_analyze?.provider || "deepseek");
  }
};