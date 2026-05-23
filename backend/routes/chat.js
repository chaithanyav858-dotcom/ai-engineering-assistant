import express from 'express';
import { handleChat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat - Handle student questions with fallback support
router.post('/', handleChat);

export default router;
