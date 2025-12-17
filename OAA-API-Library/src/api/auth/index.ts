/**
 * Mobius Systems - Auth API Routes Index
 */

import { Router } from 'express';
import registerRouter from './register.js';
import loginRouter from './login.js';
import magicLinkRouter from './magic-link.js';
import verifyRouter from './verify.js';

const router = Router();

// Mount auth routes
router.use(registerRouter);
router.use(loginRouter);
router.use(magicLinkRouter);
router.use(verifyRouter);

export default router;
