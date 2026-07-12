import express from "express";
import {
  obtenerConversacion,
  enviarMensaje,
  obtenerTimeline,
} from "../controllers/Financialagent.controller.js";
import Auth from "../middlewares/auth.middleware.js";

const financialAgentApp = express.Router();

financialAgentApp.get("/conversacion", Auth, obtenerConversacion);
financialAgentApp.post("/conversacion/mensaje", Auth, enviarMensaje);
financialAgentApp.get("/conversacion/timeline", Auth, obtenerTimeline);

export default financialAgentApp;