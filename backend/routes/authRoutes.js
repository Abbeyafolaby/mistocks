import { Router } from 'express';
const router = Router();
import { register, login, logout, user } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/user', authMiddleware, user);

export default router;
