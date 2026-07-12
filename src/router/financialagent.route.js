import express from "express";
import {
  obtenerConversacion,
  enviarMensaje,
} from "../controllers/Financialagent.controller.js";

const financialAgentApp = express.Router();

financialAgentApp.get("/conversacion", obtenerConversacion);
financialAgentApp.post("/conversacion/mensaje", enviarMensaje);

export default financialAgentApp;