import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Email y contraseña son requeridos." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales inválidas." });
    }

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: user.id,
        name: user.name,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("[login] Error:", error.message);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor." });
  }
};