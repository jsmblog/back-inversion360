import express from "express";
import cors    from "cors";

import { PORT }        from "./src/config/config.js";
import { corsOption }  from "./src/config/corsOption.js";
import { sequelize } from "./src/config/database.js";

const app  = express();
const _PORT = PORT || 3000;

app.use(express.json());
app.use(cors(corsOption));

const api = express.Router();
api.use(authRoutes);
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
    await cargarCatalogos();

    app.listen(_PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en el puerto => ${_PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
};

main();