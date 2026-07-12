import { db_answer } from "./prompts/db_answer/config.js";
import { db_query } from "./prompts/db_query/config.js";
import { db_register } from "./prompts/db_register/config.js";

export const MOD_HANDLERS = {
    db_query,
    db_answer,
    db_register,
};
