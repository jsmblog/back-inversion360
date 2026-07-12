import { systemDbQuery } from "./systemDbQuery.js";
import { userDbQuery } from "./userDbQuery.js";

export const db_query = {
  system: systemDbQuery,
  user: userDbQuery,
  tokens: 2000,
  temperature: 0.0,
  topP: 0.1,
  webSearch: false,
};