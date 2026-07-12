import { perfilamientoSystem } from "../db_answer/perfilamientoSystem.js";
import { userPerfil } from "./userPerfil.js";

export const db_perfil = {
  system: perfilamientoSystem,
  user: userPerfil,
  tokens: 2000,
  temperature: 0.3,
  topP: 0.8,
  webSearch: false,
};