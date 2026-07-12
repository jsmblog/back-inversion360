import { seedAsesores } from "./asesor.seeder.js";

const run = async () => {
  try {
    await seedAsesores();
    console.log("✅ Seeders ejecutados correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar seeders:", error);
    process.exit(1);
  }
};

run();