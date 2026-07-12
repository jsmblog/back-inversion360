import { MOD_HANDLERS } from "./modHandler.js";
import { AI_PROVIDERS } from "./providers.js";

export const buildAIRequestPayload = (mod, data_to_analyze, files = []) => {
  const handler = MOD_HANDLERS[mod.toLowerCase()];
  if (!handler) throw new Error(`Modo desconocido: ${mod}`);

  const provider = data_to_analyze?.provider || "deepseek";
  const model = data_to_analyze?.model || "deepseek-v4-flash";

  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) throw new Error(`Provider desconocido: ${provider}`);

  const baseSystem = typeof handler.system === "function"
    ? handler.system(data_to_analyze)
    : handler.system;

  const systemContent = data_to_analyze.resumen_estado
    ? `${baseSystem}\n\nESTADO GLOBAL DEL USUARIO (usa esto para responder "qué sigue", "en qué paso voy", etc.):\n${data_to_analyze.resumen_estado}`
    : baseSystem;

  const userContent = handler.user(data_to_analyze, files);

  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];

  const isWebSearch = data_to_analyze?.isWebSearch || handler.webSearch || false;

  const options = {
    model,
    tokens: handler.tokens,
    webSearch: isWebSearch,
    temperature: handler.temperature,
    topP: handler.topP,
  };

  if (provider === "claude" && isWebSearch) {
    options.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];
  }

  return { payload: providerConfig.formatPayload(messages, options), provider };
};