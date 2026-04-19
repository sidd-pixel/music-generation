/**
 * routes/emotionRoutes.js
 * POST /api/emotion — accepts text, returns detected emotion
 */

import { Router } from 'express';
import { detectEmotion } from '../controllers/emotionController.js';

const router = Router();

router.post('/', detectEmotion);

export default router;
