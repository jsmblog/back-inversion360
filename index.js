import express from "express";
import cors from "cors";
import session from "express-session";
import { PORT, SESSION_SECRET } from "./src/config/config.js";
import { corsOption } from "./src/config/corsOption.js";
import { sequelize } from "./src/config/database.js";
import "./src/models/relations.js";
import financialAgentRouter from "./src/router/financialagent.route.js";
import authRouter from "./src/router/auth.route.js";
import asesorRouter from "./src/router/asesor.route.js";
const app = express();
const _PORT = PORT || 3000;

app.use(express.json());
app.use(cors(corsOption));

app.use(session({
  secret: SESSION_SECRET || "mi-secreto-temporal",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const api = express.Router();
api.use(financialAgentRouter);
api.use(authRouter);
api.use(asesorRouter);
app.use("/api", api);

app.use((err, req, res, _next) => {
  console.error("[GlobalError]", err);
  res.status(500).json({ ok: false, mensaje: "Error interno del servidor.", detalle: err.message });
});

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log("Base de datos conectada.");
    await sequelize.sync({ alter: true });
    app.listen(_PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en el puerto => ${_PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
};

main();