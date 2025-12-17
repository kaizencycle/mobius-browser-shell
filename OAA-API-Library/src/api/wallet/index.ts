/**
 * Mobius Systems - Wallet API Routes Index
 */

import { Router } from 'express';
import balanceRouter from './balance.js';
import founderRouter from './founder.js';

const router = Router();

// Mount wallet routes
router.use(balanceRouter);
router.use(founderRouter);

export default router;
