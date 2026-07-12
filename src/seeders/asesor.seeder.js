import bcrypt from "bcrypt";
import User from "../models/user.js";

const SALT_ROUNDS = 10;

const asesores = [
  {
    name: "Asesor Uno",
    email: "asesor1@inversion360.com",
    password: "Asesor123!",
    rol: "asesor",
    is_active: true,
  },
  {
    name: "Asesor Dos",
    email: "asesor2@inversion360.com",
    password: "Asesor456!",
    rol: "asesor",
    is_active: true,
  },
  {
    name: "Asesor Tres",
    email: "asesor3@inversion360.com",
    password: "Asesor789!",
    rol: "asesor",
    is_active: true,
  },
];

export const seedAsesores = async () => {
  try {
    for (const asesor of asesores) {
      const existing = await User.findOne({ where: { email: asesor.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(asesor.password, SALT_ROUNDS);
        await User.create({
          ...asesor,
          password: hashedPassword,
        });
        console.log(`✅ Asesor creado: ${asesor.email}`);
      } else {
        console.log(`⏭️ Asesor ya existe: ${asesor.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error al seedear asesores:", error);
    throw error;
  }
};