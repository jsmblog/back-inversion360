import axios from "axios";
import { buildAIRequestPayload } from "./buildAIRequestPayload.js";
import { AI_PROVIDERS } from "./providers.js";
import { parseAIResponse } from "../utils/parseAiResponse.js";

export const execute = async (mod, data_to_analyze) => {
  const { payload, provider } = buildAIRequestPayload(mod, data_to_analyze);
  const providerConfig = AI_PROVIDERS[provider];

  if (!providerConfig) {
    const error = new Error(`Proveedor AI desconocido: ${provider}`);
    error.provider = provider;
    throw error;
  }

  const { data } = await axios.post(providerConfig.url, payload, {
    headers: providerConfig.headers,
  });

  const response = providerConfig.extractResponse(data);
  const result = parseAIResponse(response);
  return result;
};