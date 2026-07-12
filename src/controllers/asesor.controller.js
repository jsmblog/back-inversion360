import { PropuestaPortafolio, PropuestaRevision, PerfilInversionista, User } from '../models/relations.js';
import { sequelize } from '../config/database.js';

const obtenerVersionReglas = () => {
  return 'v1.0.0';
};

export const listarPendientes = async (req, res) => {
  try {
    const propuestas = await PropuestaPortafolio.findAll({
      where: { estado: 'pendiente' },
      include: [
        {
          model: PerfilInversionista,
          attributes: ['id', 'perfil', 'edad', 'objetivo', 'user_id'],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    return res.status(200).json({ ok: true, data: propuestas });
  } catch (error) {
    console.error('[Asesor] listarPendientes:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al listar propuestas pendientes' });
  }
};

export const aprobar = async (req, res) => {
  const { id } = req.params;
  const { comentarios } = req.body;
  const asesorId = req.user.id;

  const t = await sequelize.transaction();
  try {
    const propuesta = await PropuestaPortafolio.findByPk(id, { transaction: t });
    if (!propuesta) {
      await t.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Propuesta no encontrada' });
    }
    if (propuesta.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La propuesta ya fue revisada' });
    }

    propuesta.estado = 'aprobada';
    await propuesta.save({ transaction: t });

    await PropuestaRevision.create({
      propuesta_id: propuesta.id,
      asesor_id: asesorId,
      accion: 'aprobada',
      comentarios: comentarios || null,
      cambios: null,
      snapshot_reglas: { version: obtenerVersionReglas() }
    }, { transaction: t });

    await t.commit();
    return res.status(200).json({ ok: true, mensaje: 'Propuesta aprobada correctamente' });
  } catch (error) {
    await t.rollback();
    console.error('[Asesor] aprobar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al aprobar propuesta' });
  }
};

export const rechazar = async (req, res) => {
  const { id } = req.params;
  const { comentarios } = req.body;
  if (!comentarios) {
    return res.status(400).json({ ok: false, mensaje: 'Debes proporcionar un comentario para el rechazo' });
  }
  const asesorId = req.user.id;

  const t = await sequelize.transaction();
  try {
    const propuesta = await PropuestaPortafolio.findByPk(id, { transaction: t });
    if (!propuesta) {
      await t.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Propuesta no encontrada' });
    }
    if (propuesta.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La propuesta ya fue revisada' });
    }

    propuesta.estado = 'rechazada';
    await propuesta.save({ transaction: t });

    await PropuestaRevision.create({
      propuesta_id: propuesta.id,
      asesor_id: asesorId,
      accion: 'rechazada',
      comentarios,
      cambios: null,
      snapshot_reglas: { version: obtenerVersionReglas() }
    }, { transaction: t });

    await t.commit();
    return res.status(200).json({ ok: true, mensaje: 'Propuesta rechazada' });
  } catch (error) {
    await t.rollback();
    console.error('[Asesor] rechazar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al rechazar propuesta' });
  }
};

export const editar = async (req, res) => {
  const { id } = req.params;
  const { instrumentos, riesgo_esperado, comentarios } = req.body;
  const asesorId = req.user.id;

  if (!instrumentos && !riesgo_esperado) {
    return res.status(400).json({ ok: false, mensaje: 'Debes enviar al menos instrumentos o riesgo_esperado para editar' });
  }

  const t = await sequelize.transaction();
  try {
    const propuesta = await PropuestaPortafolio.findByPk(id, { transaction: t });
    if (!propuesta) {
      await t.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Propuesta no encontrada' });
    }
    if (propuesta.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ ok: false, mensaje: 'La propuesta ya fue revisada' });
    }

    const cambios = {};
    if (instrumentos) {
      cambios.instrumentos_originales = propuesta.instrumentos;
      propuesta.instrumentos = instrumentos;
    }
    if (riesgo_esperado) {
      cambios.riesgo_original = propuesta.riesgo_esperado;
      propuesta.riesgo_esperado = riesgo_esperado;
    }
    propuesta.estado = 'editada';
    await propuesta.save({ transaction: t });

    await PropuestaRevision.create({
      propuesta_id: propuesta.id,
      asesor_id: asesorId,
      accion: 'editada',
      comentarios: comentarios || null,
      cambios,
      snapshot_reglas: { version: obtenerVersionReglas() }
    }, { transaction: t });

    await t.commit();
    return res.status(200).json({ ok: true, mensaje: 'Propuesta editada', data: propuesta });
  } catch (error) {
    await t.rollback();
    console.error('[Asesor] editar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al editar propuesta' });
  }
};