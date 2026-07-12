import { propuestaSystem } from "../db_answer/propuestaSystem.js";
import { userPropuesta } from "./userPropuesta.js";

export const db_propuesta = {
  system: propuestaSystem,
  user: userPropuesta,
  tokens: 1000,
  temperature: 0.4,
  topP: 0.8,
  webSearch: false,
};