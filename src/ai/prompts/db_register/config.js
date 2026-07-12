import { systemDbRegister } from "./systemDbRegister.js";
import { userDbRegister } from "./userDbRegister.js";

export const db_register = {
  system: systemDbRegister,
  user: userDbRegister,
  tokens: 900,
  temperature: 0.3,
  topP: 0.8,
  webSearch: false,
};