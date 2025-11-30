import express from 'express';
import * as playerManager from '../services/playerManager.js';
import * as banManager from '../services/banManager.js';

const router = express.Router();

/**
 * Get all currently connected players
 */
router.get('/', async (req, res, next) => {
  try {
    const players = await playerManager.getActivePlayers();
    const sessionInfo = await playerManager.getSessionInfo();
    
    res.json({
      players,
      session: sessionInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current session information
 */
router.get('/session', async (req, res, next) => {
  try {
    const sessionInfo = await playerManager.getSessionInfo();
    res.json(sessionInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * Kick a player
 */
router.post('/:steamId/kick', async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const { reason } = req.body;
    
    const result = await playerManager.kickPlayer(steamId, reason);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Ban a player
 */
router.post('/:steamId/ban', async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const { reason, duration, playerName } = req.body;
    
    const result = await playerManager.banPlayer(steamId, reason, duration);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Force player to spectator
 */
router.post('/:steamId/spectator', async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const result = await playerManager.forceSpectator(steamId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Send message to player(s)
 */
router.post('/message', async (req, res, next) => {
  try {
    const { message, playerId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await playerManager.sendMessage(message, playerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Next session
 */
router.post('/session/next', async (req, res, next) => {
  try {
    const result = await playerManager.nextSession();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get player history
 */
router.get('/:steamId/history', async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const history = await playerManager.getPlayerHistory(steamId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * Get all active bans
 */
router.get('/bans', async (req, res, next) => {
  try {
    const bans = await banManager.getBans();
    res.json({ bans });
  } catch (error) {
    next(error);
  }
});

/**
 * Add a manual ban
 */
router.post('/bans', async (req, res, next) => {
  try {
    const { steamId, playerName, reason, duration } = req.body;
    
    if (!steamId) {
      return res.status(400).json({ error: 'Steam ID is required' });
    }
    
    const ban = await banManager.addBan({
      steamId,
      playerName,
      reason,
      duration: duration || 0,
      bannedBy: 'admin',
      bannedAt: Date.now()
    });
    
    res.json({ message: 'Ban added', ban });
  } catch (error) {
    next(error);
  }
});

/**
 * Remove a ban
 */
router.delete('/bans/:banId', async (req, res, next) => {
  try {
    const { banId } = req.params;
    const removed = await banManager.removeBan(banId);
    res.json({ message: 'Ban removed', ban: removed });
  } catch (error) {
    next(error);
  }
});

/**
 * Check if a Steam ID is banned
 */
router.get('/bans/check/:steamId', async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const ban = await banManager.checkBan(steamId);
    res.json({ banned: !!ban, ban });
  } catch (error) {
    next(error);
  }
});

export default router;
