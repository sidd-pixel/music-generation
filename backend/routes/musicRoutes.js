/**
 * routes/musicRoutes.js
 * GET /api/music?emotion=happy&intensity=5 — returns Spotify recommendations
 */

import { Router } from 'express';
import { getRecommendations } from '../controllers/musicController.js';

const router = Router();

router.get('/', getRecommendations);

export default router;
