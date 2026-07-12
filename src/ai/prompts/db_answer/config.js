import { systemDbAnswer } from "./systemDbAnswer.js";
import { userDbAnswer } from "./userDbAnswer.js";

export const db_answer =  {
  system: systemDbAnswer,
  user: userDbAnswer,
  tokens: 500,
  temperature: 0.4,
  topP: 0.8,
  webSearch: false,
};