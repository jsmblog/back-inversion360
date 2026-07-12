import express from 'express';
import { listarPendientes, aprobar, rechazar, editar } from '../controllers/asesor.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { verificarRol } from '../middlewares/rol.js';

const router = express.Router();

router.use(authMiddleware);
router.use(verificarRol(['asesor']));

router.get('/propuestas/pendientes', listarPendientes);
router.post('/propuestas/:id/aprobar', aprobar);
router.post('/propuestas/:id/rechazar', rechazar);
router.put('/propuestas/:id/editar', editar);

export default router;