import express from "express";
import {
  obtenerConversacion,
  enviarMensaje,
  obtenerTimeline,
  obtenerMisPropuestas,
} from "../controllers/Financialagent.controller.js";
import Auth from "../middlewares/auth.middleware.js";

const financialAgentApp = express.Router();

financialAgentApp.get("/conversacion", Auth, obtenerConversacion);
financialAgentApp.post("/conversacion/mensaje", Auth, enviarMensaje);
financialAgentApp.get("/conversacion/timeline", Auth, obtenerTimeline);
financialAgentApp.get('/propuestas/mis-propuestas', Auth, obtenerMisPropuestas);

export default financialAgentApp;